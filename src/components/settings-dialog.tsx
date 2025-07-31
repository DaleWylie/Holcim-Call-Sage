
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { useScoringMatrixStore } from '@/store/scoring-matrix-store';

interface SettingsDialogProps {
  setOpen: (open: boolean) => void;
}

export function SettingsDialog({ setOpen }: SettingsDialogProps) {
  const { scoringMatrix, setScoringMatrix } = useScoringMatrixStore();
  const [localMatrix, setLocalMatrix] = useState(scoringMatrix);
  const [criterionToDelete, setCriterionToDelete] = useState<string | null>(null);
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);

  const handleMatrixChange = (id: string, field: 'criterion' | 'description', value: string) => {
    setLocalMatrix(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  
  const addMatrixItem = () => {
    const newItem = {
      id: crypto.randomUUID(),
      criterion: `New Criterion ${localMatrix.length + 1}`,
      description: ""
    };
    setLocalMatrix(prev => [...prev, newItem]);
    setOpenAccordionItems(prev => [...prev, newItem.id]);
  };
  
  const confirmRemoveItem = () => {
    if (criterionToDelete) {
      setLocalMatrix(prev => prev.filter(item => item.id !== criterionToDelete));
      setCriterionToDelete(null);
    }
  };

  const handleSaveChanges = () => {
    setScoringMatrix(localMatrix);
    setOpen(false);
  };
  
  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle className="text-primary">Scoring Matrix Settings</DialogTitle>
        <DialogDescription>
          Add, edit, or remove the criteria used to score calls. These changes will be applied to all future reviews.
        </DialogDescription>
      </DialogHeader>
      
      <div className="py-4 max-h-[60vh] overflow-y-auto pr-2">
        <Accordion type="multiple" value={openAccordionItems} onValueChange={setOpenAccordionItems} className="w-full">
            {localMatrix.map((item) => (
            <AccordionItem value={item.id} key={item.id}>
                <div className="flex items-center w-full gap-2">
                    <AccordionTrigger className="flex-1 py-2 text-left pr-2">
                        <span className='font-semibold text-primary truncate group-hover:underline'>{item.criterion}</span>
                    </AccordionTrigger>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-transparent rounded-full shrink-0"
                        onClick={() => setCriterionToDelete(item.id)}
                    >
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
                        className="font-semibold bg-white"
                    />
                    </div>
                    <div className="space-y-1">
                    <Label htmlFor={`description-${item.id}`} className="text-primary">Description</Label>
                    <Textarea
                        id={`description-${item.id}`}
                        value={item.description}
                        onChange={(e) => handleMatrixChange(item.id, 'description', e.target.value)}
                        rows={3}
                        className="bg-white"
                    />
                    </div>
                </div>
                </AccordionContent>
            </AccordionItem>
            ))}
        </Accordion>
        <div className="text-center mt-4">
            <Button onClick={addMatrixItem} variant="default">
                <Plus className="mr-2 h-4 w-4" /> Add Criterion
            </Button>
        </div>
      </div>
      
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </DialogClose>
        <Button type="button" onClick={handleSaveChanges}>
          Save Changes
        </Button>
      </DialogFooter>

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
    </DialogContent>
  );
}
