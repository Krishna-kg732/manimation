import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in .env file');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// System prompt to guide Manim code generation
const SYSTEM_PROMPT = `You are an expert in creating Manim animations. Generate Python code for Manim animations based on user prompts.
Always follow these rules:
1. Create a Scene class that inherits from Scene
2. Include all necessary imports from manim
3. Use descriptive variable names
4. Add comments to explain complex parts
5. Ensure the code is complete and runnable
6. Keep animations clear and visually appealing`;

async function sanitizeCode(code: string): Promise<string> {
    // Fix invalid escape sequences
    code = code.replace(/\\(?![\\'"nt])/g, '\\\\');
    return code;
}

export async function generateManimCode(prompt: string): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "models/gemini-2.0-flash",
            generationConfig: {
                temperature: 0.9,
                topK: 60,
                topP: 0.98,
                maxOutputTokens: 2048,
            }
        });

        // Combine prompts into a single string
        const fullPrompt = `${SYSTEM_PROMPT}

Generate Manim code for the following prompt: ${prompt}
The code should be complete and runnable. Only return the Python code, no explanations.
Return the code within Python code blocks like this:
\`\`\`python
your code here
\`\`\``;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: fullPrompt }] }]
        });

        if (!result.response) {
            throw new Error('No response received from Gemini API');
        }

        const text = result.response.text();
        
        // Extract code from response if it's wrapped in markdown code blocks
        const codeMatch = text.match(/```python\n([\s\S]*?)\n```/) || 
                         text.match(/```\n([\s\S]*?)\n```/);
        
        if (!codeMatch) {
            // If no code blocks found, check if the text itself looks like Python code
            if (text.includes('class') && text.includes('Scene') && text.includes('def construct')) {
                return await sanitizeCode(text.trim());
            }
            throw new Error('Failed to extract valid Manim code from the response');
        }

        const code = await sanitizeCode(codeMatch[1].trim());
        if (!code.includes('class') || !code.includes('Scene') || !code.includes('def construct')) {
            throw new Error('Generated code does not appear to be valid Manim code');
        }

        return code;
    } catch (error: any) {
        console.error('Error generating Manim code:', error);
        if (error.response?.error?.message) {
            throw new Error(`Gemini API error: ${error.response.error.message}`);
        }
        throw error;
    }
}

// Example prompt templates
export const PROMPT_TEMPLATES = [
    {
        name: "Basic Animation",
        template: "Create an animation that shows [object] performing [action]",
        example: "Create an animation that shows a circle transforming into a square"
    },
    {
        name: "Mathematical Concept",
        template: "Explain [math concept] using animation with [specific elements]",
        example: "Explain the Pythagorean theorem using animation with a right triangle and squares"
    },
    {
        name: "Text Transform",
        template: "Animate text that says '[text]' and transform it into [final state]",
        example: "Animate text that says 'Hello' and transform it into a star shape"
    },
    {
        name: "Graph Animation",
        template: "Create a graph showing [function] with [specific features]",
        example: "Create a graph showing y=sin(x) with changing amplitude"
    },
    {
        name: "Geometry",
        template: "Show the construction of [geometric shape] with [properties]",
        example: "Show the construction of a regular pentagon with equal sides"
    }
];
