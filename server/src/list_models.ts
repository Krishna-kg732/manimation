import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY as string;
if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in .env file');
}

async function listModels() {
    const genAI = new GoogleGenerativeAI(API_KEY);
    try {
        // @ts-ignore: SDK may not have explicit types for this
        const models = await genAI.listModels();
        console.log('Available models:', models);
    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
