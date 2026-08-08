import { Mistral } from '@mistralai/mistralai';
import { env } from '../config/env';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuotationLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ExtractedQuotation {
  quotationNumber: string | null;
  quotationTitle: string | null;
  supplier: {
    name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  customer: {
    name: string | null;
    email: string | null;
  };
  date: string | null;
  validUntil: string | null;
  currency: string;
  items: QuotationLineItem[];
  subtotal: number | null;
  tax: number | null;
  grandTotal: number | null;
  terms: string | null;
  notes: string | null;
}

export interface ExtractionResult {
  status: 'READY' | 'REVIEW_REQUIRED' | 'FAILED';
  extracted: ExtractedQuotation | null;
  rawText: string;
  hasDiscrepancy: boolean;
  discrepancyNotes: string | null;
  aiInsights: string[] | null;
  error?: string;
}

// ─── PDF Text Extraction ───────────────────────────────────────────────────────

export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(pdfBuffer);
    return (data.text || '').trim();
  } catch (err) {
    throw new Error(`PDF text extraction failed: ${(err as Error).message}`);
  }
}

// ─── Mistral AI Quotation Extraction ──────────────────────────────────────────

const EXTRACTION_PROMPT = (pdfText: string) => `
You are a business document parser. Extract structured quotation data from the following PDF text.

IMPORTANT RULES:
- Only extract what is actually present in the text
- Do NOT invent values
- If a field is missing, set it to null
- All numeric values must be actual numbers (not strings)
- Currency should be a 3-letter code (INR, USD, GBP, EUR, etc.) or null if unknown
- Dates should be ISO format (YYYY-MM-DD) or null

PDF TEXT:
===
${pdfText}
===

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "quotationNumber": "string or null",
  "quotationTitle": "string or null",
  "supplier": {
    "name": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "address": "string or null"
  },
  "customer": {
    "name": "string or null",
    "email": "string or null"
  },
  "date": "YYYY-MM-DD or null",
  "validUntil": "YYYY-MM-DD or null",
  "currency": "INR or USD etc or null",
  "items": [
    {
      "description": "string",
      "quantity": number,
      "unitPrice": number,
      "subtotal": number
    }
  ],
  "subtotal": number or null,
  "tax": number or null,
  "grandTotal": number or null,
  "terms": "string or null",
  "notes": "string or null"
}`;

