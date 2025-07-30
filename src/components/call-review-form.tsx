"use client";

import React, { useState, useRef, useId } from 'react';
import { generateNonBiasedReview, GenerateNonBiasedReviewOutput } from '@/ai/flows/generate-non-biased-review';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Binary, ClipboardPaste, Sparkles, AlertCircle, FileAudio, X, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from './ui/badge';
import { ReviewDisplay } from './review-display';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

const defaultScoringMatrix = [
  { id: "1", criterion: "1. Greeting & Introduction", description: "Greeted the caller professionally and warmly, introduced self by name and team/department, asked for and confirmed the caller’s name and/or account/ID politely. For this criterion, consider the sentiment and clear intent of the agent's opening remarks, even if specific words (like their name) are not perfectly transcribed. (0-5)" },
  { id: "2", criterion: "2. Communication Style", description: "Maintained a positive, professional tone of voice; spoke clearly and at an appropriate pace; avoided jargon and used language appropriate to caller’s understanding; demonstrated active listening (e.g., verbal nods, paraphrasing). (0-5)" },
  { id: "3", criterion: "3. Issue Handling & Clarity", description: "Asked relevant, probing questions to understand the issue; repeated or summarised issue back to confirm understanding; showed ownership and confidence in addressing the issue; provided clear instructions or updates on what is being done. (0-5)" },
  { id: "4", criterion: "4. Hold Procedure", description: "Asked permission before placing the caller on hold; explained the reason for the hold; thanked the caller when returning from hold; updated caller on progress when returning. (0-5)" },
  { id: "5", criterion: "5. Professionalism & Empathy", description: "Displayed empathy and patience throughout the call; handled frustration or difficult behaviour appropriately; did not interrupt or speak over the caller. (0-5)" },
  { id: "6", criterion: "6. Resolution & Next Steps", description: "Clearly explained the resolution or next steps; verified if the issue was fully resolved to the caller's satisfaction; offered additional help before closing the call. (0-5)" },
  { id: "7", criterion: "7. Call Closure", description: "Summarised the call or resolution; closed the call politely and professionally; used caller’s name during wrap-up. (0-5)" },
  { id: "8", criterion: "8. Compliance & System Use", description: "Checked adherence to internal procedures and documentation: Logged or updated the ticket appropriately during/after call; followed internal procedures, security/compliance checks. (0-5)" },
];

type ScoringItem = {
  id: string;
  criterion: string;
  description: string;
};

export default function CallReviewForm() {
  const [scoringMatrix, setScoringMatrix] = useState<ScoringItem[]>(defaultScoringMatrix);
  const [callTranscript, setCallTranscript] = useState('');
  const [review, setReview] = useState<GenerateNonBiasedReviewOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMatrixChange = (id: string, field: 'criterion' | 'description', value: string) => {
    setScoringMatrix(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  
  const addMatrixItem = () => {
    const newItem: ScoringItem = {
      id: crypto.randomUUID(),
      criterion: `New Criterion ${scoringMatrix.length + 1}`,
      description: ""
    };
    setScoringMatrix(prev => [...prev, newItem]);
  };
  
  const removeMatrixItem = (id: string) => {
    setScoringMatrix(prev => prev.filter(item => item.id !== id));
  };


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
      if (!callTranscript.trim() && !audioFile) {
        setError('Either Call Transcript or a WAV file is required.');
        setIsLoading(false);
        return;
      }
      
      let audioDataUri: string | undefined = undefined;
      if (audioFile) {
        audioDataUri = await fileToDataUri(audioFile);
      }
      
      const matrixForAI = scoringMatrix.reduce((obj, item) => {
        obj[item.criterion] = item.description;
        return obj;
      }, {} as Record<string, string>);

      const result = await generateNonBiasedReview({
        scoringMatrix: JSON.stringify(matrixForAI, null, 2),
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
        <CardTitle className="text-3xl font-bold text-[#1d4370] font-headline">
          Holcim Call Sage
        </CardTitle>
        <CardDescription>
          AI-Powered Quality Assistant for Holcim
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 sm:p-8 space-y-8">
        <div className="space-y-4">
          <Label htmlFor="scoringMatrix" className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
            <Binary className="h-5 w-5" />
            1. Define Call Scoring Matrix
          </Label>
          <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
            {scoringMatrix.map((item, index) => (
              <AccordionItem value={`item-${index}`} key={item.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className='flex items-center justify-between w-full'>
                    <span className='font-semibold text-foreground truncate pr-4'>{item.criterion}</span>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeMatrixItem(item.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 p-2">
                    <div className="space-y-1">
                      <Label htmlFor={`criterion-${item.id}`}>Criterion Name</Label>
                      <Input 
                        id={`criterion-${item.id}`} 
                        value={item.criterion} 
                        onChange={(e) => handleMatrixChange(item.id, 'criterion', e.target.value)}
                        className="font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`description-${item.id}`}>Description</Label>
                      <Textarea 
                        id={`description-${item.id}`} 
                        value={item.description}
                        onChange={(e) => handleMatrixChange(item.id, 'description', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="text-center mt-4">
            <Button variant="outline" onClick={addMatrixItem}>
              <Plus className="mr-2 h-4 w-4" /> Add Criterion
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
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
            className="bg-[#1d4370] hover:bg-[#1d4370]/90 text-white font-bold h-auto py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
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
