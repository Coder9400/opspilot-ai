import {
  AIProvider,
  EnquiryAnalysis,
  GeneratedResponse,
  GeneratedQuotation,
  GeneratedFollowUps,
  EnquiryContext,
} from '../ai.types';

/**
 * Mock AI Provider
 *
 * Deterministic, rule-based provider for local development and hackathon demos.
 * Does NOT call any external API. Enable with AI_PROVIDER=mock in .env
 *
 * This is clearly separated from real providers and must never be used in production.
 */
export class MockProvider implements AIProvider {
  async analyzeEnquiry(content: string): Promise<EnquiryAnalysis> {
    // ── Simple heuristic extraction ─────────────────────────────────────────
    const emailMatch = content.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = content.match(/(?:\+91[\s-]?)?[6-9]\d{9}|[\+\d][\d\s\-().]{9,14}/);
    const budgetMatch = content.match(
      /(?:budget|price|cost|amount|spend)[^\d]*(\d[\d,]*)/i
    );

    const hasUrgent = /urgent|asap|immediately|today|emergency|critical/i.test(content);
    const hasLargeBudget =
      budgetMatch && parseFloat(budgetMatch[1].replace(/,/g, '')) >= 200000;
    const hasTimeline = /week|month|day|by\s+\w+|within|deadline/i.test(content);
    const hasBudget = !!budgetMatch;

    let priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (hasUrgent || hasLargeBudget) priority = 'HIGH';
    else if (hasBudget && hasTimeline) priority = 'MEDIUM';

    const budget = budgetMatch
      ? parseFloat(budgetMatch[1].replace(/,/g, ''))
      : null;

    return {
      customerName: extractName(content),
      customerEmail: emailMatch ? emailMatch[0] : null,
      customerPhone: phoneMatch ? phoneMatch[0].trim() : null,
      requirements: extractRequirements(content),
      budget,
      currency: 'INR',
      timeline: extractTimeline(content),
      priority,
      missingQuestions: generateMissingQuestions(content, emailMatch, phoneMatch, budgetMatch),
      summary: buildSummary(content, priority),
    };
  }

  async generateResponse(context: EnquiryContext): Promise<GeneratedResponse> {
    const name = context.customerName || 'Valued Customer';
    const reqList =
      context.requirements && context.requirements.length > 0
        ? context.requirements.map((r) => `• ${r}`).join('\n')
        : '• Your business requirements (as discussed)';

    const budgetLine = context.budget
      ? `\nYour indicated budget of ${context.currency || 'INR'} ${context.budget.toLocaleString()} has been noted.`
      : '';

    const timelineLine = context.timeline
      ? `\nDesired timeline: ${context.timeline}.`
      : '';

    const missingSection =
      context.missingQuestions && context.missingQuestions.length > 0
        ? `\n\nTo help us serve you better, could you please provide the following information:\n${context.missingQuestions.map((q) => `• ${q}`).join('\n')}`
        : '';

    return {
      response: `Dear ${name},

Thank you for reaching out to us! We are pleased to receive your enquiry and look forward to assisting you.

We have carefully reviewed your requirements:
${reqList}
${budgetLine}${timelineLine}${missingSection}

Our team is currently reviewing your requirements and will prepare a detailed proposal for you. We typically respond within 24–48 business hours.

Please do not hesitate to contact us if you have any immediate questions.

Warm regards,
The OPSPILOT Business Team`,
    };
  }