export async function extractQuotationWithAI(pdfText: string): Promise<ExtractedQuotation | null> {
  try {
    const client = new Mistral({ apiKey: env.MISTRAL_API_KEY });
    const response = await client.chat.complete({
      model: 'mistral-small-latest',
      messages: [
        { role: 'system', content: 'You are a precise business document parser. Always respond with valid JSON only, no markdown.' },
        { role: 'user', content: EXTRACTION_PROMPT(pdfText) },
      ],
      responseFormat: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') return null;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as ExtractedQuotation;
    if (!Array.isArray(parsed.items)) parsed.items = [];
    return parsed;
  } catch (err) {
    console.error('[PDF] AI extraction error:', err);
    return null;
  }
}

// ─── Financial Validation ────────────────────────────────────────────────────

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function validateFinancials(extracted: ExtractedQuotation): {
  hasDiscrepancy: boolean;
  notes: string[];
} {
  const notes: string[] = [];
  let hasDiscrepancy = false;

  // Validate each line item: quantity × unitPrice = subtotal
  for (let i = 0; i < extracted.items.length; i++) {
    const item = extracted.items[i];
    const expectedSubtotal = round2(item.quantity * item.unitPrice);
    const diff = Math.abs(expectedSubtotal - item.subtotal);
    if (diff > 0.5) {
      hasDiscrepancy = true;
      notes.push(
        `Line ${i + 1} (${item.description}): quantity(${item.quantity}) × unitPrice(${item.unitPrice}) = ${expectedSubtotal}, but PDF shows ${item.subtotal}`
      );
    }
  }

  // Validate subtotal = sum of line item subtotals
  if (extracted.items.length > 0 && extracted.subtotal !== null) {
    const calcSubtotal = round2(extracted.items.reduce((sum, i) => sum + i.subtotal, 0));
    const diff = Math.abs(calcSubtotal - extracted.subtotal);
    if (diff > 1) {
      hasDiscrepancy = true;
      notes.push(
        `Subtotal discrepancy: sum of items = ${calcSubtotal}, PDF shows ${extracted.subtotal}`
      );
    }
  }

  // Validate grandTotal = subtotal + tax
  if (extracted.subtotal !== null && extracted.tax !== null && extracted.grandTotal !== null) {
    const calcTotal = round2(extracted.subtotal + extracted.tax);
    const diff = Math.abs(calcTotal - extracted.grandTotal);
    if (diff > 1) {
      hasDiscrepancy = true;
      notes.push(
        `Grand total discrepancy: ${extracted.subtotal} + ${extracted.tax} (tax) = ${calcTotal}, PDF shows ${extracted.grandTotal}`
      );
    }
  }

  return { hasDiscrepancy, notes };
}

// ─── Generate AI Insights ─────────────────────────────────────────────────────

export function generateInsights(extracted: ExtractedQuotation, discrepancyNotes: string[]): string[] {
  const insights: string[] = [];

  // Discrepancy alerts
  for (const note of discrepancyNotes) {
    insights.push(`⚠ Financial discrepancy: ${note}`);
  }

  // Validity check
  if (extracted.validUntil) {
    const validDate = new Date(extracted.validUntil);
    const today = new Date();
    const daysLeft = Math.floor((validDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) {
      insights.push(`⚠ This quotation expired ${Math.abs(daysLeft)} days ago`);
    } else if (daysLeft <= 7) {
      insights.push(`⚠ This quotation expires in ${daysLeft} days — act quickly`);
    } else {
      insights.push(`✓ Quotation valid for ${daysLeft} more days`);
    }
  }

  // Grand total present
  if (extracted.grandTotal !== null) {
    insights.push(`✓ Grand total: ${extracted.currency ?? ''} ${extracted.grandTotal?.toLocaleString()}`);
  } else {
    insights.push(`⚠ Grand total could not be extracted — please review manually`);
  }

  // Terms warning
  if (extracted.terms && extracted.terms.toLowerCase().includes('advance')) {
    insights.push(`⚠ Payment terms mention advance payment — review before committing`);
  }

  return insights;
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────

export async function processPDF(pdfBuffer: Buffer, fileName: string): Promise<ExtractionResult> {
  console.log(`[PDF] Processing: ${fileName}`);

  // Step 1: Extract text
  let rawText = '';
  try {
    rawText = await extractTextFromPDF(pdfBuffer);
    console.log(`[PDF] Extracted ${rawText.length} chars of text`);
  } catch (err) {
    return {
      status: 'FAILED',
      extracted: null,
      rawText: '',
      hasDiscrepancy: false,
      discrepancyNotes: null,
      aiInsights: null,
      error: (err as Error).message,
    };
  }

  if (rawText.length < 50) {
    return {
      status: 'FAILED',
      extracted: null,
      rawText,
      hasDiscrepancy: false,
      discrepancyNotes: null,
      aiInsights: [`⚠ PDF appears to be scanned or image-based. Text extraction returned very little content (${rawText.length} chars). Manual entry required.`],
      error: 'Insufficient text content extracted from PDF',
    };
  }

  // Step 2: Mistral AI extraction
  const extracted = await extractQuotationWithAI(rawText);
  if (!extracted) {
    return {
      status: 'REVIEW_REQUIRED',
      extracted: null,
      rawText,
      hasDiscrepancy: false,
      discrepancyNotes: null,
      aiInsights: ['⚠ AI could not extract structured data. Please review manually.'],
      error: 'AI extraction returned no data',
    };
  }

  // Step 3: Financial validation
  const { hasDiscrepancy, notes } = validateFinancials(extracted);

  // Step 4: Generate insights
  const insights = generateInsights(extracted, notes);

  const status = hasDiscrepancy ? 'REVIEW_REQUIRED' : 'READY';

  console.log(`[PDF] Extraction complete. Status=${status} Discrepancy=${hasDiscrepancy}`);

  return {
    status,
    extracted,
    rawText,
    hasDiscrepancy,
    discrepancyNotes: notes.length > 0 ? notes.join('; ') : null,
    aiInsights: insights,
  };
}
