
"use client"

import React, { useRef, useState } from "react";
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
import { CheckCircle2, ListChecks, Printer, Sparkles, Target, Pencil, Check, X, UserCheck, Calendar } from "lucide-react"
import { cn, getScoreColor } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

interface ReviewDisplayProps {
  review: GenerateNonBiasedReviewOutput
  setReview: React.Dispatch<React.SetStateAction<GenerateNonBiasedReviewOutput | null>>;
}


export function ReviewDisplay({ review, setReview }: ReviewDisplayProps) {
  const reviewRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string | number>('');
  const [checkerName, setCheckerName] = useState('');
  
  const interactionId = review.interactionId || '';

  const handleEditClick = (field: string, currentValue: string | number) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const handleSave = (field: string) => {
    const [type, index] = field.split('-');

    if (type === 'score') {
      const scoreIndex = parseInt(index, 10);
      setReview(prev => {
        if (!prev) return null;
        const newScores = [...prev.scores];
        // Ensure the score is a whole number
        const newScoreValue = Math.round(Number(tempValue));
        newScores[scoreIndex] = { ...newScores[scoreIndex], score: newScoreValue };
        
        const totalScore = newScores.reduce((acc, s) => acc + s.score, 0);
        const newOverallScore = totalScore / newScores.length;

        return { ...prev, scores: newScores, overallScore: newOverallScore };
      });
    }
    setEditingField(null);
  };
  
  const handleCancel = () => {
    setEditingField(null);
  };
  
  const handlePrint = async () => {
    const mainElement = reviewRef.current;
    if (!mainElement) return;

    setIsPrinting(true);

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'pt',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pdfWidth - margin * 2;
    let yPos = margin;

    const addElementToPdf = async (element: HTMLElement) => {
        // Temporarily modify the DOM for printing
        const actionButtons = element.querySelectorAll('.action-button');
        actionButtons.forEach(button => (button as HTMLElement).style.display = 'none');
        const checkerInput = element.querySelector<HTMLInputElement>('#checkerName');
        if (checkerInput) checkerInput.style.display = 'none';
        const checkerText = element.querySelector<HTMLParagraphElement>('#checkerNameDisplay');
        if (checkerText) checkerText.style.display = 'block';

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
        });

        // Restore the DOM
        actionButtons.forEach(button => (button as HTMLElement).style.display = '');
        if (checkerInput) checkerInput.style.display = '';
        if (checkerText) checkerText.style.display = 'none';

        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * contentWidth) / canvas.width;

        if (yPos + imgHeight > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            yPos = margin;
        }

        pdf.addImage(imgData, 'PNG', margin, yPos, contentWidth, imgHeight);
        yPos += imgHeight + 10; // Add some padding between sections
    };


    try {
        const sections = mainElement.querySelectorAll<HTMLElement>('[data-printable-section]');
        for (const section of Array.from(sections)) {
            await addElementToPdf(section);
        }

        const safeAgentName = review.agentName.replace(/\s+/g, '-');
        const safeInteractionId = interactionId.replace(/\s+/g, '');
        pdf.save(`${safeAgentName}_${safeInteractionId}.pdf`);

    } catch (error) {
        console.error("Failed to generate PDF:", error);
    } finally {
        setIsPrinting(false);
    }
  };


  return (
    <div className="relative">
      <div ref={reviewRef} className="bg-gray-50/50 dark:bg-background/50 p-6 rounded-lg border border-border shadow-inner text-left mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground font-headline flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            Generated Review
          </h2>
        </div>

        <Card data-printable-section className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Agent Name</Label>
                 <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold">{review.agentName}</h3>
                  </div>
                
                <Label className="text-sm font-bold text-muted-foreground pt-4 block">Quick Summary</Label>
                <p className="text-muted-foreground">{review.quickSummary}</p>
              </div>
              <div className="text-right">
                <Label className="text-sm font-medium">Overall Score</Label>
                <Badge variant="secondary" className="text-lg font-bold ml-2">{review.overallScore.toFixed(1)}/5</Badge>
              </div>
            </div>
           </CardHeader>
           <CardContent>
              {interactionId && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Interaction ID</Label>
                  <p className="font-semibold">{interactionId}</p>
                </div>
              )}
          </CardContent>
        </Card>

        <Card data-printable-section className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Detailed Scores</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {review.scores.map((item, index) => (
                    <div key={index} className="space-y-2">
                        <div className="flex w-full items-center gap-2 py-2">
                            <div
                                className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
                                getScoreColor(item.score)
                                )}
                            >
                                {item.score}
                            </div>
                            <div className="flex-1">
                                <span className="font-medium">{item.criterion}</span>
                            </div>
                            <div className="action-button flex items-center gap-2 ml-4 shrink-0">
                                {editingField === `score-${index}` ? (
                                <>
                                    <Input
                                        type="number"
                                        value={tempValue}
                                        onChange={(e) => setTempValue(e.target.value)}
                                        className="w-20 h-8 text-center"
                                        min={0}
                                        max={5}
                                        step={1}
                                        onKeyDown={(e) => {
                                            if (e.key === '.') {
                                                e.preventDefault();
                                            }
                                        }}
                                        autoFocus
                                    />
                                    <Button
                                    size="icon"
                                    className="h-8 w-8 bg-green-500 hover:bg-green-600"
                                    onClick={() => handleSave(`score-${index}`)}
                                    >
                                    <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={handleCancel}
                                    >
                                    <X className="h-4 w-4" />
                                    </Button>
                                </>
                                ) : (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => handleEditClick(`score-${index}`, item.score)}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                )}
                            </div>
                        </div>
                        <div className="pl-12">
                            <p className="text-sm text-muted-foreground">{item.justification}</p>
                        </div>
                        {index < review.scores.length - 1 && <Separator className="mt-4" />}
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card data-printable-section className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Overall Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-base whitespace-pre-wrap">{review.overallSummary}</p>
          </CardContent>
        </Card>

        <Card data-printable-section className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Areas for Improvement</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {review.areasForImprovement.map((item, index) => (
                <li key={index} className="text-base">{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card data-printable-section className="mt-6">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">Checked By</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date().toLocaleDateString('en-GB')}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="checkerName" className="action-button">Your Name</Label>
                        <Input 
                            id="checkerName" 
                            placeholder="Enter your name to enable printing"
                            value={checkerName}
                            onChange={(e) => setCheckerName(e.target.value)}
                            className="action-button"
                        />
                         <p id="checkerNameDisplay" style={{display: "none"}} className="font-semibold">{checkerName}</p>
                    </div>
                </div>
                 <div className="mt-6 text-center">
                    <Button onClick={handlePrint} disabled={isPrinting || !checkerName.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground action-button">
                        <Printer className="mr-2 h-4 w-4" />
                        {isPrinting ? "Printing..." : "Print to PDF"}
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground pt-4 text-center">
                    This review is generated by AI and has been checked/amended where necessary by the human above.
                </p>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
