
"use client"

import React, { useRef, useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import type { GenerateNonBiasedReviewOutput } from "@/ai/flows/generate-non-biased-review"
import { CheckCircle2, ListChecks, Printer, Sparkles, Target, Pencil } from "lucide-react"
import { cn } from "@/lib/utils";

interface ReviewDisplayProps {
  review: GenerateNonBiasedReviewOutput
  setReview: React.Dispatch<React.SetStateAction<GenerateNonBiasedReviewOutput | null>>;
}

const EditableField = ({ value, onSave, multiline = false, type = 'text' }: { value: string | number, onSave: (newValue: string) => void, multiline?: boolean, type?: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(String(currentValue));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave();
    }
    if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    const commonProps = {
      ref: inputRef as any,
      value: currentValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCurrentValue(e.target.value),
      onBlur: handleSave,
      onKeyDown: handleKeyDown,
      className: "text-base p-1 h-auto w-full border-primary bg-background shadow-none focus-visible:ring-1 focus-visible:ring-ring"
    };
    return multiline ? (
      <Textarea {...commonProps} rows={4} />
    ) : (
      <Input {...commonProps} type={type} />
    );
  }

  return (
    <div onClick={() => setIsEditing(true)} className={cn("hover:bg-muted/50 p-1 rounded cursor-pointer", multiline ? "min-h-[100px]" : "min-h-[2.5rem] flex items-center")}>
        {value}
        <Pencil className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};


export function ReviewDisplay({ review, setReview }: ReviewDisplayProps) {
  const reviewRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = React.useState(false);

  const handleFieldChange = (field: keyof GenerateNonBiasedReviewOutput, value: string) => {
    setReview(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleScoreChange = (index: number, field: 'score' | 'justification' | 'criterion', value: string) => {
    setReview(prev => {
      if (!prev) return null;
      const newScores = [...prev.scores];
      const scoreItem = { ...newScores[index], [field]: field === 'score' ? Number(value) : value };
      newScores[index] = scoreItem;
      return { ...prev, scores: newScores };
    });
  };

  const handleImprovementChange = (index: number, value: string) => {
    setReview(prev => {
      if (!prev) return null;
      const newImprovements = [...prev.areasForImprovement];
      newImprovements[index] = value;
      return { ...prev, areasForImprovement: newImprovements };
    })
  }

  const handlePrint = async () => {
    if (!reviewRef.current) return;
    setIsPrinting(true);

    try {
        const canvas = await html2canvas(reviewRef.current, {
            scale: 2, // Improves quality
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`review-${review.analystName.replace(/\s+/g, '-')}.pdf`);
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        // You might want to show an error to the user here
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
          { /* This button is positioned absolutely relative to the parent div, so it's not part of the PDF print area */ }
        </div>

        <Card className="mb-6">
          <CardHeader>
            <Label className="text-sm font-medium text-muted-foreground">Analyst Name</Label>
            <div className="text-2xl font-bold group">
                <EditableField value={review.analystName} onSave={(val) => handleFieldChange('analystName', val)} />
            </div>

            <Label className="text-sm font-medium text-muted-foreground pt-2">Quick Summary</Label>
             <div className="text-muted-foreground group">
                <EditableField value={review.quickSummary} onSave={(val) => handleFieldChange('quickSummary', val)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 group">
              <Label className="text-sm font-medium">Quick Score:</Label>
              <EditableField value={review.quickScore} onSave={(val) => handleFieldChange('quickScore', val)} />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Detailed Scores</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={review.scores.map((_, i) => `item-${i}`)} className="w-full">
              {review.scores.map((item, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-4 w-full group">
                      <div className="w-16 h-8 text-center" onClick={(e) => e.stopPropagation()}>
                        <EditableField value={item.score} type="number" onSave={(val) => handleScoreChange(index, 'score', val)} />
                      </div>
                      <div className="flex-1 text-left font-medium p-1 h-auto" onClick={(e) => e.stopPropagation()}>
                        <EditableField value={item.criterion} onSave={(val) => handleScoreChange(index, 'criterion', val)} />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-4 group">
                    <Label className="font-semibold text-muted-foreground">Justification</Label>
                    <EditableField value={item.justification} onSave={(val) => handleScoreChange(index, 'justification', val)} multiline />
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
          <CardContent className="group">
            <EditableField value={review.overallSummary} onSave={(val) => handleFieldChange('overallSummary', val)} multiline />
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
            <div className="space-y-2">
              {review.areasForImprovement.map((item, index) => (
                <div key={index} className="group">
                    <EditableField value={item} onSave={(val) => handleImprovementChange(index, val)} multiline />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground mt-6 text-center">
          This review is generated by AI and should be used as an assistant tool.
          Always apply human judgement.
        </p>
      </div>

      <div className="absolute top-4 right-4">
        <Button onClick={handlePrint} disabled={isPrinting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Printer className="mr-2 h-4 w-4" />
            {isPrinting ? "Printing..." : "Print to PDF"}
        </Button>
      </div>
    </div>
  )
}
