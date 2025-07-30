
"use client"

import React, { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
import { CheckCircle2, ListChecks, Printer, Sparkles, Target, Pencil, Check, X, UserCheck } from "lucide-react"
import { cn, getScoreColor } from "@/lib/utils";
import { Badge } from "./ui/badge";

interface ReviewDisplayProps {
  review: GenerateNonBiasedReviewOutput
  setReview: React.Dispatch<React.SetStateAction<GenerateNonBiasedReviewOutput | null>>;
}


export function ReviewDisplay({ review, setReview }: ReviewDisplayProps) {
  const reviewRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string | number>('');
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);
  const [checkerName, setCheckerName] = useState('');

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
        newScores[scoreIndex] = { ...newScores[scoreIndex], score: Number(tempValue) };
        
        const totalScore = newScores.reduce((acc, s) => acc + s.score, 0);
        const newQuickScore = totalScore / newScores.length;

        return { ...prev, scores: newScores, quickScore: newQuickScore };
      });
    }
    setEditingField(null);
  };
  
  const handleCancel = () => {
    setEditingField(null);
  };
  
  const handlePrint = async () => {
    if (!reviewRef.current) return;
    
    const allItemIds = review.scores.map((_, index) => `item-${index}`);
    setOpenAccordionItems(allItemIds);
    setIsPrinting(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        const element = reviewRef.current;
        const canvas = await html2canvas(element, {
            scale: 2,
            scrollY: -window.scrollY,
            height: element.scrollHeight,
            windowHeight: element.scrollHeight,
            onclone: (document) => {
               const actionButtons = document.querySelectorAll('.action-button');
               actionButtons.forEach(button => (button as HTMLElement).style.display = 'none');
               const debugInfo = document.querySelectorAll('.debug-info');
               debugInfo.forEach(info => (info as HTMLElement).style.display = 'none');
            }
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`review-${review.agentName.replace(/\s+/g, '-')}.pdf`);
    } catch (error) {
        console.error("Failed to generate PDF:", error);
    } finally {
        setOpenAccordionItems([]);
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

        <Card className="mb-6">
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
                <Label className="text-sm font-medium">Quick Score</Label>
                <Badge variant="secondary" className="text-lg font-bold ml-2">{review.quickScore.toFixed(1)}/5</Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Detailed Scores</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" value={openAccordionItems} onValueChange={setOpenAccordionItems} className="w-full">
              {review.scores.map((item, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <div className="flex w-full items-center gap-2 py-2">
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
                          getScoreColor(item.score)
                        )}
                      >
                        {Math.round(item.score)}/5
                      </div>
                      <AccordionTrigger className="flex-1 justify-start pr-2 text-left no-underline hover:no-underline">
                          <span className="font-medium">{item.criterion}</span>
                      </AccordionTrigger>
                      <div className="flex items-center gap-2 ml-4 shrink-0">
                      {editingField === `score-${index}` ? (
                        <>
                          <Input
                            type="number"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            className="w-20 h-8 text-center action-button"
                            min={0}
                            max={5}
                            step={0.1}
                            autoFocus
                          />
                          <Button
                            size="icon"
                            className="h-8 w-8 bg-green-500 hover:bg-green-600 action-button"
                            onClick={() => handleSave(`score-${index}`)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 action-button"
                            onClick={handleCancel}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 action-button"
                          onClick={() => handleEditClick(`score-${index}`, item.score)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <AccordionContent className="pl-12">
                    <p className="text-sm text-muted-foreground">{item.justification}</p>
                    <div className="debug-info mt-4 p-2 bg-slate-200 dark:bg-slate-700 rounded-md border border-slate-300">
                        <h4 className="font-bold text-xs">Debugging Info:</h4>
                        <p className="text-xs font-mono">Raw Score: {item.score}</p>
                        <p className="text-xs font-mono">Returned Class: {getScoreColor(item.score)}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card className="mb-6">
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

        <Card>
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

        <Card className="mt-6 action-button">
          <CardHeader>
             <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Checked By</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="checkerName">Your Name</Label>
              <Input 
                id="checkerName" 
                placeholder="Enter your name to enable printing"
                value={checkerName}
                onChange={(e) => setCheckerName(e.target.value)}
              />
               <p className="text-sm text-muted-foreground mt-2">
                This review is generated by AI and has been checked/amended where necessary by the human above.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground mt-6 text-center">
          This review is generated by AI and should be used as an assistant tool.
          Always apply human judgement.
        </p>
      </div>

      <div className="absolute top-4 right-4">
        <Button onClick={handlePrint} disabled={isPrinting || !checkerName.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Printer className="mr-2 h-4 w-4" />
            {isPrinting ? "Printing..." : "Print to PDF"}
        </Button>
      </div>
    </div>
  )
}
