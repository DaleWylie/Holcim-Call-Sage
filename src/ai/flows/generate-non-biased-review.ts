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

const GenerateNonBiasedReviewOutputSchema = z.object({
  review: z.string().describe('The generated review of the call transcript.'),
});
export type GenerateNonBiasedReviewOutput = z.infer<typeof GenerateNonBiasedReviewOutputSchema>;

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
Your task is to review a call and score the analyst based on the provided scoring matrix.
If an audio recording is provided, you must first transcribe it to get the call transcript. If both an audio recording and a text transcript are provided, the audio recording is the primary source of truth. If only a text transcript is provided, use that.

For each criterion, assign a score from 0 to 5 and provide a brief justification based on the transcript.
The scoring scale is as follows:
5 – Excellent: Consistently demonstrated with high quality.
4 – Good: Done well with minor opportunities for improvement.
3 – Acceptable: Met expectations, could be improved.
2 – Needs Improvement: Partially done or lacked quality.
1 – Not Demonstrated: Missed or handled poorly.

Please note: The provided call transcript includes initial metadata from Genesys.
**Crucially, you must extract the analyst's name from the initial metadata (e.g., from a line like 'Jo Read • joined') and use this as the definitive source for the 'Analyst Name/ID' in the review.** This is more reliable than names mentioned in the dialogue.
The other metadata (locale, wait time, dialect, programme, transcriber) should be disregarded for the purpose of scoring the call content.

Finally, provide an overall summary of the call's performance and suggest 2-3 actionable areas for improvement.

---
Call Scoring Matrix:
{{{scoringMatrix}}}

---
Call Transcript (use if no audio provided):
{{{callTranscript}}}
---
Call Audio (transcribe this if present):
{{#if audioRecording}}
{{media url=audioRecording}}
{{/if}}

---
Please provide the review in the following structured format:

**Call Review - [Analyst Name/ID extracted from metadata]**

**Quick Overview Score:**
[A single, concise overall score (e.g., Average Score: X/5 or Overall Rating: Good/Excellent/Needs Improvement) and a very brief, one-sentence summary of the call's performance.]

**Scores:**
- [Criterion 1 Name]: [Score]/5 - [Justification]
- [Criterion 2 Name]: [Score]/5 - [Justification]
...

**Overall Summary:**
[Concise summary of the call's performance, highlighting key strengths and weaknesses.]

**Areas for Improvement:**
1. [Actionable suggestion 1]
2. [Actionable suggestion 2]
3. [Actionable suggestion 3 (optional)]
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
      model = googleAI.model('gemini-2.0-flash-preview');
    } else {
      model = googleAI.model('gemini-1.5-flash');
    }
    const {output} = await prompt({model}, input);
    return output!;
  }
);
