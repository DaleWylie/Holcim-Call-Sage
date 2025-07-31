
"use client";

import React, { useState, useEffect } from 'react';
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
import { Plus, Trash2, Settings } from 'lucide-react';
import { useScoringMatrixStore, ScoringItem } from '@/store/scoring-matrix-store';

interface SettingsDialogProps {
  setOpen: (open: boolean) => void;
}

export function SettingsDialog({ setOpen }: SettingsDialogProps) {
  const { scoringMatrix, setScoringMatrix, resetToDefaults } = useScoringMatrixStore();
  
  const [localMatrix, setLocalMatrix] = useState<ScoringItem[]>([]);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);

  useEffect(() => {
    // This effect now correctly syncs the local state whenever the global state changes.
    // When the component mounts or the global scoringMatrix is updated (e.g., by resetToDefaults),
    // the localMatrix will be updated to reflect those changes.
    setLocalMatrix(scoringMatrix);
  }, [scoringMatrix]);
  
  const handleMatrixChange = (id: string, field: 'criterion' | 'description', value: string) => {
    const newMatrix = localMatrix.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setLocalMatrix(newMatrix);
  };
  
  const addMatrixItem = () => {
    const newItem: ScoringItem = {
      id: crypto.randomUUID(),
      criterion: `New Criterion ${localMatrix.length + 1}`,
      description: ""
    };
    
    const newMatrix = [...localMatrix, newItem];
    setLocalMatrix(newMatrix);
    // Automatically open the new item
    setOpenAccordionItems(prev => [...prev, newItem.id]);
  };
  
  const confirmRemoveItem = () => {
    if (itemToDelete) {
      const newMatrix = localMatrix.filter(item => item.id !== itemToDelete);
      setLocalMatrix(newMatrix);
      setItemToDelete(null);
    }
  };

  const handleSaveChanges = () => {
    setScoringMatrix(localMatrix);
    setOpen(false);
  };
  
  const handleReset = () => {
      resetToDefaults();
      // No need to manually setLocalMatrix here anymore, the useEffect will handle it.
  };

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle className="text-primary">Scoring Matrix Settings</DialogTitle>
        <DialogDescription>
          Add, edit, or delete the criteria used to score calls.
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
                        onClick={() => setItemToDelete(item.id)}
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
      </div>

      <div className="text-center mt-4">
          <Button onClick={addMatrixItem} variant="default">
              <Plus className="mr-2 h-4 w-4" /> Add Criterion
          </Button>
      </div>

      <DialogFooter>
        <div className="flex justify-between w-full">
            <Button onClick={handleReset} variant="destructive">
                <Settings className="mr-2 h-4 w-4" /> Reset to Default
            </Button>
            <div className="flex gap-2">
                <DialogClose asChild>
                <Button type="button" variant="secondary">
                    Cancel
                </Button>
                </DialogClose>
                <Button type="button" onClick={handleSaveChanges}>
                Save Changes
                </Button>
            </div>
        </div>
      </DialogFooter>

      {/* Alert Dialog for deleting a criterion */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this scoring criterion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveItem}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </DialogContent>
  );
}
