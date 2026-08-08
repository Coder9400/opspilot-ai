import { env, AIProviderType } from '../config/env';
import {
  AIProvider,
  EnquiryAnalysis,
  GeneratedResponse,
  GeneratedQuotation,
  GeneratedFollowUps,
  EnquiryContext,
} from './ai.types';
import { MistralProvider } from './providers/mistral.provider';
import { MockProvider } from './providers/mock.provider';
import { AIError } from '../utils/errors';

// ─── Provider factory ──────────────────────────────────────────────────────────

let _provider: AIProvider | null = null;

function getProvider(): AIProvider {
  if (_provider) return _provider;

  const providerName = env.AI_PROVIDER as AIProviderType;
  switch (providerName) {
    case 'mistral':
      console.log('[AI] Provider: Mistral (mistral-small-latest)');
      _provider = new MistralProvider();
      break;
    case 'mock':
      console.log('[AI] Provider: Mock (deterministic demo — set AI_PROVIDER=mistral for real AI)');
      _provider = new MockProvider();
      break;
    default:
      throw new AIError(
        `Unknown AI provider: "${providerName}". Valid options are: mistral, mock`
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
