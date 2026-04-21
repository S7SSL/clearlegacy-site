/**
 * Shared types for the Clear Legacy Worker.
 * QuestionnaireData matches the fields in forms/will.html.
 * Any rename here requires updating the form and the will.html template.
 */

export type Product = 'single' | 'mirror';

export interface Executor {
  name: string;
  relationship?: string;
  address?: string;
}

export interface Beneficiary {
  name: string;
  relationship?: string;
  share?: string; // e.g. "50%" or "Residuary estate"
  gift?: string;  // e.g. "My wedding ring"
}

export interface Guardian {
  name: string;
  relationship?: string;
  address?: string;
}

export interface Person {
  fullName: string;
  address: string;
  dob?: string;           // YYYY-MM-DD
  email?: string;
  phone?: string;
}

/**
 * Single source of truth for what the form sends us.
 * The form must send exactly these fields (or fewer — missing ones become blanks in the Will).
 */
export interface QuestionnaireData {
  ref: string;            // UUID we assign
  product: Product;
  createdAt: string;      // ISO

  // Testator (person 1)
  testator: Person;

  // For mirror wills only:
  partner?: Person;

  // Executors (1–4 recommended)
  executors: Executor[];

  // Guardians for minor children, if any
  guardians?: Guardian[];

  // Specific gifts (optional)
  specificGifts?: Beneficiary[];

  // Residuary beneficiaries (at least one required)
  residuary: Beneficiary[];

  // Funeral wishes (free text, optional)
  funeralWishes?: string;

  // Free-text notes the client wants considered
  notes?: string;

  // Marketing opt-in (not a legal field)
  marketingOptIn?: boolean;
}

/**
 * What we store in KV against the questionnaire key.
 * Separate from QuestionnaireData so we can track pipeline state.
 */
export interface LeadRecord {
  questionnaire: QuestionnaireData;

  // Payment status
  paidAt?: string;             // ISO
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeAmount?: number;       // in minor units (pence)
  stripeCurrency?: string;
  stripeCustomerEmail?: string;

  // PDF status
  pdfStatus: 'pending' | 'generating' | 'ready' | 'failed';
  pdfKey?: string;              // R2 object key
  pdfGeneratedAt?: string;
  pdfError?: string;

  // Email status
  emailedAt?: string;
  emailError?: string;
}
