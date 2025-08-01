
'use server';
/**
 * @fileOverview An AI agent for answering questions about a generated call review.
 *
 * This file defines the AI flow for a conversational chat about a specific call review.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import type { GenerateNonBiasedReviewInput, GenerateNonBiasedReviewOutput } from './generate-non-biased-review';

// Define the schema for a single chat message
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Define the input schema for the chat flow
const ChatAboutReviewInputSchema = z.object({
  reviewInput: z.any().describe("The original input object used to generate the review."),
  reviewOutput: z.any().describe("The original output object from the review generation."),
  chatHistory: z.array(ChatMessageSchema).describe("The history of the conversation so far."),
  question: z.string().describe("The user's latest question about the review."),
});

export type ChatAboutReviewInput = z.infer<typeof ChatAboutReviewInputSchema>;

// Define the output schema for the chat flow
const ChatAboutReviewOutputSchema = z.object({
    answer: z.string().describe("The AI's answer to the user's question."),
});

export type ChatAboutReviewOutput = z.infer<typeof ChatAboutReviewOutputSchema>;

// Exported wrapper function to be called by the frontend
export async function chatAboutReview(input: ChatAboutReviewInput): Promise<ChatAboutReviewOutput> {
  return chatAboutReviewFlow(input);
}

// Define the main Genkit flow for the chat
const chatAboutReviewFlow = ai.defineFlow(
  {
    name: 'chatAboutReviewFlow',
    inputSchema: ChatAboutReviewInputSchema,
    outputSchema: ChatAboutReviewOutputSchema,
  },
  async (input) => {
    
    const fullPrompt = `You are an AI Quality Analyst Assistant named "Call Sage". Your task is to answer questions about a call review that has already been generated.
                
      **CRITICAL INSTRUCTIONS:**
      1.  **Primary Source of Truth**: Your primary source of information is the **Call Data** (the transcript). You MUST freshly analyse the transcript to answer the user's question, even if it seems to be answered in the generated review. The review is for context only.
      2.  **Be Specific**: When the user asks for specific details (like a timestamp), you MUST find that detail in the transcript. Do not state that you don't have access to it.
      3.  **Use British English**: You MUST use British English spelling and grammar at all times (e.g., "summarise", "behaviour", "centre").
      4.  **Stay on Topic**: Be helpful, concise, and directly answer the user's question based on the facts from the call data. If the user asks for an opinion or something outside the provided context, politely state that you can only answer questions based on the call data.
          
      **CONTEXT FOR YOUR ANALYSIS:**

      - **Call Data (Primary Source):**
        ${input.reviewInput.callTranscript || 'The review was based on an audio file. You have access to the full transcript generated from it.'}
      
      - **Supporting Context (For Reference Only):**
        - Scoring Matrix Used: ${JSON.stringify(input.reviewInput.scoringMatrix, null, 2)}
        - Current Generated Review: ${JSON.stringify(input.reviewOutput, null, 2)}
      
      **USER'S NEW QUESTION:**
      ${input.question}`;

    try {
      const response = await ai.generate({
        model: googleAI.model('gemini-2.0-flash'),
        prompt: fullPrompt,
        history: input.chatHistory.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
        config: {
            temperature: 0,
        }
      });
      
      const choice = response.choices[0];
      
      if (choice && choice.message.content && choice.message.content[0]?.text) {
         return {
            answer: choice.message.content[0].text,
         };
      }

      throw new Error('The AI service returned an empty or invalid response.');

    } catch (err: any) {
      console.error(`Chat AI flow failed:`, err);
      throw new Error(`AI_REQUEST_FAILED: The AI service was unable to process the chat request. The service may be busy or unavailable. Please wait a moment and try again. Raw error: ${err.message}`);
    }
  }
);
