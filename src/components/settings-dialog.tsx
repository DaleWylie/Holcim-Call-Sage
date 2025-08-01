
"use client";

import React, { useState, useEffect } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { useScoringMatrixStore, ScoringItem } from '@/store/scoring-matrix-store';

interface SettingsDialogProps {
  setOpen: (open: boolean) => void;
}

export function SettingsDialog({ setOpen }: SettingsDialogProps) {
  const { 
    customScoringMatrix, 
    addCustomCriterion, 
    removeCustomCriterion,
    resetCustomCriteria 
  } = useScoringMatrixStore();
  
  // Local state for editing custom criteria
  const [localCustomMatrix, setLocalCustomMatrix] = useState<ScoringItem[]>([]);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);

  useEffect(() => {
    // When the dialog opens, initialize local state with the current custom criteria
    setLocalCustomMatrix(customScoringMatrix);
  }, [customScoringMatrix, setOpen]);

  const handleMatrixChange = (id: string, field: 'criterion' | 'description', value: string) => {
    const newMatrix = localCustomMatrix.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setLocalCustomMatrix(newMatrix);
  };
  
  const addMatrixItem = () => {
    const newItem: ScoringItem = {
      id: crypto.randomUUID(),
      criterion: `New Custom Criterion ${localCustomMatrix.length + 1}`,
      description: ""
    };
    
    const newMatrix = [...localCustomMatrix, newItem];
    setLocalCustomMatrix(newMatrix);
    // Automatically open the new item
    setOpenAccordionItems(prev => [...prev, newItem.id]);
  };
  
  const confirmRemoveItem = () => {
    if (itemToDelete) {
      const newMatrix = localCustomMatrix.filter(item => item.id !== itemToDelete);
      setLocalCustomMatrix(newMatrix);
      setItemToDelete(null);
    }
  };

  const handleSaveChanges = () => {
    // Clear existing custom criteria and add the new/edited ones
    resetCustomCriteria();
    localCustomMatrix.forEach(item => addCustomCriterion(item));
    setOpen(false);
  };
  
  const handleResetToDefault = () => {
      setLocalCustomMatrix([]);
      setIsResetConfirmOpen(false);
  }

  return (
    <>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-primary">Custom Scoring Criteria</DialogTitle>
          <DialogDescription>
            Add your own temporary criteria for this session. This will be reset back to default when you reload the page.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 max-h-[60vh] overflow-y-auto pr-2">
          {localCustomMatrix.length === 0 ? (
            <p className="text-center text-muted-foreground">No custom criteria added.</p>
          ) : (
            <Accordion type="multiple" value={openAccordionItems} onValueChange={setOpenAccordionItems} className="w-full">
                {localCustomMatrix.map((item) => (
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
          )}
        </div>

        <div className="text-center mt-4">
            <Button onClick={addMatrixItem} variant="default">
                <Plus className="mr-2 h-4 w-4" /> Add Custom Criterion
            </Button>
        </div>

        <DialogFooter className="sm:justify-between">
            <Button type="button" variant="destructive" onClick={() => setIsResetConfirmOpen(true)}>
                Reset to Default
            </Button>
            <div className="flex justify-end gap-2">
                <DialogClose asChild>
                <Button type="button" variant="secondary">
                    Cancel
                </Button>
                </DialogClose>
                <Button type="button" onClick={handleSaveChanges}>
                Save Changes
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
      
      {/* Alert Dialog for resetting all custom criteria */}
      <AlertDialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all custom criteria you have added in this session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetToDefault} className={buttonVariants({ variant: "destructive" })}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog for deleting a single criterion */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this custom scoring criterion for this session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveItem} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
