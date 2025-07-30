
"use client"

import React, { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { GenerateNonBiasedReviewOutput } from "@/ai/flows/generate-non-biased-review"
import { CheckCircle2, ListChecks, Printer, Sparkles, Target } from "lucide-react"

interface ReviewDisplayProps {
  review: GenerateNonBiasedReviewOutput
  setReview: React.Dispatch<React.SetStateAction<GenerateNonBiasedReviewOutput | null>>;
}

export function ReviewDisplay({ review, setReview }: ReviewDisplayProps) {
  const reviewRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = React.useState(false);

  const handleFieldChange = (field: keyof GenerateNonBiasedReviewOutput, value: string) => {
    setReview(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleScoreChange = (index: number, field: 'score' | 'justification' | 'criterion', value: string | number) => {
    setReview(prev => {
      if (!prev) return null;
      const newScores = [...prev.scores];
      const scoreItem = { ...newScores[index], [field]: value };
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
            <Label htmlFor="analystName" className="text-sm font-medium text-muted-foreground">Analyst Name</Label>
            <Input id="analystName" value={review.analystName} onChange={(e) => handleFieldChange('analystName', e.target.value)} className="text-2xl font-bold p-0 border-0 shadow-none focus-visible:ring-0" />

            <Label htmlFor="quickSummary" className="text-sm font-medium text-muted-foreground pt-2">Quick Summary</Label>
            <Input id="quickSummary" value={review.quickSummary} onChange={(e) => handleFieldChange('quickSummary', e.target.value)} className="text-muted-foreground p-0 border-0 shadow-none focus-visible:ring-0" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Label htmlFor="quickScore" className="text-sm font-medium">Quick Score:</Label>
              <Input id="quickScore" value={review.quickScore} onChange={(e) => handleFieldChange('quickScore', e.target.value)} className="text-base p-1 h-auto w-auto border-0 shadow-none focus-visible:ring-0" />
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
                    <div className="flex items-center gap-4 w-full">
                      <Input
                        type="number"
                        min={0} max={5}
                        value={item.score}
                        onChange={(e) => handleScoreChange(index, 'score', e.target.valueAsNumber)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-16 h-8 text-center"
                      />
                      <Input
                        value={item.criterion}
                        onChange={(e) => handleScoreChange(index, 'criterion', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 text-left font-medium p-1 h-auto border-0 shadow-none focus-visible:ring-0"
                      />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-4">
                    <Label htmlFor={`justification-${index}`} className="font-semibold text-muted-foreground">Justification</Label>
                    <Textarea
                      id={`justification-${index}`}
                      value={item.justification}
                      onChange={(e) => handleScoreChange(index, 'justification', e.target.value)}
                      rows={4}
                    />
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
            <Textarea
              value={review.overallSummary}
              onChange={(e) => handleFieldChange('overallSummary', e.target.value)}
              rows={5}
              className="text-sm text-foreground"
            />
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
                <Textarea
                  key={index}
                  value={item}
                  onChange={(e) => handleImprovementChange(index, e.target.value)}
                  className="text-sm text-foreground"
                />
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
