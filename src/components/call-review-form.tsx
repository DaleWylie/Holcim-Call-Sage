
"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Binary, ClipboardPaste, Sparkles, AlertCircle, FileAudio, X, Plus, Trash2, Settings, ChevronDown, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from './ui/badge';
import { ReviewDisplay } from './review-display';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SettingsDialog } from './settings-dialog';
import { generateNonBiasedReview, GenerateNonBiasedReviewOutput } from '@/ai/flows/generate-non-biased-review';
import { useToast } from '@/hooks/use-toast';

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

// Helper to convert a File to a Base64 Data URI
const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as Data URI'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};


export default function CallReviewForm() {
  const [scoringMatrix, setScoringMatrix] = useState<ScoringItem[]>(defaultScoringMatrix);
  const [agentName, setAgentName] = useState('');
  const [callTranscript, setCallTranscript] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [criterionToDelete, setCriterionToDelete] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<GenerateNonBiasedReviewOutput | null>(null);
  const { toast } = useToast();

  const handleGenerateReview = async () => {
    setIsLoading(true);
    setError(null);
    setReview(null);
    
    try {
      const audioDataUri = audioFile ? await fileToDataUri(audioFile) : undefined;
      
      const result = await generateNonBiasedReview({
        scoringMatrix,
        agentName: agentName.trim() || undefined,
        callTranscript: callTranscript.trim() || undefined,
        audioDataUri,
      });

      setReview(result);
    } catch (e: any) {
      console.error(e);
      let errorMessage = "An unexpected error occurred.";
      if (e.message) {
        errorMessage = e.message;
      }
      setError(errorMessage);
       toast({
        variant: "destructive",
        title: "Error Generating Review",
        description: "Please check your settings or try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };


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
  
  const confirmRemoveItem = () => {
    if (criterionToDelete) {
      setScoringMatrix(prev => prev.filter(item => item.id !== criterionToDelete));
      setCriterionToDelete(null);
    }
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "audio/wav") {
      setAudioFile(file);
    } else {
      setAudioFile(null);
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please select a .wav file.",
      });
    }
  };

  const canGenerate = !isLoading && (!!callTranscript.trim() || !!audioFile);

  return (
    <>
    <div className="w-full max-w-6xl">
    <Card className="shadow-xl relative">
       <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      <CardHeader className="text-center">
        <CardTitle className="text-4xl font-extrabold text-primary font-headline">
          Holcim Call Sage
        </CardTitle>
        <CardDescription>
          AI-Powered Quality Assistant for Holcim
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 sm:p-8 space-y-8">
        <div className="flex flex-col md:flex-row gap-8">
            {/* Left Column */}
            <div className="md:w-1/2 space-y-4">
              <Label htmlFor="scoringMatrix" className="text-lg font-semibold text-primary flex items-center justify-center gap-2">
                <Binary className="h-5 w-5" />
                1. Define Call Scoring Matrix
              </Label>
              <Accordion type="multiple" className="w-full">
                {scoringMatrix.map((item) => (
                  <AccordionItem value={item.id} key={item.id} className="py-0">
                    <div className="flex items-center w-full group">
                      <AccordionTrigger className="flex-1 hover:no-underline pr-4 py-2 text-left">
                        <span className='font-semibold text-foreground truncate'>{item.criterion}</span>
                      </AccordionTrigger>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-transparent rounded-full mr-2 shrink-0" onClick={() => setCriterionToDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <AccordionContent>
                      <div className="space-y-2 p-2">
                        <div className="space-y-1">
                          <Label htmlFor={`criterion-${item.id}`} className="text-primary">Criterion Name</Label>
                          <Input 
                            id={`criterion-${item.id}`} 
                            value={item.criterion} 
                            onChange={(e) => handleMatrixChange(item.id, 'criterion', e.target.value)}
                            className="font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`description-${item.id}`} className="text-primary">Description</Label>
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
              <div className="text-center mt-2">
                <Button onClick={addMatrixItem} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="mr-2 h-4 w-4" /> Add Criterion
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Provide your scoring criteria. The AI will use this to score the call.
              </p>
            </div>

            {/* Right Column */}
            <div className="md:w-1/2 space-y-4 md:border-l md:pl-8 border-border">
                <div className="space-y-4 text-center">
                    <Label htmlFor="agentName" className="text-lg font-semibold text-primary flex items-center justify-center gap-2">
                      <User className="h-5 w-5" />
                      Agent Name (Optional)
                    </Label>
                    <Input
                        id="agentName"
                        className="w-full p-3 border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition duration-200 ease-in-out text-base text-center"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        placeholder="e.g. Scott Chegg"
                    />
                    <p className="text-sm text-muted-foreground">
                        Provide the agent's name to override automatic extraction.
                    </p>
                </div>

                <div className="space-y-4 text-center">
                    <Label htmlFor="callTranscript" className="text-lg font-semibold text-primary flex items-center justify-center gap-2">
                        <ClipboardPaste className="h-5 w-5" />
                        2. Input Call Transcript
                    </Label>
                    <Textarea
                        id="callTranscript"
                        className="w-full p-3 border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition duration-200 ease-in-out text-base text-left"
                        rows={7}
                        value={callTranscript}
                        onChange={(e) => setCallTranscript(e.target.value)}
                        placeholder="Paste your Genesys Cloud call transcript here... (Disregarded if uploading WAV file)"
                    />
                     <p className="text-sm text-muted-foreground">
                        Ensure the transcript is complete. This is optional if you provide a WAV file.
                    </p>
                </div>

                <div className="text-center font-bold text-muted-foreground">OR</div>
                
                <div className="space-y-4 text-center">
                    <Label htmlFor="audioFile" className="text-lg font-semibold text-primary flex items-center justify-center gap-2">
                        <FileAudio className="h-5 w-5" />
                        3. Upload Call Recording
                    </Label>
                    <Input
                        id="audioFile"
                        type="file"
                        accept="audio/wav"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="hidden"
                    />
                    <Button onClick={() => fileInputRef.current?.click()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
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
            </div>
        </div>

        <div className="space-y-4 pt-6 text-center">
           <Button
            onClick={handleGenerateReview}
            disabled={!canGenerate}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-auto py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5" />
            )}
            {isLoading ? 'Generating...' : 'Generate Call Review'}
          </Button>
        </div>
        
        {error && (
            <div className="mt-6 flex justify-center">
                <Alert variant="destructive" className="inline-flex flex-col items-center text-center">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Generating Review</AlertTitle>
                    <AlertDescription className="text-center">
                        <p>The AI model failed to generate a review. This can happen if the service is overloaded or if there's an issue with the input provided.</p>
                        <pre className="mt-2 whitespace-pre-wrap font-mono text-xs bg-destructive/10 p-2 rounded-md text-primary">
                            {error}
                        </pre>
                    </AlertDescription>
                </Alert>
            </div>
        )}
        
        {review && !isLoading && (
            <div className="mt-8">
                <ReviewDisplay review={review} setReview={setReview} />
            </div>
        )}

      </CardContent>
    </Card>
    <footer className="text-center mt-8 text-sm text-muted-foreground">
        <p>This application was created by Dale Wylie. Intended purpose is to be used as an AI assistant to help with Call Quality Management and provides a rigid, non-biased review on defined voice calls and transcripts. As with all AI tools, human qualification is required. Use responsibly.</p>
    </footer>
    </div>
     <AlertDialog open={!!criterionToDelete} onOpenChange={(isOpen) => !isOpen && setCriterionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the scoring criterion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCriterionToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveItem}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  );
}
