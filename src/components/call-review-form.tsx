"use client";

import React, { useState, useRef } from 'react';
import { generateNonBiasedReview, GenerateNonBiasedReviewOutput } from '@/ai/flows/generate-non-biased-review';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Binary, ClipboardPaste, Sparkles, AlertCircle, FileAudio, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from './ui/badge';
import { ReviewDisplay } from './review-display';

const defaultScoringMatrix = `{
  "1. Greeting & Introduction": "Greeted the caller professionally and warmly, introduced self by name and team/department, asked for and confirmed the caller’s name and/or account/ID politely. For this criterion, consider the sentiment and clear intent of the agent's opening remarks, even if specific words (like their name) are not perfectly transcribed. (0-5)",
  "2. Communication Style": "Maintained a positive, professional tone of voice; spoke clearly and at an appropriate pace; avoided jargon and used language appropriate to caller’s understanding; demonstrated active listening (e.g., verbal nods, paraphrasing). (0-5)",
  "3. Issue Handling & Clarity": "Asked relevant, probing questions to understand the issue; repeated or summarised issue back to confirm understanding; showed ownership and confidence in addressing the issue; provided clear instructions or updates on what is being done. (0-5)",
  "4. Hold Procedure": "Asked permission before placing the caller on hold; explained the reason for the hold; thanked the caller when returning from hold; updated caller on progress when returning. (0-5)",
  "5. Professionalism & Empathy": "Displayed empathy and patience throughout the call; handled frustration or difficult behaviour appropriately; did not interrupt or speak over the caller. (0-5)",
  "6. Resolution & Next Steps": "Clearly explained the resolution or next steps; verified if the issue was fully resolved to the caller's satisfaction; offered additional help before closing the call. (0-5)",
  "7. Call Closure": "Summarised the call or resolution; closed the call politely and professionally; used caller’s name during wrap-up. (0-5)",
  "8. Compliance & System Use": "Checked adherence to internal procedures and documentation: Logged or updated the ticket appropriately during/after call; followed internal procedures, security/compliance checks. (0-5)"
}`;

export default function CallReviewForm() {
  const [scoringMatrix, setScoringMatrix] = useState(defaultScoringMatrix);
  const [callTranscript, setCallTranscript] = useState('');
  const [review, setReview] = useState<GenerateNonBiasedReviewOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "audio/wav") {
      setAudioFile(file);
      setError('');
    } else {
      setAudioFile(null);
      setError('Please select a valid .wav file.');
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const generateReview = async () => {
    setIsLoading(true);
    setReview(null);
    setError('');

    try {
      try {
        JSON.parse(scoringMatrix);
      } catch (jsonError) {
        setError('Invalid JSON in Scoring Matrix. Please ensure it is correctly formatted.');
        setIsLoading(false);
        return;
      }

      if (!callTranscript.trim() && !audioFile) {
        setError('Either Call Transcript or a WAV file is required.');
        setIsLoading(false);
        return;
      }
      
      let audioDataUri: string | undefined = undefined;
      if (audioFile) {
        audioDataUri = await fileToDataUri(audioFile);
      }

      const result = await generateNonBiasedReview({
        scoringMatrix: scoringMatrix,
        callTranscript: callTranscript,
        audioRecording: audioDataUri,
      });
      
      if (result) {
        setReview(result);
      } else {
        setError('No review content received from the AI. This might be due to an issue with the AI service or the input provided. Please try again.');
      }

    } catch (err: any) {
      console.error("Error generating review:", err);
      setError(`Failed to generate review. The AI service may be temporarily unavailable or the request may have failed. Please try again later. Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const canGenerate = !isLoading && (!!callTranscript.trim() || !!audioFile);

  return (
    <Card className="w-full max-w-4xl shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-[hsl(var(--foreground))] font-headline">
          Holcim Call Sage
        </CardTitle>
        <CardDescription>
          AI-Powered Quality Assistant for Holcim
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 sm:p-8 space-y-8">
        <div className="space-y-4 text-center">
          <Label htmlFor="scoringMatrix" className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
            <Binary className="h-5 w-5" />
            1. Define Call Scoring Matrix (JSON format)
          </Label>
          <Textarea
            id="scoringMatrix"
            className="w-full p-3 border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition duration-200 ease-in-out font-mono text-sm text-left"
            rows={7}
            value={scoringMatrix}
            onChange={(e) => setScoringMatrix(e.target.value)}
            placeholder={`{\n  "Criterion Name": "Description of what to score (0-5)",\n  "Another Criterion": "Another description"\n}`}
          />
          <p className="text-sm text-muted-foreground">
            Provide your scoring criteria. The AI will use this to score the call.
          </p>
        </div>

        <div className="space-y-4 text-center">
          <Label htmlFor="callTranscript" className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
            <ClipboardPaste className="h-5 w-5" />
            2. Input Call Transcript (from Genesys Cloud)
          </Label>
          <Textarea
            id="callTranscript"
            className="w-full p-3 border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition duration-200 ease-in-out text-base text-left"
            rows={4}
            value={callTranscript}
            onChange={(e) => setCallTranscript(e.target.value)}
            placeholder="Paste your Genesys Cloud call transcript here... (Optional if uploading WAV file)"
          />
          <p className="text-sm text-muted-foreground">
            Ensure the transcript is complete. This is optional if you provide a WAV file.
          </p>
        </div>

        <div className="text-center font-bold text-muted-foreground">OR</div>

        <div className="space-y-4 text-center">
          <Label htmlFor="audioFile" className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
              <FileAudio className="h-5 w-5" />
              3. Upload Call Recording (.wav file)
          </Label>
          <Input
              id="audioFile"
              type="file"
              accept="audio/wav"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Select .wav file
          </Button>
          {audioFile && (
              <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant="secondary">{audioFile.name}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => {
                    setAudioFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}>
                      <X className="h-4 w-4" />
                  </Button>
              </div>
          )}
          <p className="text-sm text-muted-foreground">
              Alternatively, upload the call recording for direct analysis.
          </p>
        </div>


        <div className="text-center">
          <Button
            onClick={generateReview}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-auto py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canGenerate}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Review...
              </span>
            ) : (
              'Generate Non-Bias Review'
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {review && (
          <ReviewDisplay review={review} />
        )}
      </CardContent>
    </Card>
  );
}
