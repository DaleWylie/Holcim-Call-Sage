
"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
import { Plus, Trash2, Edit, Save, Users, ListChecks, Settings } from 'lucide-react';
import { useScoringMatrixStore, ScoringProfile, ScoringItem } from '@/store/scoring-matrix-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface SettingsDialogProps {
  setOpen: (open: boolean) => void;
}

export function SettingsDialog({ setOpen }: SettingsDialogProps) {
  const { 
    profiles, 
    activeProfileId, 
    setScoringMatrixForProfile,
    addProfile,
    removeProfile,
    updateProfileName,
    resetToDefaults
  } = useScoringMatrixStore();
  
  const [localProfiles, setLocalProfiles] = useState<ScoringProfile[]>(profiles);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(activeProfileId);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editingProfileName, setEditingProfileName] = useState('');
  
  const [criterionToDelete, setCriterionToDelete] = useState<string | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<ScoringProfile | null>(null);
  
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);
  
  const selectedProfile = useMemo(() => localProfiles.find(p => p.id === selectedProfileId), [localProfiles, selectedProfileId]);

  useEffect(() => {
    setLocalProfiles(profiles);
  }, [profiles]);

  useEffect(() => {
    setSelectedProfileId(activeProfileId);
  }, [activeProfileId]);
  
  const handleMatrixChange = (id: string, field: 'criterion' | 'description', value: string) => {
    if (!selectedProfile) return;
    const newMatrix = selectedProfile.scoringMatrix.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    const newProfiles = localProfiles.map(p => 
        p.id === selectedProfileId ? {...p, scoringMatrix: newMatrix} : p
    );
    setLocalProfiles(newProfiles);
  };
  
  const addMatrixItem = () => {
    if (!selectedProfile) return;

    const newItem: ScoringItem = {
      id: crypto.randomUUID(),
      criterion: `New Criterion ${selectedProfile.scoringMatrix.length + 1}`,
      description: ""
    };
    
    const newMatrix = [...selectedProfile.scoringMatrix, newItem];
    const newProfiles = localProfiles.map(p => 
        p.id === selectedProfileId ? {...p, scoringMatrix: newMatrix} : p
    );
    setLocalProfiles(newProfiles);
    setOpenAccordionItems(prev => [...prev, newItem.id]);
  };
  
  const confirmRemoveItem = () => {
    if (criterionToDelete && selectedProfile) {
      const newMatrix = selectedProfile.scoringMatrix.filter(item => item.id !== criterionToDelete);
      const newProfiles = localProfiles.map(p => 
        p.id === selectedProfileId ? {...p, scoringMatrix: newMatrix} : p
      );
      setLocalProfiles(newProfiles);
      setCriterionToDelete(null);
    }
  };

  const handleSaveChanges = () => {
    localProfiles.forEach(profile => {
        setScoringMatrixForProfile(profile.id, profile.scoringMatrix);
    });
    setOpen(false);
  };
  
  // Profile Management
  const handleAddProfile = () => {
      const newProfileName = `New Profile ${profiles.length + 1}`;
      addProfile(newProfileName); // This updates the store directly
  };
  
  const handleStartEditingProfileName = (profile: ScoringProfile) => {
      setEditingProfileId(profile.id);
      setEditingProfileName(profile.name);
  };
  
  const handleSaveProfileName = (id: string) => {
      updateProfileName(id, editingProfileName);
      setEditingProfileId(null);
  };

  const handleConfirmRemoveProfile = () => {
      if (profileToDelete) {
          removeProfile(profileToDelete.id);
          setProfileToDelete(null);
      }
  };

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle className="text-primary">Scoring Matrix Settings</DialogTitle>
        <DialogDescription>
          Manage profiles and the criteria used to score calls.
        </DialogDescription>
      </DialogHeader>
      
      <Tabs defaultValue="criteria" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="criteria"><ListChecks className="mr-2" />Criteria Management</TabsTrigger>
            <TabsTrigger value="profiles"><Users className="mr-2" />Profile Management</TabsTrigger>
        </TabsList>

        <TabsContent value="criteria">
            <div className="py-4 space-y-4">
                <div>
                    <Label className="text-primary font-semibold">Editing Profile</Label>
                    <Select value={selectedProfileId || ''} onValueChange={setSelectedProfileId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a profile to edit" />
                        </SelectTrigger>
                        <SelectContent>
                            {localProfiles.map(profile => (
                                <SelectItem key={profile.id} value={profile.id}>{profile.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {selectedProfile && (
                    <div className="py-4 max-h-[45vh] overflow-y-auto pr-2 border-t">
                        <Accordion type="multiple" value={openAccordionItems} onValueChange={setOpenAccordionItems} className="w-full">
                            {selectedProfile.scoringMatrix.map((item) => (
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
                                <Plus className="mr-2 h-4 w-4" /> Add Criterion to "{selectedProfile.name}"
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </TabsContent>
        <TabsContent value="profiles">
            <div className="py-4 max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                <div className="space-y-2">
                    {profiles.map(profile => (
                        <div key={profile.id} className="flex items-center gap-2 p-2 border rounded-md">
                            {editingProfileId === profile.id ? (
                                <Input 
                                    value={editingProfileName}
                                    onChange={(e) => setEditingProfileName(e.target.value)}
                                    onBlur={() => handleSaveProfileName(profile.id)}
                                    onKeyDown={(e) => {
                                        if(e.key === 'Enter') handleSaveProfileName(profile.id)
                                        if(e.key === 'Escape') setEditingProfileId(null)
                                    }}
                                    className="bg-white"
                                    autoFocus
                                />
                            ) : (
                                <span className="flex-1 font-semibold text-primary">{profile.name}</span>
                            )}
                            
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-muted-foreground hover:text-primary hover:bg-transparent"
                                onClick={() => editingProfileId === profile.id ? handleSaveProfileName(profile.id) : handleStartEditingProfileName(profile)}
                            >
                                {editingProfileId === profile.id ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-muted-foreground hover:text-destructive hover:bg-transparent"
                                onClick={() => setProfileToDelete(profile)}
                                disabled={profile.isDefault}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
                 <div className="text-center mt-4">
                    <Button onClick={handleAddProfile} variant="default">
                        <Plus className="mr-2 h-4 w-4" /> Add New Profile
                    </Button>
                </div>
                <div className="text-center mt-8 border-t pt-4">
                    <Button onClick={resetToDefaults} variant="destructive">
                        <Settings className="mr-2 h-4 w-4" /> Reset All Profiles to Default
                    </Button>
                </div>
            </div>
        </TabsContent>
      </Tabs>
      
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

      {/* Alert Dialog for deleting a criterion */}
      <AlertDialog open={!!criterionToDelete} onOpenChange={(isOpen) => !isOpen && setCriterionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the scoring criterion from the "{selectedProfile?.name}" profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCriterionToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveItem}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
       {/* Alert Dialog for deleting a profile */}
      <AlertDialog open={!!profileToDelete} onOpenChange={(isOpen) => !isOpen && setProfileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{profileToDelete?.name}" profile and all of its criteria. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProfileToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemoveProfile}>Delete Profile</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </DialogContent>
  );
}
