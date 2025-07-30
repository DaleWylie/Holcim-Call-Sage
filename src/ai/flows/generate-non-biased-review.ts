
'use server';
/**
 * @fileOverview An AI agent for generating non-biased reviews of call transcripts based on a scoring matrix.
 *
 * This file defines the AI flow for analyzing a call, either from a transcript or an audio file,
 * against a dynamic scoring matrix provided by the user.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

// Define the schema for a single scoring criterion
const ScoringItemSchema = z.object({
  id: z.string(),
  criterion: z.string().describe('The name of the scoring criterion.'),
  description: z.string().describe('A detailed description of what is expected for this criterion.'),
});

// Define the input schema for the AI flow
const GenerateNonBiasedReviewInputSchema = z.object({
  scoringMatrix: z.array(ScoringItemSchema).describe('The list of criteria to score the call against.'),
  agentName: z.string().optional().describe("The name of the agent being reviewed. If not provided, the AI should try to extract it from the transcript."),
  callTranscript: z.string().optional().describe('The full text transcript of the call.'),
  audioDataUri: z.string().optional().describe("An audio recording of the call, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});

export type GenerateNonBiasedReviewInput = z.infer<typeof GenerateNonBiasedReviewInputSchema>;

// Define the output schema for the AI flow
const GenerateNonBiasedReviewOutputSchema = z.object({
  analystName: z.string().describe("The name of the analyst who handled the call. Extract this from the transcript or use the provided name."),
  quickSummary: z.string().describe("A very brief, one or two-sentence summary of the call's outcome and the agent's performance."),
  quickScore: z.string().describe("An overall score for the call, like '85/100' or 'B+'. Be creative but professional."),
  scores: z.array(z.object({
    criterion: z.string().describe('The specific criterion being scored, matching one from the input matrix.'),
    score: z.number().describe('The score given for this criterion, from 0 to 5.'),
    justification: z.string().describe('A detailed justification for why the score was given, referencing parts of the call transcript.'),
  })).describe('A detailed breakdown of scores for each criterion from the input matrix.'),
  overallSummary: z.string().describe('A detailed overall summary of the call, highlighting strengths and weaknesses of the agent.'),
  areasForImprovement: z.array(z.string()).describe('A list of specific, actionable suggestions for the agent to improve.'),
});

export type GenerateNonBiasedReviewOutput = z.infer<typeof GenerateNonBiasedReviewOutputSchema>;

// Exported wrapper function to be called by the frontend
export async function generateNonBiasedReview(input: GenerateNonBiasedReviewInput): Promise<GenerateNonBiasedReviewOutput> {
  return generateNonBiasedReviewFlow(input);
}

// Define the AI prompt template
const nonBiasedReviewPrompt = ai.definePrompt({
  name: 'nonBiasedReviewPrompt',
  input: { schema: GenerateNonBiasedReviewInputSchema },
  output: { schema: GenerateNonBiasedReviewOutputSchema },
  prompt: `
    You are an expert AI Quality Analyst for Holcim. Your task is to provide a non-biased review of a call center interaction.
    You will be given a scoring matrix and either a call transcript or a call recording.

    **Instructions:**
    1.  **Analyze the Interaction**: Carefully review the provided call data. If an audio file is provided, it is the primary source; transcribe and analyze it. If only a transcript is provided, use that.
    2.  **Identify the Analyst**: If the agent's name is provided as 'agentName', use it. Otherwise, deduce the analyst's name from the context of the conversation (e.g., from their introduction).
    3.  **Score the Call**: Use the provided scoring matrix to evaluate the analyst's performance. For each criterion in the matrix, provide a score from 0 to 5 and a detailed justification for your score, quoting or referencing specific parts of the conversation.
    4.  **Summarize**: Provide a concise "quick summary" and a more "overall summary" of the interaction.
    5.  **Provide Feedback**: List actionable "areas for improvement".

    **Scoring Matrix to Use:**
    {{#each scoringMatrix}}
    -   **Criterion**: {{criterion}}
        **Description**: {{description}}
    {{/each}}

    **Call Data:**
    {{#if audioDataUri}}
    Audio Recording:
    {{media url=audioDataUri}}
    {{else}}
    Transcript:
    {{{callTranscript}}}
    {{/if}}
  `,
});

// Define the main Genkit flow
const generateNonBiasedReviewFlow = ai.defineFlow(
  {
    name: 'generateNonBiasedReviewFlow',
    inputSchema: GenerateNonBiasedReviewInputSchema,
    outputSchema: GenerateNonBiasedReviewOutputSchema,
  },
  async (input) => {
    // We use gemini-1.5-flash as it's fast, cost-effective, and supports multimodal input (audio/text).
    const model = googleAI.model('gemini-1.5-flash');

    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const { output } = await nonBiasedReviewPrompt(input, { model });
        
        // Explicitly check if the output is valid before returning.
        if (output) {
            return output;
        }
        // If output is null, it's a valid attempt but we should retry.
        console.log(`AI returned empty output, attempt ${attempt + 1} of ${maxRetries}. Retrying...`);
        lastError = new Error('AI returned empty output.');

      } catch (err: any) {
        lastError = err;
        console.error(`An error occurred on attempt ${attempt + 1}:`, err.message);
        if (attempt < maxRetries - 1) {
          // Implement exponential backoff: 1s, 4s, 9s
          const delay = Math.pow(attempt + 1, 2) * 1000;
          console.log(`Retrying in ${delay / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we've exhausted retries and still have no output, throw a specific error.
    console.error('AI flow failed after all retries. Last error:', lastError);
    throw new Error('AI_FLOW_FAILED: The AI flow failed to produce a valid review after multiple attempts. The service may be temporarily unavailable. Please try again later.');
  }
);
