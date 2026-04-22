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
 *
 * The questionnaire field is optional because in the pay-first flow a lead is
 * created by the Stripe webhook at payment time (with only payment info); the
 * customer then clicks the onboarding email link and submits the questionnaire,
 * which populates this field and flips pdfStatus from 'awaiting_questionnaire'
 * to 'pending' so the PDF pipeline runs.
 */
export interface LeadRecord {
  questionnaire?: QuestionnaireData;

  // Payment status
  paidAt?: string;             // ISO
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeAmount?: number;       // in minor units (pence)
  stripeCurrency?: string;
  stripeCustomerEmail?: string;

  // Which product was paid for (copied from Stripe line items; used for
  // onboarding-email copy and to pick the right form/template once the
  // customer completes the questionnaire). Optional because older records
  // store this only inside questionnaire.product.
  product?: Product;

  // Onboarding-email tracking (pay-first flow: we mail the questionnaire
  // link at payment time).
  onboardingEmailSentAt?: string;
  onboardingEmailError?: string;

  // PDF status
  //   awaiting_questionnaire — paid, but the customer has not yet submitted the form
  //   pending                — questionnaire submitted, PDF not yet started
  //   generating             — PDF render in flight
  //   ready                  — PDF stored in R2 and emailed
  //   failed                 — last generation attempt failed (see pdfError)
  pdfStatus: 'awaiting_questionnaire' | 'pending' | 'generating' | 'ready' | 'failed';
  pdfKey?: string;              // R2 object key
  pdfGeneratedAt?: string;
  pdfError?: string;

  // Email status
  emailedAt?: string;
  emailError?: string;
}
