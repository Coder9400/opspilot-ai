import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  AIProvider,
  EnquiryAnalysis,
  GeneratedResponse,
  GeneratedQuotation,
  GeneratedFollowUps,
  EnquiryContext,
} from '../ai.types';
import { AIError } from '../../utils/errors';
import { env } from '../../config/env';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extracts and parses JSON from a Gemini response.
 * Handles markdown code blocks that Gemini sometimes wraps responses in.
 */
function extractJSON<T>(text: string): T {
  // Strip markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenceMatch ? fenceMatch[1].trim() : text.trim();

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new AIError(
      `AI returned a response that could not be parsed as JSON.\n` +
        `Raw output (first 300 chars): ${raw.slice(0, 300)}`
    );
  }
}

// ─── Gemini Provider ──────────────────────────────────────────────────────────

export class GeminiProvider implements AIProvider {
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor() {
    if (!env.AI_API_KEY) {
      throw new AIError(
        'Gemini API key is not set. Please set AI_API_KEY in your .env file, ' +
          'or use AI_PROVIDER=mock for local development.'
      );
    }
    const genAI = new GoogleGenerativeAI(env.AI_API_KEY);
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async analyzeEnquiry(content: string): Promise<EnquiryAnalysis> {
    const prompt = `
You are an expert business analyst AI. Your job is to extract structured information from raw customer enquiries for small businesses.

Analyse the following customer enquiry carefully and extract all available information.

CUSTOMER ENQUIRY:
"""
${content}
"""

Return ONLY a valid JSON object with EXACTLY this structure (no extra fields, no markdown):
{
  "customerName": "Full name or null if not found",
  "customerEmail": "email@example.com or null",
  "customerPhone": "phone number or null",
  "requirements": ["requirement 1", "requirement 2"],
  "budget": 0 or null,
  "currency": "INR",
  "timeline": "description of timeline or null",
  "priority": "LOW" or "MEDIUM" or "HIGH",
  "missingQuestions": ["question 1", "question 2"],
  "summary": "A concise 2-3 sentence summary of the enquiry"
}

PRIORITY RULES:
- HIGH: urgent language (ASAP, urgent, immediate), large budget (>2,00,000 INR), critical business need, data loss
- MEDIUM: clear requirements, specific budget, defined timeline, standard business needs
- LOW: exploratory, no budget mentioned, no timeline, just looking around

MISSING QUESTIONS: List only the important missing pieces of information needed to proceed (max 5 questions).
If all info is present, return an empty array.

Return ONLY the JSON. No explanation, no markdown, no code blocks.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const analysis = extractJSON<EnquiryAnalysis>(text);

      // Normalise fields
      if (!['LOW', 'MEDIUM', 'HIGH'].includes(analysis.priority)) {
        analysis.priority = 'MEDIUM';
      }
      if (!Array.isArray(analysis.requirements)) analysis.requirements = [];
      if (!Array.isArray(analysis.missingQuestions)) analysis.missingQuestions = [];
      if (!analysis.currency) analysis.currency = 'INR';

      return analysis;
    } catch (err) {
      if (err instanceof AIError) throw err;
      throw new AIError(`Gemini analysis failed: ${(err as Error).message}`);
    }
  }

  async generateResponse(context: EnquiryContext): Promise<GeneratedResponse> {
    const missingSection =
      context.missingQuestions && context.missingQuestions.length > 0
        ? `We need the following clarifications:\n${context.missingQuestions.map((q) => `• ${q}`).join('\n')}`
        : '';

    const prompt = `
You are a professional customer service representative for a small business.

Write a warm, professional email response to a customer enquiry.

CONTEXT:
- Customer Name: ${context.customerName || 'Valued Customer'}
- Requirements: ${context.requirements?.join(', ') || 'Not yet fully specified'}
- Budget: ${context.budget ? `${context.currency || 'INR'} ${context.budget.toLocaleString()}` : 'Not mentioned'}
- Timeline: ${context.timeline || 'Not specified'}
- Missing info needed: ${missingSection || 'None — all info available'}

ORIGINAL ENQUIRY:
"""
${context.rawContent}
"""

Write a response that:
1. Thanks the customer warmly and acknowledges their specific enquiry
2. Confirms what you understood their requirements to be
3. Mentions budget/timeline if provided
4. Politely asks for any missing information
5. Sets clear next steps and expectations
6. Ends professionally

Return ONLY a JSON object: { "response": "the full email response text here" }
No markdown, no code blocks, just the JSON.
`;

    try {
      const result = await this.model.generateContent(prompt);
      return extractJSON<GeneratedResponse>(result.response.text());
    } catch (err) {
      if (err instanceof AIError) throw err;
      throw new AIError(`Gemini response generation failed: ${(err as Error).message}`);
    }
  }

  async generateQuotation(context: EnquiryContext): Promise<GeneratedQuotation> {
    const prompt = `
You are a business analyst creating a professional quotation for a small business client.

CLIENT INFORMATION:
- Name: ${context.customerName || 'Client'}
- Requirements: ${context.requirements?.join(', ') || 'General business services'}
- Budget: ${context.budget ? `${context.currency || 'INR'} ${context.budget.toLocaleString()}` : 'Not specified'}
- Timeline: ${context.timeline || 'To be confirmed'}
- Summary: ${context.aiSummary || context.rawContent.slice(0, 300)}

Generate a professional quotation with realistic line items based on the requirements.
If a budget was specified, use it as the target. Otherwise use reasonable market rates (in INR).

Return ONLY a JSON object with EXACTLY this structure:
{
  "title": "Professional Service Proposal — [Client Name or short descriptor]",
  "description": "Brief 1-2 sentence description of what this quotation covers",
  "items": [
    {
      "description": "Service or deliverable name",
      "quantity": 1,
      "unitPrice": 25000.00,
      "total": 25000.00
    }
  ],
  "subtotal": 50000.00,
  "tax": 9000.00,
  "total": 59000.00,
  "currency": "INR",
  "validityDays": 30,
  "notes": "Important terms, payment schedule, etc."
}

Generate 2-5 realistic line items. Tax should be 18% GST of subtotal. total = subtotal + tax.
No markdown, no code blocks, just the JSON.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const quotation = extractJSON<GeneratedQuotation>(result.response.text());

      // Validate numeric fields
      if (!Array.isArray(quotation.items) || quotation.items.length === 0) {
        throw new AIError('AI generated a quotation with no line items');
      }
      if (typeof quotation.subtotal !== 'number' || typeof quotation.total !== 'number') {
        throw new AIError('AI generated a quotation with invalid numeric fields');
      }

      return quotation;
    } catch (err) {
      if (err instanceof AIError) throw err;
      throw new AIError(`Gemini quotation generation failed: ${(err as Error).message}`);
    }
  }

