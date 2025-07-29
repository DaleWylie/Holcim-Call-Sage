'use server';
/**
 * @fileOverview An AI agent for generating non-biased reviews of call transcripts based on a scoring matrix.
 *
 * - generateNonBiasedReview - A function that generates a call review based on the transcript and scoring matrix.
 * - GenerateNonBiasedReviewInput - The input type for the generateNonBiasedReview function.
 * - GenerateNonBiasedReviewOutput - The return type for the generateNonBiasedReview function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNonBiasedReviewInputSchema = z.object({
  scoringMatrix: z
    .string()
    .describe('A JSON string representing the scoring matrix for the call review.'),
  callTranscript: z.string().describe('The transcript of the call to be reviewed.'),
});
export type GenerateNonBiasedReviewInput = z.infer<typeof GenerateNonBiasedReviewInputSchema>;

const GenerateNonBiasedReviewOutputSchema = z.object({
  review: z.string().describe('The generated review of the call transcript.'),
});
export type GenerateNonBiasedReviewOutput = z.infer<typeof GenerateNonBiasedReviewOutputSchema>;

export async function generateNonBiasedReview(input: GenerateNonBiasedReviewInput): Promise<GenerateNonBiasedReviewOutput> {
  return generateNonBiasedReviewFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNonBiasedReviewPrompt',
  input: {schema: GenerateNonBiasedReviewInputSchema},
  output: {schema: GenerateNonBiasedReviewOutputSchema},
  prompt: `You are a non-biased Quality Management Assistant for an IT Service Desk.
Your task is to review a call transcript and score the analyst based on the provided scoring matrix.
For each criterion, assign a score from 0 to 5 and provide a brief justification based on the transcript.
The scoring scale is as follows:
5 – Excellent: Consistently demonstrated with high quality.
4 – Good: Done well with minor opportunities for improvement.
3 – Acceptable: Met expectations, could be improved.
2 – Needs Improvement: Partially done or lacked quality.
1 – Not Demonstrated: Missed or handled poorly.

Please note: The provided call transcript includes initial metadata from Genesys.
**Crucially, extract the agent\'s name from the initial metadata (e.g., \'Jo Read • joined\') and use it for the \'Analyst Name/ID\' in the review.**
The other metadata (locale, wait time, dialect, program, transcriber) should be disregarded for the purpose of scoring the call content.

Finally, provide an overall summary of the call\'s performance and suggest 2-3 actionable areas for improvement.

---
Call Scoring Matrix:
{{{scoringMatrix}}}

---
Call Transcript:
{{{callTranscript}}}

---
Please provide the review in the following structured format:

**Call Review - [Analyst Name/ID extracted from metadata, otherwise General Review]**

**Quick Overview Score:**
[A single, concise overall score (e.g., Average Score: X/5 or Overall Rating: Good/Excellent/Needs Improvement) and a very brief, one-sentence summary of the call\'s performance.]

**Scores:**
- [Criterion 1 Name]: [Score]/5 - [Justification]
- [Criterion 2 Name]: [Score]/5 - [Justification]
...

**Overall Summary:**
[Concise summary of the call\'s performance, highlighting key strengths and weaknesses.]

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
    const {output} = await prompt(input);
    return output!;
  }
);
