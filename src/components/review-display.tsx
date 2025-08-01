
"use client"

import React, { useRef, useState, useMemo, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GenerateNonBiasedReviewOutput } from "@/ai/flows/generate-non-biased-review"
import { CheckCircle2, ListChecks, Printer, Sparkles, Target, Pencil, Check, X, UserCheck, Calendar, ThumbsUp, Clock, Timer } from "lucide-react"
import { cn, getScoreColor } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";
import { useScoringMatrixStore } from "@/store/scoring-matrix-store";
import { Chatbot } from "./chatbot";

interface ReviewDisplayProps {
  review: GenerateNonBiasedReviewOutput;
  setReview: React.Dispatch<React.SetStateAction<GenerateNonBiasedReviewOutput | null>>;
  audioDataUri: string | null;
  transcript: string;
}

// Converts [HH:MM:SS] or MM:SS to seconds
const timeToSeconds = (timeStr: string): number => {
    if (!timeStr) return 0;
    const time = timeStr.replace(/[\[\]]/g, ''); // Remove brackets
    const parts = time.split(':').map(Number);
    if (parts.some(isNaN)) return 0;

    if (parts.length === 3) { // [HH:MM:SS]
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) { // MM:SS
        return parts[0] * 60 + parts[1];
    }
    return 0;
};

