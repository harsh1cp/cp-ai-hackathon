export type SalesStage =
  | "Discovery"
  | "Qualification"
  | "Proposal"
  | "Objection"
  | "Upsell"
  | "Close";

export type SalesQuestion = {
  id: number;
  stage: SalesStage;
  text: string;
};

/** Hardcoded sales library — exact copy per hackathon spec */
export const SALES_QUESTIONS: readonly SalesQuestion[] = [
  {
    id: 1,
    stage: "Discovery",
    text: "Are you remodeling the entire kitchen or just replacing cabinets?",
  },
  {
    id: 2,
    stage: "Discovery",
    text: "Is this kitchen for your primary home or a rental property? ",
  },
  {
    id: 3,
    stage: "Discovery",
    text: "What is the approximate size or layout of your kitchen?",
  },
  {
    id: 4,
    stage: "Discovery",
    text: "Are you planning to keep the same layout or redesign the kitchen?",
  },
  {
    id: 5,
    stage: "Qualification",
    text: "Do you have a preferred cabinet style? (Shaker, flat panel, traditional)",
  },
  {
    id: 6,
    stage: "Qualification",
    text: "Do you have a preferred cabinet color or finish?",
  },
  {
    id: 7,
    stage: "Qualification",
    text: "What budget range are you targeting for your kitchen cabinets?",
  },
  {
    id: 8,
    stage: "Qualification",
    text: "Would you like to schedule a design consultation or review designs?",
  },
  {
    id: 9,
    stage: "Proposal",
    text: "What are your thoughts about the design proposal we shared?",
  },
  {
    id: 10,
    stage: "Proposal",
    text: "Are you comparing quotes from other companies?",
  },
  {
    id: 11,
    stage: "Proposal",
    text: "What materials are the other companies offering?",
  },
  {
    id: 12,
    stage: "Proposal",
    text: "Would you like help reviewing the competitor quote?",
  },
  {
    id: 13,
    stage: "Objection",
    text: "Are there any concerns about pricing or materials?",
  },
  {
    id: 14,
    stage: "Upsell",
    text: "Are you interested in additional features like soft-close drawers or organizers?",
  },
  {
    id: 15,
    stage: "Close",
    text: "Do you have any concerns about delivery timelines or installation?",
  },
] as const;

export function getQuestionById(id: number): SalesQuestion | undefined {
  return SALES_QUESTIONS.find((q) => q.id === id);
}
