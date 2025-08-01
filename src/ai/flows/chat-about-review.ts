
'use server';
/**
 * @fileOverview An AI agent for answering questions about a generated call review.
 *
 * This file defines the AI flow for a conversational chat about a specific call review,
 * using the original transcript, scoring matrix, and generated review as context.
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

// Define the AI prompt template
const chatAboutReviewPrompt = ai.definePrompt({
    name: 'chatAboutReviewPrompt',
    input: { schema: ChatAboutReviewInputSchema },
    output: { schema: ChatAboutReviewOutputSchema },
    prompt: `
        You are an AI Quality Analyst Assistant named "Call Sage". Your task is to answer questions about a call review that has already been generated.
        
        **CRITICAL INSTRUCTIONS:**
        1.  **Primary Source of Truth**: Your primary source of information is the **Call Data** (the transcript). You MUST freshly analyse the transcript to answer the user's question, even if it seems to be answered in the generated review. The review is for context only.
        2.  **Be Specific**: When the user asks for specific details (like a timestamp), you MUST find that detail in the transcript. Do not state that you don't have access to it.
        3.  **Use British English**: You MUST use British English spelling and grammar at all times (e.g., "summarise", "behaviour", "centre").
        4.  **Stay on Topic**: Be helpful, concise, and directly answer the user's question based on the facts from the call data. If the user asks for an opinion or something outside the provided context, politely state that you can only answer questions based on the call data.
        
        **CONTEXT FOR YOUR ANALYSIS:**

        **1. Call Data (Primary Source):**
          {{#if reviewInput.audioDataUri}}
          The review was based on an audio file. You have access to the full transcript generated from it.
          Transcript:
          {{{reviewInput.callTranscript}}}
          {{else}}
          The review was based on the following transcript:
          {{{reviewInput.callTranscript}}}
          {{/if}}

        **2. Supporting Context (For Reference Only):**
        - **Scoring Matrix Used:**
          {{#each reviewInput.scoringMatrix}}
          - Criterion: {{this.criterion}} (Weight: {{this.weight}})
          {{/each}}
        
        - **Generated Review Summary:**
          - Agent Name: {{reviewOutput.agentName}}
          - Overall Score: {{reviewOutput.overallScore}}%
          - Quick Summary: {{reviewOutput.quickSummary}}
        
        **CONVERSATION HISTORY:**
        {{#each chatHistory}}
        - {{role}}: {{content}}
        {{/each}}
        
        **USER'S NEW QUESTION:**
        {{question}}
    `,
});


// Define the main Genkit flow for the chat
const chatAboutReviewFlow = ai.defineFlow(
  {
    name: 'chatAboutReviewFlow',
    inputSchema: ChatAboutReviewInputSchema,
    outputSchema: ChatAboutReviewOutputSchema,
  },
  async (input) => {
    const model = googleAI.model('gemini-2.0-flash');

    try {
      const { output } = await chatAboutReviewPrompt(input, {
        model,
        config: {
            temperature: 0.1,
        }
      });
      
      if (!output) {
        throw new Error('The AI service returned an empty or invalid response.');
      }
      return output;

    } catch (err: any) {
      console.error(`Chat AI flow failed:`, err);
      throw new Error(`AI_REQUEST_FAILED: The AI service was unable to process the chat request. The service may be busy or unavailable. Please wait a moment and try again. Raw error: ${err.message}`);
    }
  }
);
