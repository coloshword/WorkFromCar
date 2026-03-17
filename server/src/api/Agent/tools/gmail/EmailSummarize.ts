import * as z from "zod";

export type emailSummarizeParameters = {
  query: string | null,
  maxResults: number | null,
};

export const emailSummarizeParametersSchema = z.object({
  query: z.string().nullable(),
  maxResults: z.number().nullable(),
}) satisfies z.ZodType<emailSummarizeParameters>;

export const EMAIL_SUMMARIZE_INSTRUCTIONS = `
  1. "gmail.summarizeEmails"
  Use this tool when the user asks to check, read, or summarize their emails.
  When you decide to use this tool, output JSON with:
  - tool: "gmail.summarizeEmails"
  - toolParameters:
    - query: string | null — a Gmail search query. Use Gmail search operators: from:, subject:, is:unread, is:read, newer_than:1d, newer_than:7d, after:2026/03/01, category:primary, has:attachment. Combine with spaces (AND). Leave null to default to "is:unread".
    - maxResults: number | null — how many emails to fetch. Defaults to 10 if null. Max 25.

  The tool returns an array of emails, each with: from, subject, snippet, date.

  After receiving results:
  - Summarize each email in one to two sentences max: who it's from and what it's about.
  - Keep it concise and conversational — the user is listening, not reading.
  - If no emails are returned, tell the user their inbox is clear or that nothing matched their request.
  - If the user asks for a large number, keep maxResults at 10 and suggest they narrow down with a more specific time frame or sender instead.
`;
