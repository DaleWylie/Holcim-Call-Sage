import {genkit, Genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// This is a workaround for a known issue with Genkit and Next.js hot-reloading
// in development. It prevents the Genkit plugin from being initialized multiple
// times, which can cause memory leaks and other issues.
//
// For more context, see: https://github.com/firebase/genkit/issues/1118

declare global {
  var __genkit_ai: Genkit | undefined;
}

function getAi(): Genkit {
  if (global.__genkit_ai) {
    return global.__genkit_ai;
  }

  global.__genkit_ai = genkit({
    plugins: [googleAI()],
  });

  return global.__genkit_ai;
}

export const ai = getAi();
