/** Matches the mobile app's actual GET /evaluations record shape
 * (confirmed by the user against real API output, 2026-07-16). */
export interface Evaluation {
  id: string;
  jurorCode: string;
  projectCode: string;
  meetsCriteria: boolean;
  /** Null when the record hasn't reached this step yet — the mobile app's
   * eligibility gate short-circuits the rest of the flow on "No". */
  projectType: "individual" | "group" | null;
  /** Present/missing per document type. Real sample data showed `null` for
   * all three on eligible records — semantics not fully confirmed, so
   * derive functions only treat an explicit `false` as "confirmed
   * missing," never `null`. */
  documentIdentity: boolean | null;
  documentBulletin3: boolean | null;
  documentMotivationLetter: boolean | null;
  pertinence: number | null;
  approcheInnovante: number | null;
  transferabilite: number | null;
  rigueur: number | null;
  faisabilite: number | null;
  /** Free-text juror notes — never rendered on the public display (see
   * project-overview.md / progress-tracker.md decision, 2026-07-16). */
  recommendation: string | null;
  createdAt: string;
  updatedAt: string;
}
