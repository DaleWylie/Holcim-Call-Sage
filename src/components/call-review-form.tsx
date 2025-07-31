
"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ClipboardPaste, Sparkles, AlertCircle, FileAudio, X, User, Fingerprint, Settings, List, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from './ui/badge';
import { ReviewDisplay } from './review-display';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { SettingsDialog } from '@/components/settings-dialog';
import { generateNonBiasedReview, GenerateNonBiasedReviewOutput } from '@/ai/flows/generate-non-biased-review';
import { useToast } from '@/hooks/use-toast';
import { useScoringMatrixStore } from '@/store/scoring-matrix-store';


type ErrorState = {
  title: string;
  message: string;
  details?: string;
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
  const { defaultScoringMatrix, customScoringMatrix } = useScoringMatrixStore();
  const scoringMatrix = [...defaultScoringMatrix, ...customScoringMatrix];

  const [agentFirstName, setAgentFirstName] = useState('');
  const [agentLastName, setAgentLastName] = useState('');
  const [interactionId, setInteractionId] = useState('');
  const [callTranscript, setCallTranscript] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDataUriForPlayer, setAudioDataUriForPlayer] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [review, setReview] = useState<GenerateNonBiasedReviewOutput | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { toast } = useToast();

  const handleGenerateReview = async () => {
    setIsLoading(true);
    setError(null);
    setReview(null);
    setAudioDataUriForPlayer(null);
    
    if (scoringMatrix.length === 0) {
        setError({
            title: "Scoring Matrix is Empty",
            message: "There are no scoring criteria defined. Please add criteria in the settings before generating a review.",
        });
        setIsLoading(false);
        return;
    }

    try {
      const audioDataUri = audioFile ? await fileToDataUri(audioFile) : undefined;
      
      if (audioDataUri) {
        setAudioDataUriForPlayer(audioDataUri);
      }

      const agentName = `${agentFirstName.trim()} ${agentLastName.trim()}`;
      
      const result = await generateNonBiasedReview({
        scoringMatrix,
        agentName,
        interactionId: interactionId.trim(),
        callTranscript: callTranscript.trim() || undefined,
        audioDataUri,
      });

      setReview(result);
    } catch (e) {
      console.error(e);
      let errorState: ErrorState = {
        title: "Error Generating Review",
        message: "An unexpected error occurred. Please try again.",
        details: e instanceof Error ? e.message : String(e),
      };

      if (e instanceof Error && e.message.startsWith('AI_REQUEST_FAILED')) {
          errorState.message = "The AI service failed to respond. This might be due to high demand or a temporary issue. Please wait a moment and try again.";
          errorState.details = e.message;
      }
      
      setError(errorState);
    } finally {
      setIsLoading(false);
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

  const canGenerate = !isLoading && !!agentFirstName.trim() && !!agentLastName.trim() && !!interactionId.trim() && (!!callTranscript.trim() || !!audioFile);

  return (
    <>
    <div className="w-full max-w-6xl">
    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
      <Card className="shadow-xl relative">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-extrabold text-primary font-headline">
            Holcim Call Sage
          </CardTitle>
          <CardDescription>
            AI-Powered Quality Assistant for Holcim
          </CardDescription>
          <DialogTrigger asChild>
             <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-muted-foreground hover:bg-primary hover:text-primary-foreground">
                <Settings />
             </Button>
          </DialogTrigger>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-8">
          <div className="flex flex-col md:flex-row gap-8">
              {/* Left Column */}
              <div className="md:w-1/2 space-y-4 flex flex-col items-center">
                <Label className="text-lg font-semibold text-primary flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Call Scoring Matrix
                </Label>
                <Card className="w-full max-w-md">
                   <CardContent className="p-4">
                      {scoringMatrix.length > 0 ? (
                        <ul className="space-y-2">
                          {scoringMatrix.map((item) => (
                            <li key={item.id} className="flex items-center justify-between text-center">
                              <span className="font-semibold text-primary truncate flex-1">{item.criterion}</span>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className='text-muted-foreground hover:bg-primary hover:text-primary-foreground h-8 w-8 shrink-0'>
                                      <Info className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{item.criterion}</AlertDialogTitle>
                                    <AlertDialogDescription className="text-left whitespace-pre-wrap pt-2">
                                      {item.description}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogAction>Close</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground text-center p-4">The scoring matrix is empty. Add criteria in Settings.</p>
                      )}
                   </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="md:w-1/2 space-y-4 md:border-l md:pl-8 border-border">
                  <div className="space-y-4 text-center">
                      <Label className="text-lg font-semibold text-primary flex items-center justify-center gap-2">
                        <User className="h-5 w-5" />
                        Agent Name
                      </Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                          <div className='w-full space-y-1'>
                              <Label htmlFor="agentFirstName" className="text-sm font-semibold text-primary">First Name</Label>
                              <Input
                                  id="agentFirstName"
                                  className="w-full p-3 border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition duration-200 ease-in-out text-base text-center"
                                  value={agentFirstName}
                                  onChange={(e) => setAgentFirstName(e.target.value)}
                                  placeholder="e.g. Scott"
                              />
                          </div>
                          <div className='w-full space-y-1'>
                              <Label htmlFor="agentLastName" className="text-sm font-semibold text-primary">Surname</Label>
                              <Input
                                  id="agentLastName"
                                  className="w-full p-3 border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition duration-200 ease-in-out text-base text-center"
                                  value={agentLastName}
                                  onChange={(e) => setAgentLastName(e.target.value)}
                                  placeholder="e.g. Chegg"
                              />
                          </div>
                      </div>
                  </div>

                  <div className="space-y-4 text-center">
                      <Label htmlFor="interactionId" className="text-lg font-semibold text-primary flex items-center justify-center gap-2">
                          <Fingerprint className="h-5 w-5" />
                          Interaction ID
                      </Label>
                      <Input
                          id="interactionId"
                          className="w-full p-3 border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition duration-200 ease-in-out text-base text-center"
                          value={interactionId}
                          onChange={(e) => setInteractionId(e.target.value)}
                          placeholder="e.g. df14f08f-0377-4e25-875f-8f07140de97d"
                      />
                  </div>

                  <div className="space-y-4 text-center">
                      <Label htmlFor="callTranscript" className="text-lg font-semibold text-primary flex items-center justify-center gap-2">
                          <ClipboardPaste className="h-5 w-5" />
                          Input Call Transcript
                      </Label>
                      <Textarea
                          id="callTranscript"
                          className="w-full p-3 border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition duration-200 ease-in-out text-base text-left"
                          rows={5}
                          value={callTranscript}
                          onChange={(e) => setCallTranscript(e.target.value)}
                          placeholder="Paste the complete transcript here..."
                      />
                  </div>

                  <div className="text-center font-bold text-muted-foreground">OR</div>
                  
                  <div className="space-y-4 text-center">
                      <Label htmlFor="audioFile" className="text-lg font-semibold text-primary flex items-center justify-center gap-2">
                          <FileAudio className="h-5 w-5" />
                          Upload Call Recording
                      </Label>
                      <Input
                          id="audioFile"
                          type="file"
                          accept="audio/wav"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                          className="hidden"
                      />
                      <Button onClick={() => fileInputRef.current?.click()} variant="default">
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
              <Alert variant="destructive" className="w-full max-w-lg">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{error.title}</AlertTitle>
                <AlertDescription>
                  {error.message}
                  {error.details && (
                    <Collapsible className="mt-4">
                      <CollapsibleTrigger asChild>
                        <Button variant="link" className="p-0 h-auto text-destructive">Show details</Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <p className="text-xs font-mono bg-red-100 dark:bg-red-900/50 p-2 rounded mt-2">
                          {error.details}
                        </p>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {review && !isLoading && (
              <div className="mt-8">
                  <ReviewDisplay 
                    review={review}
                    setReview={setReview}
                    audioDataUri={audioDataUriForPlayer}
                  />
              </div>
          )}

        </CardContent>
      </Card>
      <SettingsDialog setOpen={setIsSettingsOpen} />
    </Dialog>
    <footer className="text-center mt-8 text-sm text-muted-foreground">
        <p>© 2025 Dale Wylie. "Call Sage" is an AI Call Quality Management Assistant, powered by Gemini, providing objective call and transcript analysis. AI-generated insights require human validation.</p>
    </footer>
    </div>
    </>
  );
}
