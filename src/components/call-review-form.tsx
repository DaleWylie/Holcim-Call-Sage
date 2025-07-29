"use client";

import React, { useState, useRef } from 'react';
import { generateNonBiasedReview } from '@/ai/flows/generate-non-biased-review';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Binary, ClipboardPaste, Sparkles, AlertCircle, FileAudio, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from './ui/badge';

const HolcimLogo = () => (
    <svg width="150" height="30" viewBox="0 0 150 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.916 23.9583V6.04167H22.75V10.2083H17.25V13.875H22.1667V18.0417H17.25V23.9583H12.9167H12.916Z" fill="#00599C"/>
      <path d="M25.75 23.9583V6.04167H30.0833V23.9583H25.75Z" fill="#00599C"/>
      <path d="M33.0833 23.9583V6.04167H42.9167V10.2083H37.4167V13.875H42.3333V18.0417H37.4167V23.9583H33.0833Z" fill="#00599C"/>
      <path d="M50.5521 16.9687C52.0208 16.5312 52.8958 15.6042 52.8958 14.4167C52.8958 12.8333 51.5312 11.5937 49.3437 11.5937H46V18.1562H49.3437C50.2187 18.1562 50.9271 17.7187 51.3646 17.1562L50.5521 16.9687ZM49.4062 6.04167C54.125 6.04167 57.2917 8.90625 57.2917 12.9062C57.2917 15.4687 55.9375 17.5937 53.6875 18.7708L58.2187 23.9583H53.5L49.1562 18.9687H46V23.9583H41.6667V6.04167H49.4062Z" fill="#00A390"/>
      <path d="M68.5312 15C68.5312 10.3542 65.3646 6.04167 59.9062 6.04167C54.4479 6.04167 51.2812 10.3542 51.2812 15C51.2812 19.6458 54.4479 23.9583 59.9062 23.9583C65.3646 23.9583 68.5312 19.6458 68.5312 15ZM55.6146 15C55.6146 12.5417 57.2083 10.2083 59.9062 10.2083C62.6042 10.2083 64.1979 12.5417 64.1979 15C64.1979 17.4583 62.6042 19.7917 59.9062 19.7917C57.2083 19.7917 55.6146 17.4583 55.6146 15Z" fill="#00A390"/>
      <path d="M69.8333 23.9583V6.04167H74.1667V14.8333L80.5208 6.04167H85.4688L78.2188 15.4271L85.8333 23.9583H80.7083L74.1667 16.5104V23.9583H69.8333Z" fill="#00A390"/>
      <path d="M96.0937 15.4271L88.9062 6.04167H94.1146L98.2812 11.9687L102.51 6.04167H107.458L100.271 15.4271L107.812 23.9583H102.688L98.2812 17.6146L93.875 23.9583H88.5417L96.0937 15.4271Z" fill="#00A390"/>
      <path d="M108.75 23.9583V6.04167H113.083V23.9583H108.75Z" fill="#00A390"/>
      <path d="M124.531 15C124.531 10.3542 121.365 6.04167 115.906 6.04167C110.448 6.04167 107.281 10.3542 107.281 15C107.281 19.6458 110.448 23.9583 115.906 23.9583C121.365 23.9583 124.531 19.6458 124.531 15ZM111.615 15C111.615 12.5417 113.208 10.2083 115.906 10.2083C118.604 10.2083 120.198 12.5417 120.198 15C120.198 17.4583 118.604 19.7917 115.906 19.7917C113.208 19.7917 111.615 17.4583 111.615 15Z" fill="#00A390"/>
      <path d="M134.469 18.0417L132.812 16.2187C131.719 17.4583 130.25 18.1562 128.719 18.1562C126.979 18.1562 125.74 17.1562 125.74 15.8437V6.04167H130.073V15.0937C130.073 15.9687 130.854 16.3437 131.562 16.3437C132.031 16.3437 132.5 16.1562 133.031 15.7187V6.04167H137.365V23.9583H134.823L134.469 18.0417Z" fill="#00A390"/>
      <path d="M0 6.04167H4.33333V23.9583H0V6.04167Z" fill="#00A390"/>
      <path d="M10.1667 15C10.1667 19.6458 7 23.9583 1.5 23.9583H-2.86102e-06V6.04167H1.5C7 6.04167 10.1667 10.3542 10.1667 15ZM5.83333 15C5.83333 12.5417 4.23958 10.2083 1.54167 10.2083H4.33333V19.7917H1.54167C4.23958 19.7917 5.83333 17.4583 5.83333 15Z" fill="#00A390"/>
    </svg>
  );

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
  const [review, setReview] = useState('');
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
    setReview('');
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
      
      if (result.review) {
        setReview(result.review);
      } else {
        setError('No review content received from the AI. Please try again.');
      }

    } catch (err: any) {
      console.error("Error generating review:", err);
      setError(`Failed to generate review: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const canGenerate = !isLoading && (!!callTranscript.trim() || !!audioFile);

  return (
    <div className="bg-card p-6 sm:p-8 rounded-xl shadow-xl w-full max-w-4xl space-y-8">
      <div className="text-center">
        <div className="flex justify-center mb-4">
            <HolcimLogo />
        </div>
        <h1 className="text-3xl font-bold text-foreground font-headline">
          Call Sage
        </h1>
        <p className="text-muted-foreground mt-2">
          AI-Powered Quality Assistant for IT Service Desks
        </p>
      </div>

      <div className="space-y-4">
        <Label htmlFor="scoringMatrix" className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Binary className="h-5 w-5" />
          1. Define Call Scoring Matrix (JSON format)
        </Label>
        <Textarea
          id="scoringMatrix"
          className="w-full p-3 border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition duration-200 ease-in-out font-mono text-sm"
          rows={10}
          value={scoringMatrix}
          onChange={(e) => setScoringMatrix(e.target.value)}
          placeholder={`{\n  "Criterion Name": "Description of what to score (0-5)",\n  "Another Criterion": "Another description"\n}`}
        />
        <p className="text-sm text-muted-foreground">
          Provide your scoring criteria. The AI will use this to score the call.
        </p>
      </div>

      <div className="space-y-4">
        <Label htmlFor="callTranscript" className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ClipboardPaste className="h-5 w-5" />
          2. Input Call Transcript (from Genesys Cloud)
        </Label>
        <Textarea
          id="callTranscript"
          className="w-full p-3 border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition duration-200 ease-in-out text-base"
          rows={15}
          value={callTranscript}
          onChange={(e) => setCallTranscript(e.target.value)}
          placeholder="Paste your Genesys Cloud call transcript here... (Optional if uploading WAV file)"
        />
        <p className="text-sm text-muted-foreground">
          Ensure the transcript is complete. This is optional if you provide a WAV file.
        </p>
      </div>

      <div className="text-center font-bold text-muted-foreground">OR</div>

      <div className="space-y-4">
        <Label htmlFor="audioFile" className="text-lg font-semibold text-foreground flex items-center gap-2">
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
            <div className="flex items-center gap-2 mt-2">
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


      <div className="text-centre">
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
        <div className="bg-gray-50/50 dark:bg-background/50 p-6 rounded-lg border border-border shadow-inner">
          <h2 className="text-2xl font-bold text-foreground mb-4 font-headline flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            Generated Review
          </h2>
          <pre className="whitespace-pre-wrap font-body text-sm text-foreground">
            {review}
          </pre>
          <p className="text-sm text-muted-foreground mt-4">
            This review is generated by AI and should be used as an assistant tool. Always apply human judgement.
          </p>
        </div>
      )}
    </div>
  );
}
