
'use server';
/**
 * @fileOverview An AI agent for answering questions about a generated call review.
 *
 * This file defines the AI flow for a conversational chat about a specific call review.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

// Define the schema for a single chat message
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Define the input schema for the chat flow
const ChatAboutReviewInputSchema = z.object({
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
    
    try {
      const response = await ai.generate({
        model: googleAI.model('gemini-2.0-flash'),
        prompt: input.question,
        history: input.chatHistory.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
        config: {
            temperature: 0,
        }
      });
      
      if (!response.choices || response.choices.length === 0 || !response.choices[0].message?.content) {
        throw new Error('The AI service returned a response with no choices. This may be due to safety filters or other content restrictions.');
      }
      
      const choice = response.choices[0];
      
      if (choice.message.content[0]?.text) {
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
