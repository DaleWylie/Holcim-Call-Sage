
'use server';
/**
 * @fileOverview A chatbot flow for discussing a generated call review.
 *
 * This file defines a Genkit flow that allows a user to chat with an AI
 * about a specific call review that was previously generated. The AI has
 * full context of the review, scoring matrix, and conversation history.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

// Schema for a single message in the chat history
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

// Define the schema for a single scoring criterion
const ScoringItemSchema = z.object({
  id: z.string(),
  criterion: z.string(),
  description: z.string(),
  weight: z.number(),
});

const TimestampedStringSchema = z.object({
    text: z.string(),
    timestamp: z.string().optional(),
});

// Schema for the previously generated review data
const ReviewDataSchema = z.object({
  agentName: z.string(),
  conversationId: z.string().optional(),
  quickSummary: z.string(),
  overallScore: z.number(),
  scores: z.array(z.object({
    criterion: z.string(),
    score: z.number(),
    justification: z.string(),
  })),
  overallSummary: z.string(),
  goodPoints: z.array(TimestampedStringSchema),
  areasForImprovement: z.array(TimestampedStringSchema),
});

// Input schema for the chat flow
const ChatWithReviewInputSchema = z.object({
  reviewContext: ReviewDataSchema.describe("The full JSON object of the generated review being discussed."),
  scoringMatrix: z.array(ScoringItemSchema).describe("The JSON object for the scoring matrix that was used to generate the review."),
  history: z.array(MessageSchema).describe("The history of the conversation so far."),
  question: z.string().describe("The user's latest question or message."),
});

export type ChatWithReviewInput = z.infer<typeof ChatWithReviewInputSchema>;

// Output schema is just a string for the AI's response
export type ChatWithReviewOutput = string;

// Exported wrapper function to be called by the frontend
export async function chatWithReview(input: ChatWithReviewInput): Promise<ChatWithReviewOutput> {
  return chatWithReviewFlow(input);
}

// Define the Genkit flow for the chatbot
const chatWithReviewFlow = ai.defineFlow(
  {
    name: 'chatWithReviewFlow',
    inputSchema: ChatWithReviewInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    // Construct the prompt with system instructions and context
    const systemPrompt = `
      You are "Call Sage", a friendly and helpful AI Quality Management assistant for Holcim.
      Your role is to discuss the call review you have previously generated. You must be concise, helpful, and refer to the specific data from the review context provided.
      Use British English spelling and grammar (e.g., "summarise", "behaviour").
      Refer to the agent by their first name, which is available in the review context.

      You have access to the full generated review and the scoring matrix that was used. Use this information to answer questions and explain your reasoning.
      When the user asks a question, ground your answer in the facts from the provided JSON data.

      **Review Context:**
      \`\`\`json
      ${JSON.stringify(input.reviewContext, null, 2)}
      \`\`\`

      **Scoring Matrix Context:**
      \`\`\`json
      ${JSON.stringify(input.scoringMatrix, null, 2)}
      \`\`\`
    `;

    // Format the chat history for the model
    const history = input.history.map(msg => ({
        role: msg.role,
        content: [{ text: msg.content }],
    }));

    try {
      const response = await ai.generate({
        model: googleAI.model('gemini-2.0-flash'),
        system: systemPrompt,
        history: history,
        prompt: input.question,
        config: {
            temperature: 0.3,
        }
      });
      
      if (!response.text) {
          throw new Error("The AI service returned an empty response.");
      }
      return response.text;

    } catch (err: any) {
      console.error(`Chat flow failed:`, err);
      throw new Error(`AI_CHAT_FAILED: The AI service was unable to process the chat request. Raw error: ${err.message}`);
    }
  }
);
