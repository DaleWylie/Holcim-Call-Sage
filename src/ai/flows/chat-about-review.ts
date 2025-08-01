
'use server';
/**
 * @fileOverview An AI agent for answering questions about and amending a generated call review.
 *
 * This file defines the AI flow for a conversational chat about a specific call review.
 * The AI can answer questions and, if it identifies an error, can use a tool to amend the original review.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import type { GenerateNonBiasedReviewInput, GenerateNonBiasedReviewOutput } from './generate-non-biased-review';

// Define the schema for a single chat message
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model', 'tool']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const TimestampedStringSchema = z.object({
    text: z.string(),
    timestamp: z.string().optional().describe("The timestamp from the transcript (e.g., [00:01:23]) relevant to the text. Extract it if available."),
});

// Define the schema for the amendGeneratedReview tool
const AmendReviewInputSchema = z.object({
  updates: z.object({
    quickSummary: z.string().optional(),
    overallScore: z.number().optional(),
    scores: z.array(z.object({
      criterion: z.string(),
      score: z.number().int().min(0).max(5),
      justification: z.string(),
    })).optional(),
    overallSummary: z.string().optional(),
    goodPoints: z.array(TimestampedStringSchema).optional(),
    areasForImprovement: z.array(TimestampedStringSchema).optional(),
  }),
  explanation: z.string().describe("A brief explanation to the user about what is being changed and why."),
});


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
    amendedReview: z.any().optional().describe("The full, updated review object if an amendment was made."),
});

export type ChatAboutReviewOutput = z.infer<typeof ChatAboutReviewOutputSchema>;


// Define the tool for amending the review at the top level of the module
const amendGeneratedReview = ai.defineTool(
    {
        name: 'amendGeneratedReview',
        description: 'If the user challenges a part of the generated review and you agree there is an error, use this tool to propose a set of changes to the review. You MUST ask for the user\'s permission before using this tool.',
        inputSchema: AmendReviewInputSchema,
        outputSchema: z.void(),
    },
    async () => {
      // This tool doesn't need to do anything on the server side.
      // Its purpose is to signal to the client that an amendment should occur.
      // The frontend will receive the tool_code and its arguments.
    }
);

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
      5.  **Handling Challenges**: If the user challenges your analysis and you determine, after re-examining the transcript, that you made a mistake, you MUST:
          a. Acknowledge the error clearly.
          b. Propose the specific changes needed for the review.
          c. Ask the user if they would like you to apply these changes.
          d. If they agree, you MUST use the \`amendGeneratedReview\` tool to send the updated information.
          
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
        tools: [amendGeneratedReview],
        config: {
            temperature: 0.1,
        }
      });
      
      if (!response.choices || response.choices.length === 0) {
        throw new Error('The AI service returned a response with no choices. This may be due to safety filters or other content restrictions.');
      }
      
      const choice = response.choices[0];
      const toolCall = choice.toolCalls?.[0];

      if (toolCall) {
        const toolInput = toolCall.args as z.infer<typeof AmendReviewInputSchema>;
        
        // The AI has decided to amend the review.
        // We construct the new review object based on the tool's input.
        const amendedReview = {
          ...input.reviewOutput,
          ...toolInput.updates,
          // If scores are updated, handle them as a merge
          scores: toolInput.updates.scores ? input.reviewOutput.scores.map((origScore: any) => {
            const updatedScore = toolInput.updates.scores?.find(s => s.criterion === origScore.criterion);
            return updatedScore ? { ...origScore, ...updatedScore } : origScore;
          }) : input.reviewOutput.scores,
        };
        
        return {
          answer: toolInput.explanation,
          amendedReview: amendedReview,
        };

      } else if (choice.message.content && choice.message.content[0]?.text) {
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
