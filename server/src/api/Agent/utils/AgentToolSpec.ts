import { EMAIL_CREATE_DRAFT_INSTRUCTIONS } from "../tools/gmail/EmailCreateDraft";
import { RESOLVE_CONTACT_INSTRUCTIONS } from "../tools/gmail/ResolveContact";
import { EMAIL_SUMMARIZE_INSTRUCTIONS } from "../tools/gmail/EmailSummarize";
import { EMAIL_READ_INSTRUCTIONS } from "../tools/gmail/EmailRead";

export const ALL_TOOLS_DESCRIPTION = `
  ${EMAIL_CREATE_DRAFT_INSTRUCTIONS}\n
  ${RESOLVE_CONTACT_INSTRUCTIONS}\n
  ${EMAIL_SUMMARIZE_INSTRUCTIONS}\n
  ${EMAIL_READ_INSTRUCTIONS}
  `;
