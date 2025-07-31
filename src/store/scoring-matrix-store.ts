
import { create } from 'zustand';

export type ScoringItem = {
  id: string;
  criterion: string;
  description: string;
  weight: number;
};

interface ScoringMatrixState {
  defaultScoringMatrix: ScoringItem[];
  customScoringMatrix: ScoringItem[];
  addCustomCriterion: (criterion: Omit<ScoringItem, 'weight'>) => void;
  updateCustomCriterion: (id: string, criterion: Partial<Omit<ScoringItem, 'id' | 'weight'>>) => void;
  removeCustomCriterion: (id: string) => void;
  resetCustomCriteria: () => void;
}

const defaultScoringMatrix: ScoringItem[] = [
    {
        id: "1",
        criterion: "1. Greeting & Introduction",
        weight: 5,
        description: `
- Description: The agent initiated the call with a professional, warm, and clear greeting. They introduced themselves by name and their team/department, then politely asked for and confirmed the caller's name.

- Tool Analysis Focus:
    o The tool will check for the presence of a professional opening phrase, the agent's name, and their team/department.
    o It will also verify that the agent asked for the caller's name and used it correctly to confirm their identity.
    o Sentiment analysis will be used to ensure the overall tone is positive and welcoming, even if the transcription is imperfect.

- Scoring Criteria (0-5):
    o 0: The agent's greeting was missing, unprofessional, or extremely poor in quality. No introduction or attempt to get the caller's name was made.
    o 1: A basic greeting was given (e.g., "Hello"), but the agent failed to introduce themselves, their department, or ask for the caller's name. The overall sentiment was neutral or negative.
    o 2: The agent's greeting included some but not all of the key components. For example, they may have introduced themselves but not their department, or they did not ask for the caller's name.
    o 3: The agent completed all the necessary actions: a professional greeting, self-introduction, department name, and politely asking for the caller's name. The tone was professional but may not have been particularly warm.
    o 4: The agent performed all required actions with a warm, professional, and clear tone. The tool's sentiment analysis would register this as a very positive opening.
    o 5: The agent's greeting was outstanding. They completed all the requirements and went a step further by using the caller's name during the opening conversation, demonstrating excellent rapport building. The tone was exceptionally warm and welcoming, setting a perfect start to the call.`
    },
    {
        id: "2",
        criterion: "2. Communication Style",
        weight: 10,
        description: `
- Description: The agent's communication was positive, professional, and clear. They spoke at an appropriate pace, avoided jargon, and used language that was easy for the caller to understand. The agent demonstrated active listening throughout the call by verbally acknowledging the caller's points, summarising the issue, and not speaking over them.

- Tool Analysis Focus:
    o Tone: Sentiment analysis to detect a positive, professional, and empathetic tone.
    o Pace: Analysis of words per minute (WPM) to ensure an appropriate speaking pace.
    o Clarity: Checks for the use of simple, easy-to-understand language and flags any instances of jargon.
    o Active Listening: Detection of active listening phrases ("I understand," paraphrasing) and monitoring for instances of the agent interrupting the caller.
    o Silence: Monitoring for excessive periods of silence or "dead air" to ensure the caller feels engaged.

- Scoring Criteria (0-5):
    o 0: The agent's communication was consistently poor. They spoke too fast or too slowly, were unclear, or used unprofessional language or a negative tone. There was no evidence of active listening.
    o 1: The agent struggled with one or more key areas. They may have spoken too quickly or used a lot of jargon. The tone was neutral at best, and there was minimal evidence of active listening.
    o 2: The agent's communication was generally clear, but lacked consistency. They may have had moments of speaking too fast or used some jargon. They demonstrated limited active listening, such as a few "uh-huhs," but did not summarise or paraphrase the customer's issue.
    o 3: The agent spoke clearly at an appropriate pace and maintained a professional tone. They avoided jargon and used language the customer could understand. They showed some signs of active listening, such as verbal nods, but could have been more engaging.
    o 4: The agent consistently spoke clearly at a good pace, maintaining a positive and professional tone throughout the call. They actively listened, using phrases to show they were engaged and understood the customer's needs.
    o 5: The agent's communication was exceptional. Their pace, tone, and clarity were perfect, and they used language that was not only professional but also genuinely empathetic. They demonstrated a high level of active listening by effectively paraphrasing and confirming the customer's issue, making the customer feel completely heard and understood.`
    },
    {
        id: "3",
        criterion: "3. Issue Handling & Clarity",
        weight: 20,
        description: `
- Description: The agent demonstrated a clear and confident approach to diagnosing and managing the caller's issue. They asked relevant, probing questions to understand the problem fully and then summarised it back to the caller to confirm their understanding. The agent showed ownership of the issue and provided clear, actionable updates or instructions on what was being done.

- Tool Analysis Focus:
    o Diagnosis: The tool will check that the agent asked multiple open-ended questions to diagnose the issue rather than jumping to a solution.
    o Confirmation: It will detect phrases where the agent paraphrases or summarises the issue back to the caller to confirm understanding.
    o Ownership: The tool will identify language that indicates the agent is taking ownership of the problem and is confident in their ability to help.
    o Clarity: It will evaluate the clarity and completeness of the instructions or updates provided to the caller. The tool will also check that expectations for future steps are clearly set.

- Scoring Criteria (0-5):
    o 0: The agent made no attempt to understand or diagnose the issue, offered no solution, and failed to set any next steps.
    o 1: The agent jumped to a solution without asking probing questions, or did not demonstrate a clear understanding of the issue. The instructions were confusing or incomplete.
    o 2: The agent asked some questions but did not fully diagnose the issue. There was no attempt to confirm understanding, and the instructions or updates were vague. The agent did not convey a strong sense of ownership.
    o 3: The agent asked relevant questions and showed a basic understanding of the issue. They provided a solution or update, but could have been clearer. There was an attempt to show ownership, but it wasn't consistently confident.
    o 4: The agent asked good probing questions to diagnose the issue, and confirmed understanding by summarising the problem. They demonstrated clear ownership and provided a good update or solution.
    o 5: The agent's issue handling was exceptional. They asked insightful, open-ended questions to quickly get to the root of the problem. They confidently owned the issue, confirmed their understanding by summarising it perfectly, and provided a crystal-clear solution or set of next steps, leaving the caller feeling completely confident in the outcome.`
    },
    {
        id: "4",
        criterion: "4. Hold Procedure",
        weight: 10,
        description: `
- Description: The agent followed a professional hold procedure. They asked the caller for permission before placing them on hold, explained the reason for the hold, thanked the caller upon returning, and provided a clear update on their progress.

- Tool Analysis Focus:
    o Hold Detection: The tool will first check for the presence of hold music or a notation in the transcript indicating a hold occurred.
    o Permission: If a hold is detected, the tool will then check for phrases like "Is it okay if I place you on hold?" or "Do you mind holding for a moment?"
    o Reason: It will detect if the agent provided a reason for the hold (e.g., "I need to check your account details," "I'm just looking up that information for you.").
    o Thank you: The tool will listen for phrases such as "Thank you for holding" or "Thanks for your patience."
    o Update: It will analyse whether a clear update on the progress was given after the hold.

- Scoring Criteria (0-5):
    o Score 5 (Default): The agent did not place the caller on hold at all during the call.
    o Score 0: A hold was used, but the agent placed the caller on hold without permission, explanation, or an update upon returning. The hold was handled unprofessionally.
    o Score 1: A hold was used, but the agent only performed one of the required steps (e.g., they asked for permission but gave no reason or update).
    o Score 2: A hold was used, and the agent performed two of the required steps, but was missing a key component (e.g., they asked for permission and gave a reason, but didn't provide an update upon returning).
    o Score 3: A hold was used, and the agent performed all four steps, but one of them was weak. For instance, the update was vague or the reason for the hold was not very clear.
    o Score 4: A hold was used, and the agent followed the full hold procedure correctly and professionally, asking permission, explaining the reason, thanking the caller, and providing a clear update upon returning.
    o Score 5: A hold was used, and the agent not only followed the procedure perfectly but also managed the hold with exceptional skill. For example, they might have given an estimated hold time, or checked in with the customer if the hold was unexpectedly long, making the customer feel valued throughout the process.`
    },
    {
        id: "5",
        criterion: "5. Professionalism & Empathy",
        weight: 15,
        description: `
- Description: The agent displayed empathy and patience throughout the call, handled frustration or difficult behaviour appropriately, and did not interrupt or speak over the caller.

- Tool Analysis Focus:
    o Empathy: The tool will use sentiment analysis to detect a warm and empathetic tone. It will also check for the use of specific empathetic phrases, such as "I understand how frustrating that must be," or "I'm sorry to hear that."
    o Patience: The tool will monitor for the agent's tone and pace when the caller becomes frustrated. It will look for signs of de-escalation and a consistent, calm demeanour.
    o Interrupting: The tool will analyse speaker turns to detect instances where the agent's speech overlaps with the caller's, flagging any interruptions.

- Scoring Criteria (0-5):
    o 0: The agent was unprofessional and showed no empathy. They were impatient, interrupted the caller, or handled difficult behaviour poorly.
    o 1: The agent was largely neutral. They failed to show any empathy or acknowledge the caller's emotional state, even in a suitable situation. They may have interrupted the caller.
    o 2: The agent maintained a professional tone but lacked genuine empathy. While they didn't actively handle a difficult situation poorly, they didn't use any de-escalation techniques. They may have interrupted the caller a few times.
    o 3: The agent was professional, patient, and did not interrupt the caller. They showed a basic level of empathy, but it could have been more expressive or consistent throughout the call.
    o 4: The agent was consistently professional and empathetic. They listened patiently, avoided interruptions, and used empathetic language effectively, making the caller feel understood.
    o 5: The agent's professionalism and empathy were exceptional. They not only avoided interruptions and showed patience, but they actively used de-escalation techniques and demonstrated a deep level of understanding, transforming a potentially difficult call into a positive experience.`
    },
    {
        id: "6",
        criterion: "6. Resolution & Next Steps",
        weight: 15,
        description: `
- Description: The agent clearly explained the resolution or next steps, verified if the issue was fully resolved to the caller's satisfaction, and offered additional help before closing the call.

- Tool Analysis Focus:
    o Resolution: The tool will check for a clear and concise explanation of the solution or a summary of the next steps to be taken.
    o Satisfaction Check: It will look for explicit questions from the agent to confirm the issue is resolved (e.g., "Does that fix your problem?," or "Are you happy with that?").
    o Additional Help: The tool will detect phrases where the agent proactively offers further assistance (e.g., "Is there anything else I can help you with?").

- Scoring Criteria (0-5):
    o 0: The call ended abruptly with no resolution, next steps, or check for satisfaction.
    o 1: The agent provided a resolution or next steps, but it was vague or confusing. They did not check for satisfaction or offer additional help.
    o 2: The agent provided a clear resolution or next steps, but failed to check for satisfaction or offer additional help.
    o 3: The agent provided a clear resolution and offered additional help, but did not explicitly ask if the customer was satisfied with the outcome.
    o 4: The agent performed all three key actions: they provided a clear resolution/next steps, asked for confirmation of satisfaction, and offered additional help.
    o 5: The agent’s resolution was exceptional. The explanation was not only clear but also perfectly tailored to the customer's understanding. They confidently verified satisfaction and proactively offered further assistance, demonstrating a complete and professional closing to the issue.`
    },
    {
        id: "7",
        criterion: "7. Call Closure",
        weight: 5,
        description: `
- Description: The agent summarised the call or resolution, closed the call politely and professionally, and used the caller’s name during the wrap-up.

- Tool Analysis Focus:
    o Summary: The tool will listen for a concise summary of the key points of the call or the final resolution.
    o Professional Closing: It will detect the use of standard polite closing phrases, such as "Thank you for your time", "Have a great day." or “Take care”.
    o Name Use: The tool will specifically check for the caller's name being used within the final closing remarks.

- Scoring Criteria (0-5):
    o 0: The call ended abruptly or with a rude, unprofessional tone.
    o 1: A basic, unprofessional closing was used, with no summary or use of the caller’s name.
    o 2: The agent closed the call politely, but failed to provide a summary of the resolution or use the caller's name.
    o 3: The agent provided a polite closing and one of the other elements, either a summary or the use of the caller's name.
    o 4: The agent successfully completed all three key actions: they summarised the call, closed politely, and used the caller's name.
    o 5: The agent's closure was exceptional. They provided a reassuring, clear summary, used the caller's name to reinforce rapport, and ended the call with a warm and professional closing statement, leaving the caller with a highly positive final impression.`
    },
    {
        id: "8",
        criterion: "8. Compliance & System Use",
        weight: 20,
        description: `
- Description: The agent checked adherence to internal procedures and documentation: logged or updated the ticket appropriately during/after the call; followed internal procedures, and completed security/compliance checks.

- Tool Analysis Focus:
    o Compliance Checks: The tool will be configured to detect specific phrases or questions that indicate the agent completed mandatory security or compliance checks (e.g., confirming identity with specific information).
    o System Use: The tool will listen for phrases where the agent indicates they are using the system to log or update information (e.g., "I'm just making a note of that," "Let me just update your account."). This will also serve as a flag for a manual review of the ticket itself.
    o Procedure Adherence: The tool will be trained to identify whether the agent followed required steps for specific types of calls based on pre-defined keywords.

- Scoring Criteria (0-5):
    o 0: The agent failed to perform a mandatory security or compliance check, or they breached a critical internal procedure.
    o 1: The agent failed to complete one or more minor internal procedures or did not make any mention of logging the call, requiring manual intervention to ensure the ticket is up to date.
    o 2: The agent performed all required security and compliance checks but was inconsistent in their system use, resulting in an incomplete or inaccurate record of the call that would require a manual fix.
    o 3: The agent successfully completed all compliance and security checks, and verbally indicated that they were logging the necessary information. A manual check would be needed to verify the accuracy of the logged data.
    o 4: The agent followed all compliance procedures perfectly, including security checks, and the ticket was logged or updated correctly as a direct result of the call.
    o 5: The agent's adherence to compliance and system use was flawless. They completed all required checks and documentation seamlessly and efficiently, demonstrating a high level of proficiency and ensuring a complete and accurate record with no need for further action.`
    },
];

export const useScoringMatrixStore = create<ScoringMatrixState>()(
    (set) => ({
      defaultScoringMatrix: defaultScoringMatrix,
      customScoringMatrix: [],
      addCustomCriterion: (criterion) => set((state) => ({ 
        customScoringMatrix: [...state.customScoringMatrix, { ...criterion, weight: 0 }] 
      })),
      updateCustomCriterion: (id, updates) => set((state) => ({
        customScoringMatrix: state.customScoringMatrix.map(item => 
          item.id === id ? { ...item, ...updates } : item
        )
      })),
      removeCustomCriterion: (id) => set((state) => ({
        customScoringMatrix: state.customScoringMatrix.filter(item => item.id !== id)
      })),
      resetCustomCriteria: () => set({ customScoringMatrix: [] }),
    })
);
