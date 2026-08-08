import { env } from '../config/env';
import {
  AIProvider,
  EnquiryAnalysis,
  GeneratedResponse,
  GeneratedQuotation,
  GeneratedFollowUps,
  EnquiryContext,
} from './ai.types';
import { GeminiProvider } from './providers/gemini.provider';
import { MockProvider } from './providers/mock.provider';
import { AIError } from '../utils/errors';

// ─── Provider factory ──────────────────────────────────────────────────────────

let _provider: AIProvider | null = null;

function getProvider(): AIProvider {
  if (_provider) return _provider;

  switch (env.AI_PROVIDER) {
    case 'gemini':
      console.log('[AI] Provider: Gemini 1.5 Flash');
      _provider = new GeminiProvider();
      break;
    case 'mock':
      console.log('[AI] Provider: Mock (deterministic demo mode — set AI_PROVIDER=gemini for real AI)');
      _provider = new MockProvider();
      break;
    default:
      throw new AIError(
        `Unknown AI provider: "${env.AI_PROVIDER}". Valid options are: gemini, mock`
      );
  }

  return _provider;
}

// ─── AI Service (facade) ───────────────────────────────────────────────────────

export const AIService = {
  analyzeEnquiry(content: string): Promise<EnquiryAnalysis> {
    return getProvider().analyzeEnquiry(content);
  },

  generateResponse(context: EnquiryContext): Promise<GeneratedResponse> {
    return getProvider().generateResponse(context);
  },

  generateQuotation(context: EnquiryContext): Promise<GeneratedQuotation> {
    return getProvider().generateQuotation(context);
  },

  generateFollowUps(context: EnquiryContext): Promise<GeneratedFollowUps> {
    return getProvider().generateFollowUps(context);
  },

  /** Reset the provider instance (useful for testing) */
  _reset(): void {
    _provider = null;
  },
};
