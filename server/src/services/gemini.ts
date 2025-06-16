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
2. Include only the "from manim import *" import statement, no other imports
3. Use descriptive variable names
4. Add comments to explain complex parts
5. Ensure the code is complete and runnable without syntax errors
6. Keep animations clear and visually appealing
7. Never use 'add_coordinate_labels' which is incompatible with this version of Manim
8. Avoid using raw strings (r"string") for paths or labels
9. Use double backslashes (\\\\) in any file paths, not single backslashes
10. Always put proper indentation with 4 spaces for each level
11. Always check your code for syntax errors before returning it
12. Always place all animation code inside the construct method
13. Make sure all self.play() calls have proper arguments
14. Only use Manim classes and methods that are standard and widely supported`;

async function sanitizeCode(code: string): Promise<string> {
    try {
        // Replace tabs with spaces
        code = code.replace(/\t/g, '    ');
        
        // Fix invalid escape sequences
        code = code.replace(/\\(?![\\'"nt])/g, '\\\\');
        
        // Fix any incorrect imports - comment them out rather than removing
        code = code.replace(/^import\s+(?!manim)/gm, '# import ');
        
        // Ensure we have the correct manim import
        if (!code.includes('from manim import *')) {
            code = 'from manim import *\n\n' + code;
        }
        
        // Fix problematic manim features that cause errors
        code = code.replace(/add_coordinate_labels/g, '# add_coordinate_labels (not supported)');
        
        // Fix scene class definition if needed
        const sceneMatch = code.match(/class\s+(\w+)(?:\s*\([^)]*\))?:/);
        if (sceneMatch && !code.includes('(Scene)')) {
            code = code.replace(/class\s+(\w+)(?:\s*\([^)]*\))?:/, 'class $1(Scene):');
        }
        
        // Fix common syntax errors in Manim code
        code = code.replace(/self\.create\(/g, 'self.play(Create(');
        code = code.replace(/self\.play\s*\(\s*\)/g, '# self.play() # Empty play call removed');
        
        // Fix missing self in construct method
        if (code.includes('def construct(') && !code.includes('def construct(self')) {
            code = code.replace(/def\s+construct\s*\(\s*\)/, 'def construct(self)');
        }
        
        // Fix indentation issues
        const lines = code.split('\n');
        let inClass = false;
        let inFunction = false;
        let classIndent = 0;
        let funcIndent = 0;
        
        const fixedLines = lines.map(line => {
            const trimmedLine = line.trimLeft();
            const indent = line.length - trimmedLine.length;
            
            // Handle class definition
            if (trimmedLine.startsWith('class ') && trimmedLine.includes('(Scene):')) {
                inClass = true;
                inFunction = false;
                classIndent = indent;
                return line;
            }
            // Handle construct method
            else if (inClass && trimmedLine.startsWith('def construct(') && !trimmedLine.includes('-> None')) {
                inFunction = true;
                funcIndent = indent;
                // Ensure proper indentation (4 spaces from class)
                return ' '.repeat(classIndent + 4) + trimmedLine;
            }
            // Handle function content
            else if (inClass && inFunction && trimmedLine.length > 0) {
                // If this is clearly content of the function (more indented than function definition)
                if (indent > funcIndent || (indent === 0 && funcIndent > 0)) {
                    // Ensure proper indentation (8 spaces from class start)
                    return ' '.repeat(classIndent + 8) + trimmedLine;
                }
                // If indentation is the same or less than function, we're out of the function
                else if (indent <= funcIndent) {
                    inFunction = false;
                }
            }
            // If line starts with less indentation than class, we're out of the class
            else if (inClass && indent < classIndent && trimmedLine.length > 0) {
                inClass = false;
                inFunction = false;
            }
            
            return line;
        });
        
        return fixedLines.join('\n');
    } catch (error) {
        console.error('Error in sanitizeCode:', error);
        return code; // Return original code if sanitization fails
    }
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

VERY IMPORTANT:
- Code MUST ONLY use "from manim import *" with NO other imports
- Use ONLY standard Manim classes and methods (Scene, Circle, Square, etc.)
- Do NOT use add_coordinate_labels which will cause errors
- Use 4 spaces for indentation (not tabs)
- Properly place all functions INSIDE the Scene class
- All scene actions must be placed in the "construct" method
- Make sure all strings have proper escaping (double backslashes where needed)
- Verify that all your self.play() calls have proper arguments
- Check for common errors like missing parentheses or colons

The code should be complete and runnable with no syntax errors. Only return the Python code, no explanations.
Return the code in a code block.`;

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
        
        let extractedCode: string;
        
        if (!codeMatch) {
            // If no code blocks found, check if the text itself looks like Python code
            if (text.includes('class') && text.includes('Scene') && text.includes('def construct')) {
                extractedCode = text.trim();
            } else {
                throw new Error('Failed to extract valid Manim code from the response');
            }
        } else {
            extractedCode = codeMatch[1].trim();
        }
        
        // Apply sanitization to fix common issues
        const sanitizedCode = await sanitizeCode(extractedCode);
        
        if (!sanitizedCode.includes('class') || !sanitizedCode.includes('Scene') || !sanitizedCode.includes('def construct')) {
            throw new Error('Generated code does not appear to be valid Manim code');
        }

        // Check for common syntax errors
        const potentialErrors = [
            { pattern: /^(?!from manim import \*$)import.*/m, message: 'Only "from manim import *" should be used' },
            { pattern: /add_coordinate_labels/m, message: 'add_coordinate_labels is not supported in this version' },
            { pattern: /class\s+\w+\((?!Scene\))/m, message: 'Scene class must inherit from Scene' },
            { pattern: /\t/g, message: 'Tabs found instead of spaces for indentation' },
            { pattern: /def\s+construct\s*\(\s*\)/m, message: 'Missing "self" in construct method parameters' },
            { pattern: /self\.play\s*\(\s*\)/m, message: 'Empty self.play() call' },
            { pattern: /self\.create\(/m, message: 'Incorrect "self.create()" - should be "self.play(Create())"' },
        ];
        
        let hasFixableErrors = false;
        
        // Just log warnings but don't fail
        for (const check of potentialErrors) {
            const matches = sanitizedCode.match(check.pattern);
            if (matches) {
                console.warn(`Validation warning: ${check.message}`);
                hasFixableErrors = true;
            }
        }
        
        // If we found fixable errors, run one more round of sanitization
        let finalCode = sanitizedCode;
        if (hasFixableErrors) {
            console.log('Fixable errors found - running additional sanitization');
            finalCode = await sanitizeCode(sanitizedCode);
        }

        return finalCode;
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
