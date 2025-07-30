
"use client";

import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/hooks/use-settings";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Terminal } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage application settings here.
            </DialogDescription>
          </DialogHeader>
          <SettingsForm />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Settings</DrawerTitle>
          <DrawerDescription>
            Manage application settings here.
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4">
          <SettingsForm />
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function SettingsForm() {
  const { apiKey, setApiKey } = useSettings();
  const [newApiKey, setNewApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  const maskedApiKey = apiKey
    ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
    : "Not set";

  const handleSave = () => {
    setApiKey(newApiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="api-key">Gemini API Key</Label>
        <p className="text-sm text-muted-foreground">
          Current key: <span className="font-mono">{maskedApiKey}</span>
        </p>
        <Input
          id="api-key"
          type="password"
          placeholder="Enter new API key"
          value={newApiKey}
          onChange={(e) => setNewApiKey(e.target.value)}
        />
      </div>
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Developer Note</AlertTitle>
        <AlertDescription>
          Saving this key will store it in your browser's local storage. For this change to affect the AI, you must manually update the <code>.env</code> file on the server.
        </AlertDescription>
      </Alert>
      <Button onClick={handleSave} disabled={!newApiKey}>
        {saved ? "Saved!" : "Save API Key"}
      </Button>
    </div>
  );
}
