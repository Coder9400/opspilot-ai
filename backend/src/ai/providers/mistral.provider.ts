import { Mistral } from '@mistralai/mistralai';
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
 * Strips markdown code fences that Mistral sometimes wraps JSON in,
 * then parses the JSON.
 */
function extractJSON<T>(text: string): T {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenceMatch ? fenceMatch[1].trim() : text.trim();

  // Find the first { or [ to handle any preamble text
  const jsonStart = raw.search(/[{[]/);
  const clean = jsonStart >= 0 ? raw.slice(jsonStart) : raw;

  try {
    return JSON.parse(clean) as T;
  } catch {
    throw new AIError(
      `Mistral returned a response that could not be parsed as JSON.\n` +
        `Raw output (first 400 chars): ${clean.slice(0, 400)}`
    );
  }
}

// ─── Mistral Provider ─────────────────────────────────────────────────────────

export class MistralProvider implements AIProvider {
  private client: Mistral;
  private readonly model = 'mistral-small-latest';

  constructor() {
    if (!env.MISTRAL_API_KEY) {
      throw new AIError(
        'MISTRAL_API_KEY is not configured. Add it to your .env file.'
      );
    }
    this.client = new Mistral({ apiKey: env.MISTRAL_API_KEY });
  }

  // ── Core API call ─────────────────────────────────────────────────────────

  private async complete(systemPrompt: string, userContent: string): Promise<string> {
    try {
      const response = await this.client.chat.complete({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        responseFormat: { type: 'json_object' },
        temperature: 0.2,
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        throw new AIError('Mistral returned an empty response');
      }
      return content;
    } catch (err) {
      if (err instanceof AIError) throw err;
      throw new AIError(
        `Mistral API error: ${(err as Error).message || 'Unknown error'}`
      );
    }
  }

  // ── Analyze Enquiry ───────────────────────────────────────────────────────

  async analyzeEnquiry(content: string): Promise<EnquiryAnalysis> {
    const systemPrompt = `You are an expert business analyst for an Indian small-business CRM system.
Analyze the customer enquiry and extract structured information.
You MUST respond with valid JSON only. No explanations outside the JSON.

Return this exact JSON structure:
{
  "customerName": string or null,
  "customerEmail": string or null,
  "customerPhone": string or null,
  "requirements": [array of strings],
  "budget": number or null (numeric value only, no currency symbols),
  "currency": "INR" (default) or detected currency code,
  "timeline": string or null (human-readable, e.g. "2 weeks", "3 months"),
  "priority": "LOW" | "MEDIUM" | "HIGH",
  "missingQuestions": [array of questions that need answers],
  "summary": string (2-3 sentence professional summary)
}

Priority rules:
- HIGH: urgent/ASAP/critical/deadline within 1 week/large budget (>2L INR)/crisis
- MEDIUM: clear requirements, 1-4 week timeline, moderate budget
- LOW: exploratory/no rush/vague/no contact info/no budget`;

    const raw = await this.complete(systemPrompt, content);
    const data = extractJSON<EnquiryAnalysis>(raw);

    // Validate and sanitize
    if (!['LOW', 'MEDIUM', 'HIGH'].includes(data.priority)) {
      data.priority = 'MEDIUM';
    }
    if (!Array.isArray(data.requirements)) data.requirements = [];
    if (!Array.isArray(data.missingQuestions)) data.missingQuestions = [];
    if (!data.currency) data.currency = 'INR';

    return data;
  }

  // ── Generate Customer Response ─────────────────────────────────────────────

  async generateResponse(context: EnquiryContext): Promise<GeneratedResponse> {
    const systemPrompt = `You are a professional business communication expert for an Indian small business.
Draft a warm, professional response to this customer enquiry.
You MUST respond with valid JSON only.

Return this exact JSON structure:
{
  "response": "full email/response text here"
}

The response should:
- Address the customer by name if known
- Acknowledge their specific requirements
- Mention any missing information you need (from missingQuestions)
- Be polite, professional, and action-oriented
- Be appropriate for an Indian business context (use INR for currency)
- NOT make any pricing commitments
- End with next steps`;

    const userContent = `Enquiry context:
Customer: ${context.customerName || 'Unknown'}
Email: ${context.customerEmail || 'Not provided'}
Requirements: ${(context.requirements || []).join(', ') || 'See raw content'}
Budget: ${context.budget ? `${context.currency || 'INR'} ${context.budget}` : 'Not specified'}
Timeline: ${context.timeline || 'Not specified'}
Priority: ${context.priority || 'MEDIUM'}
Missing info needed: ${(context.missingQuestions || []).join('; ') || 'None'}
Original enquiry: ${context.rawContent}`;

    const raw = await this.complete(systemPrompt, userContent);
    return extractJSON<GeneratedResponse>(raw);
  }

  // ── Generate Quotation ────────────────────────────────────────────────────

  async generateQuotation(context: EnquiryContext): Promise<GeneratedQuotation> {
    const systemPrompt = `You are a senior business consultant creating a professional quotation for an Indian small business.
Create a realistic, itemised quotation/proposal based on the enquiry.
You MUST respond with valid JSON only.

Return this exact JSON structure:
{
  "title": "Proposal title string",
  "description": "Brief scope description",
  "items": [
    { "description": "Item name", "quantity": 1, "unitPrice": 0, "total": 0 }
  ],
  "subtotal": 0,
  "tax": 0,
  "total": 0,
  "currency": "INR",
  "validityDays": 30,
  "notes": "Payment terms and important notes"
}

Rules:
- Use realistic Indian market pricing (INR)
- GST is typically 18% on software/IT services
- Break down into meaningful line items (3-6 items)
- total = subtotal + tax
- validityDays: 30 for standard, 7 for urgent (HIGH priority)
- notes should include payment terms (e.g., 50% advance, 50% on delivery)`;

    const userContent = `Enquiry context:
Customer: ${context.customerName || 'Client'}
Requirements: ${(context.requirements || []).join(', ') || context.rawContent}
Budget: ${context.budget ? `${context.currency || 'INR'} ${context.budget}` : 'Not specified — estimate appropriately'}
Timeline: ${context.timeline || 'Standard'}
Priority: ${context.priority || 'MEDIUM'}
Summary: ${context.aiSummary || context.rawContent}`;

    const raw = await this.complete(systemPrompt, userContent);
    const data = extractJSON<GeneratedQuotation>(raw);

    // Validate required fields
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new AIError('Mistral generated an invalid quotation: items array is empty');
    }
    if (!data.currency) data.currency = 'INR';
    if (!data.validityDays) data.validityDays = 30;

    return data;
  }

  // ── Generate Follow-Ups ───────────────────────────────────────────────────

  async generateFollowUps(context: EnquiryContext): Promise<GeneratedFollowUps> {
    const systemPrompt = `You are a business workflow manager creating actionable follow-up tasks.
Generate 3-5 practical follow-up tasks for this business enquiry.
You MUST respond with valid JSON only.

Return this exact JSON structure:
{
  "followUps": [
    {
      "title": "Short action title",
      "description": "Detailed description of what to do",
      "daysFromNow": 1
    }
  ]
}

Rules:
- HIGH priority: first task due in 0-2 hours (use daysFromNow: 0), then 1-2 days
- MEDIUM priority: first task due in 1-2 days
- LOW priority: first task due in 3-5 days
- Tasks should be specific and actionable
- Include tasks like: confirm requirements, send quotation, follow up on decision`;

    const userContent = `Enquiry context:
Customer: ${context.customerName || 'Unknown'}
Contact: ${context.customerEmail || context.customerPhone || 'Not provided'}
Priority: ${context.priority || 'MEDIUM'}
Requirements: ${(context.requirements || []).join(', ') || 'See summary'}
Missing info: ${(context.missingQuestions || []).join('; ') || 'None'}
Summary: ${context.aiSummary || context.rawContent}`;

    const raw = await this.complete(systemPrompt, userContent);
    const data = extractJSON<GeneratedFollowUps>(raw);

    if (!Array.isArray(data.followUps)) {
      throw new AIError('Mistral generated invalid follow-ups: missing followUps array');
    }

    return data;
  }
}
