
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  apiKey: string;
  setApiKey: (apiKey: string) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      setApiKey: (apiKey: string) => set({ apiKey }),
    }),
    {
      name: 'holcim-call-sage-settings', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
