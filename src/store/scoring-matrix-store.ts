
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ScoringItem = {
  id: string;
  criterion: string;
  description: string;
};

interface ScoringMatrixState {
  scoringMatrix: ScoringItem[];
  setScoringMatrix: (matrix: ScoringItem[]) => void;
  addCriterion: (criterion: ScoringItem) => void;
  updateCriterion: (id: string, updatedCriterion: Partial<ScoringItem>) => void;
  removeCriterion: (id: string) => void;
}

const defaultScoringMatrix: ScoringItem[] = [
    { id: "1", criterion: "1. Greeting & Introduction", description: "Greeted the caller professionally and warmly, introduced self by name and team/department, asked for and confirmed the caller’s name and/or account/ID politely. For this criterion, consider the sentiment and clear intent of the agent's opening remarks, even if specific words (like their name) are not perfectly transcribed." },
    { id: "2", criterion: "2. Communication Style", description: "Maintained a positive, professional tone of voice; spoke clearly and at an appropriate pace; avoided jargon and used language appropriate to caller’s understanding; demonstrated active listening (e.g., verbal nods, paraphrasing)." },
    { id: "3", criterion: "3. Issue Handling & Clarity", description: "Asked relevant, probing questions to understand the issue; repeated or summarised issue back to confirm understanding; showed ownership and confidence in addressing the issue; provided clear instructions or updates on what is being done." },
    { id: "4", criterion: "4. Hold Procedure", description: "Asked permission before placing the caller on hold; explained the reason for the hold; thanked the caller when returning from hold; updated caller on progress when returning." },
    { id: "5", criterion: "5. Professionalism & Empathy", description: "Displayed empathy and patience throughout the call; handled frustration or difficult behaviour appropriately; did not interrupt or speak over the caller." },
    { id: "6", criterion: "6. Resolution & Next Steps", description: "Clearly explained the resolution or next steps; verified if the issue was fully resolved to the caller's satisfaction; offered additional help before closing the call." },
    { id: "7", criterion: "7. Call Closure", description: "Summarised the call or resolution; closed the call politely and professionally; used caller’s name during wrap-up." },
    { id: "8", criterion: "8. Compliance & System Use", description: "Checked adherence to internal procedures and documentation: Logged or updated the ticket appropriately during/after call; followed internal procedures, security/compliance checks." },
];

export const useScoringMatrixStore = create<ScoringMatrixState>()(
  persist(
    (set) => ({
      scoringMatrix: defaultScoringMatrix,
      setScoringMatrix: (matrix) => set({ scoringMatrix: matrix }),
      addCriterion: (criterion) =>
        set((state) => ({
          scoringMatrix: [...state.scoringMatrix, criterion],
        })),
      updateCriterion: (id, updatedCriterion) =>
        set((state) => ({
          scoringMatrix: state.scoringMatrix.map((item) =>
            item.id === id ? { ...item, ...updatedCriterion } : item
          ),
        })),
      removeCriterion: (id) =>
        set((state) => ({
          scoringMatrix: state.scoringMatrix.filter((item) => item.id !== id),
        })),
    }),
    {
      name: 'scoring-matrix-storage', // name of the item in storage (must be unique)
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage to reset on new session
    }
  )
);
