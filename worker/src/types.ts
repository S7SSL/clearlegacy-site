/**
 * Shared types for the Clear Legacy Worker.
 *
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
  dob?: string; // YYYY-MM-DD
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
 * Attribution capture — populated by forms/will.html from the URL params and
 * referrer at the time of the questionnaire submission. All fields optional.
 * The form already captures these into sessionStorage on landing and injects
 * them into POST /api/lead under `body.attribution`.
 */
export interface Attribution {
  /** Full URL the customer first landed on (e.g. https://www.clearlegacy.co.uk/?utm_source=google&...). */
  landingUrl?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
  ttclid?: string;
  msclkid?: string;
  /** Browser user agent at first landing (truncated to 200 chars). */
  userAgent?: string;
  /** Captured at first landing (ISO). */
  capturedAt?: string;
}

// ---------- v2 additions for admin + customer portal ----------

/**
 * A single private admin note attached to a lead.
 * No author tracking — for now this is just Sat.
 */
export interface LeadNote {
  text: string;
  createdAt: string;          // ISO
}

/**
 * An entry in the lead's activity timeline. Append-only, oldest first.
 */
export type ActivityType =
  | 'lead_created'
  | 'paid'
  | 'onboarding_email_sent'
  | 'onboarding_email_failed'
  | 'questionnaire_submitted'
  | 'pdf_generating'
  | 'pdf_ready'
  | 'pdf_failed'
  | 'email_sent'
  | 'email_failed'
  | 'regenerate_requested'
  | 'note_added'
  | 'customer_claimed'
  | 'customer_login'
  | 'admin_resent_pdf';

export interface ActivityEvent {
  type: ActivityType;
  at: string;       // ISO
  detail?: string;  // free-text descriptor
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
  paidAt?: string; // ISO
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeAmount?: number; // in minor units (pence)
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
  // awaiting_questionnaire — paid, but the customer has not yet submitted the form
  // pending                — questionnaire submitted, PDF not yet started
  // generating             — PDF render in flight
  // ready                  — PDF stored in R2 and emailed
  // failed                 — last generation attempt failed (see pdfError)
  pdfStatus: 'awaiting_questionnaire' | 'pending' | 'generating' | 'ready' | 'failed';
  pdfKey?: string; // R2 object key
  pdfGeneratedAt?: string;
  pdfError?: string;

  // Email status
  emailedAt?: string;
  emailError?: string;

  /** Set when a generation run flips status to 'generating'; the watchdog
   * uses this to detect runs that have hung past the 25s renderPdf timeout. */
  generatingStartedAt?: string;

  // ---------- v2 additions ----------

  /** Private admin notes (visible in /admin only, never to the customer). */
  notes?: LeadNote[];

  /** Append-only timeline of pipeline events; rendered in admin detail view. */
  activity?: ActivityEvent[];

  /** Set when a customer signs in and claims this lead via /account. */
  customerId?: string;
  claimedAt?: string;

  /** UTM / click-id / referrer data captured by the form at submit time. */
  attribution?: Attribution;
}

/**
 * A registered customer. Created on first successful magic-link login.
 * Keyed by customerId = first 16 hex chars of sha256(email_normalised).
 */
export interface CustomerRecord {
  customerId: string;
  email: string;             // normalised (lowercase, trimmed)
  emailVerifiedAt: string;   // set on first magic-link verify
  fullName?: string;
  phone?: string;
  createdAt: string;
  lastLoginAt?: string;
  marketingOptIn?: boolean;
}

/**
 * Active session — created on magic-link verify, stored under session:{token}.
 * Token is also the value of the `cl_session` HttpOnly cookie.
 */
export interface SessionRecord {
  token: string;
  customerId: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  userAgent?: string;
  ip?: string;
}

/**
 * One-time magic link, stored under magic:{token} with 15-minute TTL.
 * `purpose` lets us reuse the same plumbing for login, email-change-confirm, etc.
 */
export interface MagicLinkRecord {
  token: string;
  email: string;
  purpose: 'login' | 'email_change';
  /** purpose='email_change' uses this to carry the new email being confirmed. */
  payload?: Record<string, string>;
  createdAt: string;
  expiresAt: string;
  consumed?: boolean;
}
