// ─── AI Analysis Result ────────────────────────────────────────────────────────

export interface EnquiryAnalysis {
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  requirements: string[];
  budget: number | null;
  currency: string;
  timeline: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  missingQuestions: string[];
  summary: string;
}

// ─── Generated Content ─────────────────────────────────────────────────────────

export interface GeneratedResponse {
  response: string;
}

export interface QuotationItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface GeneratedQuotation {
  title: string;
  description: string;
  items: QuotationItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  validityDays: number;
  notes: string;
}

export interface GeneratedFollowUpItem {
  title: string;
  description: string;
  daysFromNow: number;
}

export interface GeneratedFollowUps {
  followUps: GeneratedFollowUpItem[];
}

// ─── Enquiry Context passed to AI ─────────────────────────────────────────────

export interface EnquiryContext {
  rawContent: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  requirements?: string[] | null;
  budget?: number | null;
  currency?: string | null;
  timeline?: string | null;
  priority?: string | null;
  missingQuestions?: string[] | null;
  aiSummary?: string | null;
}

// ─── Provider Interface ────────────────────────────────────────────────────────

export interface AIProvider {
  analyzeEnquiry(content: string): Promise<EnquiryAnalysis>;
  generateResponse(context: EnquiryContext): Promise<GeneratedResponse>;
  generateQuotation(context: EnquiryContext): Promise<GeneratedQuotation>;
  generateFollowUps(context: EnquiryContext): Promise<GeneratedFollowUps>;
}
