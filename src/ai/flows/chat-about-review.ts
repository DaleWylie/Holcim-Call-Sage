
'use server';
/**
 * @fileOverview An AI agent for answering questions about a generated call review.
 *
 * This file defines the AI flow for a conversational chat about a specific call review,
 * using the original transcript, scoring matrix, and generated review as context.
 */

import { ai } from '@/ai/genkit';
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
        You MUST use the provided context, which includes the original transcript, the scoring matrix, and the generated review.
        You MUST use British English spelling and grammar at all times (e.g., "summarise", "behaviour", "centre").
        Be helpful, concise, and directly answer the user's question based on the facts from the call data.
        If the user asks for an opinion or something outside the provided context, politely state that you can only answer questions based on the call data.
        If you reference a specific part of the transcript, mention the timestamp if it's available in the context.

        **Review Context:**
        - **Scoring Matrix Used:**
          {{#each reviewInput.scoringMatrix}}
          - Criterion: {{this.criterion}} (Weight: {{this.weight}})
          - Description: {{this.description}}
          {{/each}}
        
        - **Generated Review Summary:**
          - Agent Name: {{reviewOutput.agentName}}
          - Overall Score: {{reviewOutput.overallScore}}%
          - Quick Summary: {{reviewOutput.quickSummary}}
          - Overall Summary: {{reviewOutput.overallSummary}}
        
        - **Call Data:**
          {{#if reviewInput.audioDataUri}}
          The review was based on an audio file. You have access to the full transcript generated from it.
          Transcript:
          {{{reviewInput.callTranscript}}}
          {{else}}
          The review was based on the following transcript:
          {{{reviewInput.callTranscript}}}
          {{/if}}

        **Conversation History:**
        {{#each chatHistory}}
        - {{role}}: {{content}}
        {{/each}}
        
        **User's New Question:**
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
    try {
      const { output } = await chatAboutReviewPrompt(input, {
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