// Formats seconds into HH:MM:SS
const formatDuration = (totalSeconds: number): string => {
    if (isNaN(totalSeconds) || totalSeconds < 0) {
        return "N/A";
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');

    return `${hh}:${mm}:${ss}`;
};


export function ReviewDisplay({ review, setReview, audioDataUri, transcript }: ReviewDisplayProps) {
  const { defaultScoringMatrix, customScoringMatrix } = useScoringMatrixStore();
  const fullMatrix = [...defaultScoringMatrix, ...customScoringMatrix];

  const reviewRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string | number>('');
  const [checkerName, setCheckerName] = useState('');
  const [conversationDuration, setConversationDuration] = useState<string>("N/A");

  const conversationId = review.conversationId || '';

  useEffect(() => {
    const getDuration = () => {
      if (audioRef.current && audioRef.current.duration && isFinite(audioRef.current.duration)) {
          setConversationDuration(formatDuration(audioRef.current.duration));
      } else if (transcript) {
          const timestamps = transcript.match(/\[(\d{2}:\d{2}:\d{2})\]/g);
          if (timestamps && timestamps.length > 0) {
              const lastTimestamp = timestamps[timestamps.length - 1];
              const durationInSeconds = timeToSeconds(lastTimestamp);
              setConversationDuration(formatDuration(durationInSeconds));
          } else {
              setConversationDuration("N/A");
          }
      } else {
          setConversationDuration("N/A");
      }
    };

    if (audioRef.current) {
        audioRef.current.addEventListener('loadedmetadata', getDuration);
        if (audioRef.current.readyState >= 1) { // HAVE_METADATA
            getDuration();
        }
    } else {
        getDuration();
    }
    
    return () => {
      if (audioRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        audioRef.current.removeEventListener('loadedmetadata', getDuration);
      }
    };
  }, [audioDataUri, transcript]);


  const sortedGoodPoints = useMemo(() => {
    return [...review.goodPoints].sort((a, b) => {
        const aHasTimestamp = !!a.timestamp;
        const bHasTimestamp = !!b.timestamp;
        if (!aHasTimestamp && bHasTimestamp) return -1;
        if (aHasTimestamp && !bHasTimestamp) return 1;
        if (!aHasTimestamp && !bHasTimestamp) return 0;
        return timeToSeconds(a.timestamp!) - timeToSeconds(b.timestamp!);
    });
  }, [review.goodPoints]);

  const sortedAreasForImprovement = useMemo(() => {
    return [...review.areasForImprovement].sort((a, b) => {
        const aHasTimestamp = !!a.timestamp;
        const bHasTimestamp = !!b.timestamp;
        if (!aHasTimestamp && bHasTimestamp) return -1;
        if (aHasTimestamp && !bHasTimestamp) return 1;
        if (!aHasTimestamp && !bHasTimestamp) return 0;
        return timeToSeconds(a.timestamp!) - timeToSeconds(b.timestamp!);
    });
  }, [review.areasForImprovement]);

  const handleTimestampClick = (timestamp: string) => {
    if (audioRef.current) {
        audioRef.current.currentTime = timeToSeconds(timestamp);
        audioRef.current.play();
    }
  };

  const handleEditClick = (field: string, currentValue: any) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const handleSave = (field: string) => {
    setReview(prev => {
        if (!prev) return null;
        
        const [type, indexStr] = field.split('-');
        const index = parseInt(indexStr, 10);
        let newReview = { ...prev };

        if (type === 'score') {
            const newScores = [...prev.scores];
            const newScoreValue = Math.round(Number(tempValue));
            newScores[index] = { ...newScores[index], score: newScoreValue };
            
            // Recalculate weighted score
            let totalAchievedPoints = 0;
            let totalPossiblePoints = 0;
            const scoringMap = new Map(fullMatrix.map(item => [item.criterion, { weight: item.weight }]));
            
            newScores.forEach(scoreItem => {
                const criterionDetails = scoringMap.get(scoreItem.criterion);
                if (criterionDetails && criterionDetails.weight > 0) {
                    totalAchievedPoints += scoreItem.score * criterionDetails.weight;
                    totalPossiblePoints += 5 * criterionDetails.weight; // Max score is 5 for each criterion
                }
            });

            const newOverallScore = (totalPossiblePoints > 0) ? (totalAchievedPoints / totalPossiblePoints) * 100 : 0;
            newReview = { ...newReview, scores: newScores, overallScore: newOverallScore };

        } else if (type === 'justification') {
            const newScores = [...prev.scores];
            newScores[index] = { ...newScores[index], justification: String(tempValue) };
            newReview = { ...newReview, scores: newScores };
        } else if (type === 'overallSummary') {
            newReview = { ...newReview, overallSummary: String(tempValue) };
        }

        return newReview;
    });

    setEditingField(null);
};
  
  const handleCancel = () => {
    setEditingField(null);
  };
  
 const handlePrint = async () => {
    const printContainer = reviewRef.current;
    if (!printContainer) return;

    setIsPrinting(true);

    try {
        const originalBackgroundColor = printContainer.style.backgroundColor;
        printContainer.style.backgroundColor = 'white';
        
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'pt',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 40;
        let yPos = margin;

        const sections = Array.from(printContainer.querySelectorAll<HTMLElement>('[data-printable-section="true"]'));

        for (const section of sections) {
             const canvas = await html2canvas(section, {
                scale: 2,
                useCORS: true,
                backgroundColor: null,
                onclone: (doc) => {
                    const clonedElement = doc.body;
                    clonedElement.style.backgroundColor = 'white';
                    clonedElement.querySelectorAll('[data-printable="false"]').forEach(el => {
                        (el as HTMLElement).style.display = 'none';
                    });
                    clonedElement.querySelectorAll('.printable-only').forEach(el => {
                         (el as HTMLElement).style.display = 'inline';
                         (el as HTMLElement).style.fontWeight = '600';
                    });
                    clonedElement.querySelectorAll('.printable-hidden').forEach(el => {
                        (el as HTMLElement).style.display = 'none';
                    });
                    const checkerInput = clonedElement.querySelector<HTMLInputElement>('#checkerName');
                    if(checkerInput) checkerInput.style.display = 'none';
                    const checkerText = clonedElement.querySelector<HTMLParagraphElement>('#checkerNameDisplay');
                    if (checkerText) checkerText.style.display = 'block';
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const imgHeight = (canvas.height * (pdfWidth - margin*2)) / canvas.width;
            
            if (yPos + imgHeight > pdfHeight - margin) {
                pdf.addPage();
                yPos = margin;
            }

            pdf.addImage(imgData, 'PNG', margin, yPos, pdfWidth - (margin * 2), imgHeight);
            yPos += imgHeight + 15; // Add some padding between sections
        }

        const safeAgentName = review.agentName.replace(/\s+/g, '-');
        const safeConversationId = conversationId.replace(/\s+/g, '');
        pdf.save(`${safeAgentName}_${safeConversationId}.pdf`);

        printContainer.style.backgroundColor = originalBackgroundColor;

    } catch (error) {
        console.error("Failed to generate PDF:", error);
    } finally {
        setIsPrinting(false);
    }
  };


  const reviewId = useMemo(() => `review-${conversationId}`, [conversationId]);


  return (
    <div className="relative">
      <div 
        ref={reviewRef} 
        data-review-id={reviewId}
        className="bg-white p-6 rounded-lg border border-border shadow-lg mt-8 print-container"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground font-headline flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            Generated Review
          </h2>
        </div>
        
        {audioDataUri && (
             <div data-printable="false" className="mb-6">
                <audio ref={audioRef} controls src={audioDataUri} className="w-full">
                    Your browser does not support the audio element.
                </audio>
            </div>
        )}

        <Card data-printable-section="true" className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-2">
                <div>
                    <Label className="text-sm font-bold text-muted-foreground">Agent Name</Label>
                    <h3 className="text-2xl font-bold text-primary">{review.agentName}</h3>
                </div>
                <div>
                    <Label className="text-sm font-bold text-muted-foreground">Quick Summary</Label>
                    <p className="text-foreground">{review.quickSummary}</p>
                </div>
              </div>
              <div className="text-center ml-4 flex-shrink-0">
                  <Label className="text-sm font-bold text-muted-foreground block text-center">Overall Score</Label>
                  <div className={cn(
                    "mt-1 flex items-center justify-center w-20 h-20 rounded-full text-white text-2xl font-bold",
                    getScoreColor(review.overallScore, 100)
                  )}>
                    {review.overallScore.toFixed(0)}%
                  </div>
              </div>
            </div>
           </CardHeader>
           <CardContent className="pt-2 pb-4 border-t">
               <div className="flex justify-between items-center gap-4 text-sm mt-2">
                 <div className="space-y-1">
                   {conversationId && (
                     <>
                       <Label className="text-sm font-bold text-muted-foreground">Conversation ID</Label>
                       <p className="font-semibold text-primary">{conversationId}</p>
                     </>
                   )}
                 </div>
                 <div className="text-right space-y-1">
                   <Label className="text-sm font-bold text-muted-foreground">Conversation Duration</Label>
                   <p className="font-semibold text-primary flex items-center justify-end gap-1">
                       <Timer className="h-4 w-4" />
                       {conversationDuration}
                   </p>
                 </div>
               </div>
           </CardContent>
        </Card>

        <Card data-printable-section="true" className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl text-foreground">Detailed Scores</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {review.scores.map((item, index) => {
                    const criterionDetails = fullMatrix.find(c => c.criterion === item.criterion);
                    const weight = criterionDetails ? criterionDetails.weight : 0;

                    return (
                        <div key={index} className="space-y-2">
                            <div className="flex w-full items-center gap-2 py-2">
                                <div
                                    className={cn(
                                    'flex h-7 w-12 shrink-0 items-center justify-center rounded-md px-2 text-sm font-bold text-white',
                                    getScoreColor(item.score * 20) // Multiply by 20 to map 0-5 scale to 0-100 for color
                                    )}
                                >
                                    {item.score}/5
                                </div>
                                <div className="flex-1">
                                    <span className="font-medium text-foreground">{item.criterion}</span>
                                    {weight > 0 && (
                                        <span className="text-xs text-muted-foreground ml-2">(Overall Weighting: {weight}%)</span>
                                    )}
                                </div>
                                <div data-printable="false" className="flex items-center gap-2 ml-4 shrink-0">
                                    {editingField === `score-${index}` ? (
                                    <>
                                        <Input
                                            type="number"
                                            value={tempValue}
                                            onChange={(e) => setTempValue(e.target.value)}
                                            className="w-20 h-8 text-center"
                                            min={0}
                                            max={5}
                                            onKeyDown={(e) => {
                                                if (e.key === '.') {
                                                    e.preventDefault();
                                                }
                                            }}
                                            autoFocus
                                        />
                                        <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-primary hover:text-green-500 hover:bg-transparent"
                                        onClick={() => handleSave(`score-${index}`)}
                                        >
                                        <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-primary hover:text-red-500 hover:bg-transparent"
                                        onClick={handleCancel}
                                        >
                                        <X className="h-4 w-4" />
                                        </Button>
                                    </>
                                    ) : (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                                        onClick={() => handleEditClick(`score-${index}`, item.score)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    )}
                                </div>
                            </div>
                            <div className="pl-14">
                                {editingField === `justification-${index}` ? (
                                    <div className="flex flex-col gap-2">
                                        <Textarea
                                            value={String(tempValue)}
                                            onChange={(e) => setTempValue(e.target.value)}
                                            rows={4}
                                            className="text-sm"
                                            autoFocus
                                        />
                                        <div data-printable="false" className="flex items-center gap-2 justify-end">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-primary hover:text-green-500 hover:bg-transparent"
                                                onClick={() => handleSave(`justification-${index}`)}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-primary hover:text-red-500 hover:bg-transparent"
                                                onClick={handleCancel}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-2">
                                        <p className="text-sm text-foreground flex-1">
                                            {item.justification}
                                        </p>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-muted-foreground hover:bg-primary hover:text-primary-foreground action-button shrink-0"
                                            data-printable="false"
                                            onClick={() => handleEditClick(`justification-${index}`, item.justification)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                            {index < review.scores.length - 1 && <Separator className="mt-4" />}
                        </div>
                    )
                })}
            </div>
          </CardContent>
        </Card>

        <Card data-printable-section="true" className="mb-6">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl text-foreground">Overall Summary</CardTitle>
                    </div>
                    {editingField !== 'overallSummary' && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                            data-printable="false"
                            onClick={() => handleEditClick('overallSummary', review.overallSummary)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {editingField === 'overallSummary' ? (
                    <div className="flex flex-col gap-2">
                        <Textarea
                            value={String(tempValue)}
                            onChange={(e) => setTempValue(e.target.value)}
                            rows={6}
                            autoFocus
                        />
                        <div data-printable="false" className="flex items-center gap-2 justify-end action-button">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-primary hover:text-green-500 hover:bg-transparent"
                                onClick={() => handleSave('overallSummary')}
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-primary hover:text-red-500 hover:bg-transparent"
                                onClick={handleCancel}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <p className="text-base whitespace-pre-wrap text-foreground">{review.overallSummary}</p>
                )}
            </CardContent>
        </Card>
        
        {review.goodPoints && review.goodPoints.length > 0 && (
          <Card data-printable-section="true" className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl text-foreground">Good Points</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-foreground">
                {sortedGoodPoints.map((item, index) => (
                   <li key={index} className="text-base">
                        {item.timestamp && audioDataUri && (
                            <>
                                <Badge 
                                    variant="outline" 
                                    className="mr-2 cursor-pointer hover:bg-primary hover:text-primary-foreground printable-hidden"
                                    onClick={() => handleTimestampClick(item.timestamp!)}
                                >
                                    <Clock className="h-3 w-3 mr-1" />
                                    {item.timestamp}
                                </Badge>
                                <span className="printable-only mr-2 text-muted-foreground" style={{ display: 'none' }}>{item.timestamp}</span>
                            </>
                        )}
                        {item.text}
                    </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card data-printable-section="true" className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl text-foreground">Areas for Improvement</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-foreground">
              {sortedAreasForImprovement.map((item, index) => (
                 <li key={index} className="text-base">
                    {item.timestamp && audioDataUri && (
                         <>
                            <Badge 
                                variant="outline" 
                                className="mr-2 cursor-pointer hover:bg-primary hover:text-primary-foreground printable-hidden"
                                onClick={() => handleTimestampClick(item.timestamp!)}
                            >
                                <Clock className="h-3 w-3 mr-1" />
                                {item.timestamp}
                            </Badge>
                             <span className="printable-only mr-2 text-muted-foreground" style={{ display: 'none' }}>{item.timestamp}</span>
                        </>
                    )}
                    {item.text}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card data-printable-section="true" className="mt-6">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl text-foreground">Checked By</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date().toLocaleDateString('en-GB')}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="flex flex-col items-center gap-4">
                    <div data-printable="false" className="flex w-full items-center gap-2">
                        <Input
                            id="checkerName"
                            placeholder="Enter your name to enable printing"
                            value={checkerName}
                            onChange={(e) => setCheckerName(e.target.value)}
                            className="flex-grow"
                        />
                        <Button onClick={handlePrint} disabled={isPrinting || !checkerName.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0">
                            <Printer className="mr-2 h-4 w-4" />
                            {isPrinting ? "Printing..." : "Print to PDF"}
                        </Button>
                    </div>
                    <p id="checkerNameDisplay" style={{display: 'none'}} className="font-semibold">{checkerName}</p>

                    <p className="text-sm text-muted-foreground text-center">
                        This review is generated by AI and has been checked/amended where necessary by the human above.
                    </p>
                </div>
            </CardContent>
        </Card>
      </div>
      
      {review && <Chatbot review={review} />}
    </div>
  )
}
