import { config } from 'dotenv';
config();

// All flows must be imported here
import '@/ai/flows/generate-non-biased-review.ts';
import '@/ai/flows/chat-about-review.ts';