  async generateFollowUps(context: EnquiryContext): Promise<GeneratedFollowUps> {
    const prompt = `
You are a business process manager creating follow-up action items for a customer enquiry.

ENQUIRY CONTEXT:
- Customer: ${context.customerName || 'Unknown'}
- Requirements: ${context.requirements?.join(', ') || 'General'}
- Priority: ${context.priority || 'MEDIUM'}
- Missing info: ${context.missingQuestions?.join('; ') || 'None'}
- Timeline: ${context.timeline || 'Not specified'}

Generate 3-5 practical follow-up tasks that the business team should complete.

Return ONLY this JSON structure:
{
  "followUps": [
    {
      "title": "Short action title",
      "description": "What specifically needs to be done",
      "daysFromNow": 1
    }
  ]
}

daysFromNow should reflect urgency:
- HIGH priority: 1-3 days
- MEDIUM priority: 2-5 days  
- LOW priority: 5-14 days

No markdown, no code blocks, just the JSON.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const data = extractJSON<GeneratedFollowUps>(result.response.text());

      if (!Array.isArray(data.followUps)) {
        throw new AIError('AI returned invalid follow-ups structure');
      }

      return data;
    } catch (err) {
      if (err instanceof AIError) throw err;
      throw new AIError(`Gemini follow-up generation failed: ${(err as Error).message}`);
    }
  }
}
