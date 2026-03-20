export type ChatMessageDTO = {
  id: string;
  role: "user" | "assistant";
  content: string;
  questionId?: number;
};
