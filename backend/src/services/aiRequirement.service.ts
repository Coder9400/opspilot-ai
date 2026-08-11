import { Mistral } from '@mistralai/mistralai';
import { env } from '../config/env';
import { AIError } from '../utils/errors';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProcurementRequirementItem {
  category:             string;
  product_name:         string;
  description:          string;
  quantity:             number | null;
  unit:                 string;
  specifications:       string[];
  delivery_requirement: string;
}

export interface MissingInformationItem {
  question: string;
  reason:   string;
}

export interface ProcurementAnalysis {
  summary:             string;
  project_context:     string;
  requirements:        ProcurementRequirementItem[];
  missing_information: MissingInformationItem[];
  confidence:          number;
}

export interface RFQDocument {
  title:             string;
  description:       string;
  delivery_location: string;
  response_deadline: string;
  terms:             string;
  items: {
    category:       string;
    product_name:   string;
    description:    string;
    quantity:       number | null;
    unit:           string;
    specifications: string[];
  }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractJSON<T>(text: string): T {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenceMatch ? fenceMatch[1].trim() : text.trim();
  const jsonStart = raw.search(/[{[]/);
  const clean = jsonStart >= 0 ? raw.slice(jsonStart) : raw;
  try {
    return JSON.parse(clean) as T;
  } catch {
    throw new AIError(
      `AI returned a response that could not be parsed as JSON.\nRaw output (first 500 chars): ${clean.slice(0, 500)}`
    );
  }
}

function validateAnalysis(data: unknown): ProcurementAnalysis {
  const d = data as Record<string, unknown>;

  if (!d || typeof d !== 'object') {
    throw new AIError('AI returned invalid analysis structure');
  }

  // Ensure required string fields
  const summary         = typeof d.summary === 'string'         ? d.summary         : 'Analysis complete.';
  const project_context = typeof d.project_context === 'string' ? d.project_context : '';
  const confidence      = typeof d.confidence === 'number'      ? Math.min(Math.max(d.confidence, 0), 1) : 0.5;

  // Validate requirements array
  const rawReqs = Array.isArray(d.requirements) ? d.requirements : [];
  const requirements: ProcurementRequirementItem[] = rawReqs
    .filter((r): r is Record<string, unknown> => r && typeof r === 'object')
    .map((r) => ({
      category:             typeof r.category === 'string'     ? r.category     : 'General',
      product_name:         typeof r.product_name === 'string' ? r.product_name : 'Unnamed Item',
      description:          typeof r.description === 'string'  ? r.description  : '',
      quantity:             typeof r.quantity === 'number'      ? r.quantity     : null,
      unit:                 typeof r.unit === 'string'          ? r.unit         : 'unit',
      specifications:       Array.isArray(r.specifications)    ? r.specifications.filter((s: unknown) => typeof s === 'string') : [],
      delivery_requirement: typeof r.delivery_requirement === 'string' ? r.delivery_requirement : '',
    }));

  // Validate missing_information array
  const rawMissing = Array.isArray(d.missing_information) ? d.missing_information : [];
  const missing_information: MissingInformationItem[] = rawMissing
    .filter((m): m is Record<string, unknown> => m && typeof m === 'object')
    .map((m) => ({
      question: typeof m.question === 'string' ? m.question : String(m.question ?? ''),
      reason:   typeof m.reason === 'string'   ? m.reason   : '',
    }))
    .filter((m) => m.question.trim() !== '');

  return { summary, project_context, requirements, missing_information, confidence };
}

function validateRFQ(data: unknown): RFQDocument {
  const d = data as Record<string, unknown>;

  if (!d || typeof d !== 'object') {
    throw new AIError('AI returned invalid RFQ structure');
  }

  const title             = typeof d.title === 'string'             ? d.title             : 'Request for Quotation';
  const description       = typeof d.description === 'string'       ? d.description       : '';
  const delivery_location = typeof d.delivery_location === 'string' ? d.delivery_location : '';
  const response_deadline = typeof d.response_deadline === 'string' ? d.response_deadline : '';
  const terms             = typeof d.terms === 'string'             ? d.terms             : 'Standard terms apply.';

  const rawItems = Array.isArray(d.items) ? d.items : [];
  const items = rawItems
    .filter((item): item is Record<string, unknown> => item && typeof item === 'object')
    .map((item) => ({
      category:       typeof item.category === 'string'     ? item.category     : 'General',
      product_name:   typeof item.product_name === 'string' ? item.product_name : 'Item',
      description:    typeof item.description === 'string'  ? item.description  : '',
      quantity:       typeof item.quantity === 'number'      ? item.quantity     : null,
      unit:           typeof item.unit === 'string'          ? item.unit         : 'unit',
      specifications: Array.isArray(item.specifications)    ? item.specifications.filter((s: unknown) => typeof s === 'string') : [],
    }));

  if (items.length === 0) {
    throw new AIError('AI generated RFQ with no line items');
  }

  return { title, description, delivery_location, response_deadline, terms, items };
}

// ─── AI Requirement Service ────────────────────────────────────────────────────
// Separate from the existing AIService (which handles CRM enquiries).
// This service is exclusively for Phase 2 procurement analysis.

class AIRequirementServiceClass {
  private client: Mistral;
  private readonly model = 'mistral-small-latest';

  constructor() {
    if (!env.MISTRAL_API_KEY) {
      throw new AIError('MISTRAL_API_KEY is not configured. Add it to backend/.env');
    }
    this.client = new Mistral({ apiKey: env.MISTRAL_API_KEY });
  }

  private async complete(systemPrompt: string, userContent: string): Promise<string> {
    try {
      const response = await this.client.chat.complete({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userContent },
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
      throw new AIError(`Mistral API error: ${(err as Error).message || 'Unknown error'}`);
    }
  }

  // ── Analyze a raw procurement requirement ──────────────────────────────────

  async analyzeProcurementRequirement(rawText: string): Promise<ProcurementAnalysis> {
    const systemPrompt = `You are an expert B2B procurement analyst for an Indian industrial procurement platform.
A customer has submitted a natural-language procurement requirement.
Your job is to extract structured procurement information and identify any missing details.

You MUST respond with valid JSON only. No text outside the JSON.

Return EXACTLY this JSON structure:
{
  "summary": "2-3 sentence professional summary of what the customer needs",
  "project_context": "Brief description of the project or use case",
  "requirements": [
    {
      "category": "category of item (e.g. Steel, Cement, Electrical, Plumbing, etc.)",
      "product_name": "specific product name",
      "description": "detailed description of the item",
      "quantity": 100,
      "unit": "unit of measurement (tons, bags, meters, pieces, etc.)",
      "specifications": ["spec 1", "spec 2"],
      "delivery_requirement": "delivery timeline or location requirement if mentioned"
    }
  ],
  "missing_information": [
    {
      "question": "specific question to ask the customer",
      "reason": "why this information is needed for procurement"
    }
  ],
  "confidence": 0.8
}

Rules:
- Extract every distinct product/material as a separate requirement item
- quantity must be a number (not a string). If unknown, use null
- specifications should be an array of strings (grade, brand, standard, color, etc.)
- confidence: 0.0 to 1.0 — how complete the requirement information is
- If confidence >= 0.7 and requirements are extracted, missing_information can be empty
- If confidence < 0.7, always include clarification questions
- Always identify: delivery location, delivery timeline, product specifications, quantities
- For construction materials: always ask about grade/quality if not specified`;

    const raw = await this.complete(systemPrompt, `Customer requirement:\n${rawText}`);
    let data: unknown;
    try {
      data = extractJSON<unknown>(raw);
    } catch {
      // Retry once
      const raw2 = await this.complete(systemPrompt, `Customer requirement:\n${rawText}`);
      data = extractJSON<unknown>(raw2);
    }
    return validateAnalysis(data);
  }

  // ── Re-analyze with customer answers ──────────────────────────────────────

  async reanalyzeProcurementRequirement(
    rawText:     string,
    prevAnalysis: ProcurementAnalysis,
    answers:     Array<{ question: string; answer: string | null; status: string }>
  ): Promise<ProcurementAnalysis> {
    const systemPrompt = `You are an expert B2B procurement analyst for an Indian industrial procurement platform.
A customer submitted a procurement requirement. They answered clarification questions.
Now update the structured procurement analysis with the new information.

You MUST respond with valid JSON only using the EXACT same structure as before.

Return EXACTLY this JSON structure:
{
  "summary": "updated 2-3 sentence summary incorporating the answers",
  "project_context": "updated project context",
  "requirements": [
    {
      "category": "category",
      "product_name": "product name",
      "description": "updated description",
      "quantity": 100,
      "unit": "unit",
      "specifications": ["spec1", "spec2"],
      "delivery_requirement": "updated delivery requirement"
    }
  ],
  "missing_information": [],
  "confidence": 0.95
}

Rules:
- Incorporate answers into the requirements (update specifications, quantities, delivery details)
- If all important questions are answered, missing_information should be empty or minimal
- If critical information is still missing, include remaining questions
- confidence should increase after answers are provided
- Aim for confidence >= 0.8 after clarification`;

    const answeredQuestions = answers
      .filter((a) => a.status === 'ANSWERED' && a.answer)
      .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
      .join('\n\n');

    const userContent = `Original requirement:
${rawText}

Previous analysis summary:
${prevAnalysis.summary}

Customer answers to clarification questions:
${answeredQuestions || 'No answers provided'}

Previous requirements identified:
${JSON.stringify(prevAnalysis.requirements, null, 2)}`;

    const raw = await this.complete(systemPrompt, userContent);
    let data: unknown;
    try {
      data = extractJSON<unknown>(raw);
    } catch {
      const raw2 = await this.complete(systemPrompt, userContent);
      data = extractJSON<unknown>(raw2);
    }
    return validateAnalysis(data);
  }

  // ── Generate RFQ document ─────────────────────────────────────────────────

  async generateRFQFromRequirement(
    requestTitle:   string,
    companyName:    string,
    analysis:       ProcurementAnalysis,
    rawRequirement: string
  ): Promise<RFQDocument> {
    const systemPrompt = `You are a professional procurement officer generating a formal Request for Quotation (RFQ) document for an Indian B2B platform.
Generate a professional, complete RFQ based on the procurement analysis.

You MUST respond with valid JSON only.

Return EXACTLY this JSON structure:
{
  "title": "Professional RFQ title",
  "description": "Detailed description of the procurement requirement and scope",
  "delivery_location": "delivery location from the requirement",
  "response_deadline": "YYYY-MM-DD format date (30 days from today if not specified)",
  "terms": "Standard procurement terms and conditions including: payment terms, delivery terms, warranty, quality requirements, etc.",
  "items": [
    {
      "category": "category",
      "product_name": "product name",
      "description": "detailed item description for suppliers",
      "quantity": 100,
      "unit": "unit of measurement",
      "specifications": ["technical spec 1", "technical spec 2"]
    }
  ]
}

Rules:
- title should be professional (e.g. "RFQ-STEEL-2024: Structural Steel Requirements")
- description should give suppliers full context about the project
- delivery_location: extract from requirement or write "To be confirmed"
- response_deadline: calculate 30 days from today if not specified
- terms should be comprehensive B2B procurement terms
- Each item should have clear technical specifications for suppliers to quote accurately
- quantity must be a number (not a string), use null if unknown`;

    const today = new Date();
    const deadline = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const deadlineStr = deadline.toISOString().split('T')[0];

    const userContent = `Company requesting quotes: ${companyName}
RFQ Title requested: ${requestTitle}
Today's date: ${today.toISOString().split('T')[0]}
Default response deadline (if not specified): ${deadlineStr}

Original requirement:
${rawRequirement}

Extracted requirements:
${JSON.stringify(analysis.requirements, null, 2)}

Project context:
${analysis.project_context}`;

    const raw = await this.complete(systemPrompt, userContent);
    let data: unknown;
    try {
      data = extractJSON<unknown>(raw);
    } catch {
      const raw2 = await this.complete(systemPrompt, userContent);
      data = extractJSON<unknown>(raw2);
    }
    return validateRFQ(data);
  }
}

// Lazy singleton — only instantiated when first used
let _instance: AIRequirementServiceClass | null = null;

export const AIRequirementService = {
  getInstance(): AIRequirementServiceClass {
    if (!_instance) {
      _instance = new AIRequirementServiceClass();
    }
    return _instance;
  },

  analyzeProcurementRequirement(rawText: string) {
    return AIRequirementService.getInstance().analyzeProcurementRequirement(rawText);
  },

  reanalyzeProcurementRequirement(
    rawText: string,
    prevAnalysis: ProcurementAnalysis,
    answers: Array<{ question: string; answer: string | null; status: string }>
  ) {
    return AIRequirementService.getInstance().reanalyzeProcurementRequirement(rawText, prevAnalysis, answers);
  },

  generateRFQFromRequirement(
    requestTitle: string,
    companyName: string,
    analysis: ProcurementAnalysis,
    rawRequirement: string
  ) {
    return AIRequirementService.getInstance().generateRFQFromRequirement(requestTitle, companyName, analysis, rawRequirement);
  },
};