  async generateQuotation(context: EnquiryContext): Promise<GeneratedQuotation> {
    const requirements = context.requirements?.length
      ? context.requirements
      : ['Professional Services'];

    const targetBudget = context.budget || 50000;
    const perItem = Math.round(targetBudget / requirements.length);

    const items = requirements.slice(0, 5).map((req, i) => {
      const price = Math.max(5000, Math.round(perItem * (0.7 + i * 0.15)));
      return {
        description: req,
        quantity: 1,
        unitPrice: price,
        total: price,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = Math.round(subtotal * 0.18); // 18% GST
    const total = subtotal + tax;

    return {
      title: `Service Proposal — ${context.customerName || 'Client'}`,
      description:
        'Comprehensive service proposal tailored to your business requirements. All deliverables and timelines are as agreed.',
      items,
      subtotal,
      tax,
      total,
      currency: context.currency || 'INR',
      validityDays: 30,
      notes:
        'This quotation is valid for 30 days from the date of issue. Prices are inclusive of GST at 18%. ' +
        'Payment terms: 50% advance upon order confirmation, 50% upon project completion. ' +
        'Any scope changes will be quoted separately.',
    };
  }

  async generateFollowUps(context: EnquiryContext): Promise<GeneratedFollowUps> {
    const followUps: GeneratedFollowUps['followUps'] = [];
    const isHighPriority = context.priority === 'HIGH';

    followUps.push({
      title: 'Send acknowledgement response to customer',
      description: `Send the generated response to ${
        context.customerName || 'the customer'
      } confirming receipt of their enquiry.`,
      daysFromNow: isHighPriority ? 1 : 1,
    });

    if (context.missingQuestions && context.missingQuestions.length > 0) {
      followUps.push({
        title: 'Gather missing information',
        description: `Contact customer to clarify: ${context.missingQuestions
          .slice(0, 3)
          .join('; ')}.`,
        daysFromNow: isHighPriority ? 1 : 2,
      });
    }

    followUps.push({
      title: 'Confirm detailed requirements',
      description:
        'Schedule a discovery call or send a detailed requirements questionnaire to confirm all project scope.',
      daysFromNow: isHighPriority ? 2 : 3,
    });

    if (context.budget) {
      followUps.push({
        title: 'Follow up on quotation review',
        description:
          'Check if the customer has reviewed the quotation. Address any questions or negotiate terms.',
        daysFromNow: isHighPriority ? 3 : 7,
      });
    }

    followUps.push({
      title: 'Confirm project timeline and milestones',
      description:
        'Agree on a finalised project schedule with clear milestones and delivery dates.',
      daysFromNow: isHighPriority ? 5 : 10,
    });

    return { followUps };
  }
}

// ─── Extraction helpers ────────────────────────────────────────────────────────

function extractName(content: string): string | null {
  const patterns = [
    /(?:my name is|i am|i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /(?:regards|sincerely|thanks)[,\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /^([A-Z][a-z]+\s+[A-Z][a-z]+)[,\s]/m,
  ];
  for (const p of patterns) {
    const m = content.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

function extractRequirements(content: string): string[] {
  const keywords = [
    'website',
    'web app',
    'mobile app',
    'application',
    'software',
    'e-commerce',
    'ecommerce',
    'online store',
    'inventory management',
    'CRM',
    'ERP',
    'accounting software',
    'POS system',
    'dashboard',
    'analytics',
    'automation',
    'chatbot',
    'logo design',
    'branding',
    'SEO',
    'digital marketing',
    'social media',
    'content writing',
    'graphic design',
    'UI/UX design',
    'API integration',
    'data migration',
    'cloud hosting',
    'support',
    'maintenance',
  ];

  const found = keywords.filter((k) => new RegExp(`\\b${k}\\b`, 'i').test(content));
  if (found.length === 0) return ['Custom business solution'];
  return found.slice(0, 6);
}

function extractTimeline(content: string): string | null {
  const patterns = [
    /(?:within|in)\s+(\d+\s+(?:days?|weeks?|months?))/i,
    /(?:by|before|deadline:?)\s+([\w\s,]+\d{4})/i,
    /(?:urgent|asap|immediately|as soon as possible)/i,
    /(\d+)\s*(?:weeks?|months?)\s+(?:deadline|timeline|timeframe)/i,
  ];

  for (const p of patterns) {
    const m = content.match(p);
    if (m) {
      if (/urgent|asap|immediately|as soon as possible/i.test(m[0])) {
        return 'As soon as possible';
      }
      return m[1]?.trim() || m[0].trim();
    }
  }
  return null;
}

function generateMissingQuestions(
  content: string,
  emailMatch: RegExpMatchArray | null,
  phoneMatch: RegExpMatchArray | null,
  budgetMatch: RegExpMatchArray | null
): string[] {
  const questions: string[] = [];

  if (!emailMatch) questions.push('What is your email address?');
  if (!phoneMatch) questions.push('What is your contact phone number?');
  if (!budgetMatch) questions.push('What is your approximate budget for this project?');
  if (!/timeline|deadline|by|within|week|month/i.test(content)) {
    questions.push('What is your desired project timeline or deadline?');
  }
  if (!/location|city|state|address|where|based/i.test(content)) {
    questions.push('What is your business location?');
  }

  return questions.slice(0, 4);
}

function buildSummary(content: string, priority: string): string {
  const words = content.trim().split(/\s+/);
  const preview = words.slice(0, 30).join(' ');
  return `${priority} priority customer enquiry. ${preview}${words.length > 30 ? '...' : ''}`;
}
