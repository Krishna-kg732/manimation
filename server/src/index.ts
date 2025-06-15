import express, { Request, Response } from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import { generateManimCode, PROMPT_TEMPLATES } from './services/gemini';
import { uploadToS3 } from './s3';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = 3001;

// Ensure media directories exist
const mediaDir = path.join(__dirname, '../media');
const videosDir = path.join(mediaDir, 'videos');
if (!require('fs').existsSync(mediaDir)) {
    require('fs').mkdirSync(mediaDir);
}
if (!require('fs').existsSync(videosDir)) {
    require('fs').mkdirSync(videosDir);
}

app.use(cors());
app.use(express.json());

// Serve static files from the media directory
app.use('/videos', express.static(path.join(__dirname, '../media/videos')));

// Get prompt templates
app.get('/prompt-templates', (req: Request, res: Response) => {
  res.json(PROMPT_TEMPLATES);
});

interface GenerateAnimationRequest {
  prompt: string;
}

app.post('/generate-animation', (req: Request<{}, any, GenerateAnimationRequest>, res: Response) => {
  (async () => {
    try {
      const { prompt, userId } = req.body as GenerateAnimationRequest & { userId?: string };

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // First, generate Manim code using Gemini
    let manimCode;
    try {
      manimCode = await generateManimCode(prompt);
    } catch (error: any) {
      console.error('Error generating Manim code:', error);
      return res.status(500).json({
        error: 'Failed to generate animation code',
        details: error?.message || 'Unknown error'
      });
    }

    // Create a promise to handle the Python process
    const generateAnimation = () => new Promise<string>((resolve, reject) => {
      const pythonProcess = spawn('python', [
        '-c',
        `
import sys
sys.path.append('${__dirname}')
from manim_generator import AnimationGenerator
generator = AnimationGenerator(output_dir='media/videos')
try:
    video_path = generator.generate_animation_from_code("""${manimCode}""", """${prompt}""")
    print(video_path)
except Exception as e:
    print("ERROR: " + str(e), file=sys.stderr)
    sys.exit(1)
        `
      ]);

      let videoPath = '';
      let errorOutput = '';
      
      pythonProcess.stdout.on('data', (data) => {
        videoPath += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error('Python stderr:', data.toString());
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Animation generation failed: ${errorOutput}`));
        } else {
          resolve(videoPath.trim());
        }
      });
    });    // Generate the animation
    try {
      const videoPath = await generateAnimation();
      // S3 upload logic
      const uid = userId || uuidv4();
      const s3Url = await uploadToS3(videoPath, uid);
      res.json({ videoUrl: s3Url, userId: uid });
    } catch (error: any) {
      console.error('Error generating animation:', error);
      res.status(500).json({
        error: 'Failed to generate animation',
        details: error?.message || 'Unknown error'
      });
    }
  } catch (error: any) {
    console.error('Unexpected error:', error);
    res.status(500).json({
      error: 'An unexpected error occurred',
      details: error?.message || 'Unknown error'
    });
  }
  })();
});

// Test endpoint for generating a simple animation
app.post('/test-animation', (req: Request, res: Response) => {
  (async () => {
  try {
    // Create a promise to handle the Python process
    const generateTestAnimation = () => new Promise<string>((resolve, reject) => {
      const pythonProcess = spawn('python', [
        '-c',
        `
import sys
sys.path.append('${__dirname}')
from manim_generator import AnimationGenerator
generator = AnimationGenerator(output_dir='media/videos')
try:
    video_path = generator.generate_test_animation()
    print(video_path)
except Exception as e:
    print("ERROR: " + str(e), file=sys.stderr)
    sys.exit(1)
        `
      ]);

      let videoPath = '';
      let errorOutput = '';
      
      pythonProcess.stdout.on('data', (data) => {
        videoPath += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error('Python stderr:', data.toString());
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Animation generation failed: ${errorOutput}`));
        } else {
          resolve(videoPath.trim());
        }
      });
    });    const videoPath = await generateTestAnimation();
    const videoUrl = `/videos/${path.basename(videoPath)}`;
    res.json({ videoUrl });
  } catch (error: any) {
    console.error('Error generating test animation:', error);
    res.status(500).json({
      error: 'Failed to generate test animation',
      details: error?.message || 'Unknown error'
    });
  }
  })();
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
