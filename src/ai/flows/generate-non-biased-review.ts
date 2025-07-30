
'use server';
/**
 * @fileOverview An AI agent for generating non-biased reviews of call transcripts based on a scoring matrix.
 *
 * - generateNonBiasedReview - A function that generates a call review based on the transcript and scoring matrix.
 * - GenerateNonBiasedReviewInput - The input type for the generateNonBiasedReview function.
 * - GenerateNonBiasedReviewOutput - The return type for the generateNonBiasedReview function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const GenerateNonBiasedReviewInputSchema = z.object({
  scoringMatrix: z
    .string()
    .describe('A JSON string representing the scoring matrix for the call review.'),
  callTranscript: z
    .string()
    .describe(
      'The transcript of the call to be reviewed. This may be empty if an audio file is provided.'
    ),
  audioRecording: z
    .string()
    .optional()
    .describe(
      "A recording of the call, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:audio/wav;base64,<encoded_data>'. The AI will transcribe this audio if provided."
    ),
});
export type GenerateNonBiasedReviewInput = z.infer<typeof GenerateNonBiasedReviewInputSchema>;

const ScoreItemSchema = z.object({
  criterion: z.string().describe('The name of the criterion being scored.'),
  score: z.number().describe('The score given for the criterion (0-5).'),
  justification: z.string().describe('A detailed justification for the given score, referencing specific examples or phrases from the call transcript to support the rating.'),
});

const GenerateNonBiasedReviewOutputSchema = z.object({
  analystName: z
    .string()
    .describe("The name of the analyst extracted from the call metadata."),
  quickScore: z
    .string()
    .describe(
      "A single, concise overall score (e.g., '4/5' or 'Good/Excellent')."
    ),
  quickSummary: z
    .string()
    .describe("A very brief, one-sentence summary of the call's performance."),
  scores: z
    .array(ScoreItemSchema)
    .describe('An array of scores and justifications for each criterion.'),
  overallSummary: z
    .string()
    .describe(
      "A concise summary of the call's performance, highlighting key strengths and weaknesses."
    ),
  areasForImprovement: z
    .array(z.string())
    .describe('A list of 2-3 actionable suggestions for improvement.'),
});
export type GenerateNonBiasedReviewOutput = z.infer<
  typeof GenerateNonBiasedReviewOutputSchema
>;

export async function generateNonBiasedReview(
  input: GenerateNonBiasedReviewInput
): Promise<GenerateNonBiasedReviewOutput> {
  return generateNonBiasedReviewFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNonBiasedReviewPrompt',
  input: {schema: GenerateNonBiasedReviewInputSchema},
  output: {schema: GenerateNonBiasedReviewOutputSchema},
  prompt: `You are a non-biased Quality Management Assistant for an IT Service Desk.
Your task is to review a call and score the analyst based on the provided scoring matrix, returning the output as a JSON object.

**Important Instructions on Input:**
- If an audio recording is provided, you **must** transcribe it to get the call transcript. This audio recording is the primary source of truth.
- If both an audio recording and a text transcript are provided, **disregard the text transcript** and use the audio recording exclusively.
- If only a text transcript is provided, use that for your analysis.

For each criterion, assign a score from 0 to 5. Provide a detailed justification for each score, quoting or referencing specific phrases or moments from the call transcript to support your reasoning.
The scoring scale is as follows:
5 – Excellent: Consistently demonstrated with high quality.
4 – Good: Done well with minor opportunities for improvement.
3 – Acceptable: Met expectations, could be improved.
2 – Needs Improvement: Partially done or lacked quality.
1 – Not Demonstrated: Missed or handled poorly.

Please note: The provided call transcript includes initial metadata from Genesys.
**Crucially, you must extract the analyst's name from the initial metadata (e.g., from a line like 'Jo Read • joined') and use this as the definitive source for the 'analystName' field in the output.** This is more reliable than names mentioned in the dialogue.
The other metadata (locale, wait time, dialect, programme, transcriber) should be disregarded for the purpose of scoring the call content.

**Language Requirement:** All output text, including justifications, summaries, and areas for improvement, MUST be in British English (e.g., use 'centre', 'colour', 'behaviour' instead of 'center', 'color', 'behavior').

Finally, provide an overall summary of the call's performance and suggest 2-3 actionable areas for improvement.

---
Call Scoring Matrix:
{{{scoringMatrix}}}

---
Call Transcript (use ONLY if no audio is provided):
{{{callTranscript}}}
---
Call Audio (transcribe this if present, it is the priority):
{{#if audioRecording}}
{{media url=audioRecording}}
{{/if}}

---
Please provide the review as a valid JSON object matching the output schema.
`,
});

const generateNonBiasedReviewFlow = ai.defineFlow(
  {
    name: 'generateNonBiasedReviewFlow',
    inputSchema: GenerateNonBiasedReviewInputSchema,
    outputSchema: GenerateNonBiasedReviewOutputSchema,
  },
  async input => {
    let model;
    if (input.audioRecording) {
      // Use a model with transcription capabilities
      model = googleAI.model('gemini-2.0-flash-preview');
    } else {
      // Use a standard text model
      model = googleAI.model('gemini-1.5-flash');
    }
    const {output} = await prompt({model}, input);
    return output!;
  }
);
