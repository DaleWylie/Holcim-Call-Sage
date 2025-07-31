
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
  description: z.string().describe('A detailed description of what is expected for this criterion, including a 0-5 scoring breakdown.'),
  weight: z.number().describe('The weighting of this criterion towards the final score.'),
});

// Define the input schema for the AI flow
const GenerateNonBiasedReviewInputSchema = z.object({
  scoringMatrix: z.array(ScoringItemSchema).describe('The list of criteria to score the call against.'),
  agentName: z.string().describe("The name of the agent being reviewed. This name MUST be used."),
  interactionId: z.string().optional().describe('An optional unique identifier for the call interaction.'),
  callTranscript: z.string().optional().describe('The full text transcript of the call.'),
  audioDataUri: z.string().optional().describe("An audio recording of the call, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});

export type GenerateNonBiasedReviewInput = z.infer<typeof GenerateNonBiasedReviewInputSchema>;

const TimestampedStringSchema = z.object({
    text: z.string(),
    timestamp: z.string().optional().describe("The timestamp from the transcript (e.g., [00:01:23]) relevant to the text. Extract it if available."),
});

// Define the output schema for the AI flow
const GenerateNonBiasedReviewOutputSchema = z.object({
  agentName: z.string().describe("The name of the agent who handled the call. Use the 'agentName' from the input as it is mandatory."),
  interactionId: z.string().optional().describe("The interaction ID from the input. Return it as provided."),
  quickSummary: z.string().describe("A very brief, one or two-sentence summary of the call's outcome and the agent's performance."),
  overallScore: z.number().describe("The overall weighted score for the call, calculated based on the weights provided in the input. The score should be a percentage from 0 to 100. It can be a decimal."),
  scores: z.array(z.object({
    criterion: z.string().describe('The specific criterion being scored, matching one from the input matrix.'),
    score: z.number().int().min(0).max(5).describe('The score given for this criterion, as a whole number (integer) from 0 to 5, based on the detailed scoring breakdown in the description.'),
    justification: z.string().describe('A detailed justification for why the score was given, referencing parts of the call transcript. Do not include the score number or a timestamp in this justification text.'),
  })).describe('A detailed breakdown of scores for each criterion from the input matrix.'),
  overallSummary: z.string().describe('A detailed overall summary of the call, highlighting strengths and weaknesses of the agent. This summary must incorporate and touch upon each of the scoring criteria provided in the input.'),
  goodPoints: z.array(TimestampedStringSchema).describe('A list of specific, positive aspects or strengths demonstrated by the agent during the call, including timestamps if available. Each point should clearly relate to one of the scoring criteria.'),
  areasForImprovement: z.array(TimestampedStringSchema).describe('A list of specific, actionable suggestions for the agent to improve, including timestamps if available. Each point should clearly relate to one of the scoring criteria.'),
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
    You are an expert AI Quality Analyst for Holcim. Your task is to provide a non-biased review of a call centre interaction.
    You MUST use British English spelling and grammar at all times (e.g., "summarise", "behaviour", "centre").

    **CRITICAL Instructions:**
    1.  **Score Strictly by Description**: This is your most important instruction. The 'description' for each criterion is the absolute source of truth. You MUST match the call events to the descriptions provided in the 0-5 scoring guide. Do NOT use your own general knowledge of customer service or infer actions that are not explicitly present in the transcript. You must adhere to the provided scoring guide for each criterion without deviation. If an action described in the scoring guide did not happen (e.g., a call closure), you must assign the score that reflects its absence (e.g., 0/5) and not invent a partial or complete action. The provided call data is the ONLY source of truth.
    2.  **Identify the Agent**: The full 'agentName' is provided in the input, and you MUST use that exact name for the 'agentName' in your output. However, when analysing the transcript for the agent's introduction, you should look for their first name (the first word of the agentName). If you cannot find the agent introducing themselves by their first name, you should still analyse the greeting and introduction based on other conversational cues.
    3.  **Carry over Interaction ID**: If an 'interactionId' is provided in the input, you MUST include it in the 'interactionId' field of your output.
    4.  **Analyze the Interaction**: Carefully review the provided call data. If an audio file is provided, it is the primary source; transcribe and analyse it. If only a transcript is provided, use that.
    5.  **Extract Timestamps (Conditional)**: When providing 'goodPoints' or 'areasForImprovement', you MUST look for a corresponding timestamp in the transcript (e.g., [00:01:23] or a similar format). If you find a relevant timestamp, you must extract it and place it in the 'timestamp' field. For the 'justification' field in the 'scores' array, you MUST NOT include a timestamp.
    6.  **Timestamp Uniqueness**: Avoid referencing the exact same timestamp multiple times within the same list (e.g., in 'goodPoints' or 'areasForImprovement'), unless it is to highlight a completely different aspect of the interaction. Each reference should ideally provide new value.
    7.  **Justification Rule**: The 'justification' text must explain the reasoning for the score by referencing specific parts of the conversation. It must NOT include the score number itself (e.g., do not write "Score: 4/5" in the justification).
    8.  **Calculate Overall Score**: You MUST calculate the 'overallScore'. Take the score for each criterion (from 0 to 5) and multiply it by its respective weight. The sum of these weighted scores divided by the sum of the maximum possible weighted score will give you a total out of 100. This will be the “Overall Score” as a percentage. Only criteria with a weight > 0 should be included.
    9.  **Summarise**: Provide a concise "quick summary" and a more "overall summary" of the interaction. The 'overallSummary' MUST touch upon every single criterion from the scoring matrix.
    10. **Highlight Strengths & Feedback**: Identify specific things the agent did well under 'goodPoints' and list actionable 'areasForImprovement'. Every point you list under 'goodPoints' and 'areasForImprovement' must clearly relate to one of the criteria from the scoring matrix.
    11. **Timestamp Integrity**: The timestamps you extract MUST exist in the provided transcript. Do not invent or hallucinate timestamps. If you refer to an event at a specific time, that time must be present in the source text.

    **Scoring Matrix to Use:**
    {{#each scoringMatrix}}
    -   **Criterion**: {{criterion}} (Weight: {{weight}})
        **Description**: {{description}}
    {{/each}}

    **Call Data:**
    Agent's Name (to be used): {{agentName}}
    {{#if interactionId}}
    Interaction ID (to be used): {{interactionId}}
    {{/if}}
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
    const model = googleAI.model('gemini-2.0-flash');

    try {
      const { output } = await nonBiasedReviewPrompt(input, { 
        model,
        config: {
          temperature: 0,
        } 
      });
      
      if (output) {
          // Calculate the weighted score
          let totalAchievedPoints = 0;
          let totalPossiblePoints = 0;

          const scoringMap = new Map(input.scoringMatrix.map(item => [item.criterion, { weight: item.weight }]));

          for (const scoreItem of output.scores) {
              const criterionDetails = scoringMap.get(scoreItem.criterion);
              if (criterionDetails && criterionDetails.weight > 0) {
                  totalAchievedPoints += scoreItem.score * criterionDetails.weight;
                  totalPossiblePoints += 5 * criterionDetails.weight; // Max score is 5 for each criterion
              }
          }

          const overallScore = (totalPossiblePoints > 0) ? (totalAchievedPoints / totalPossiblePoints) * 100 : 0;

          return {
            ...output,
            agentName: output.agentName,
            interactionId: input.interactionId, // Ensure interactionId is passed through
            overallScore: overallScore,
          };
      }
      
      // If the AI returns a null/undefined output without throwing, we'll treat it as an error.
      throw new Error('The AI service returned an empty or invalid response.');

    } catch (err: any) {
      console.error(`AI flow failed:`, err);
      // Re-throw a new error with a clear message for the frontend to handle.
      // This helps abstract the details from the UI error message.
      throw new Error(`AI_REQUEST_FAILED: The AI service was unable to process the request. The service may be busy or unavailable. Please wait a moment and try again. Raw error: ${err.message}`);
    }
  }
);
