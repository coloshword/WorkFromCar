import { EMAIL_CREATE_DRAFT_INSTRUCTIONS } from "../tools/gmail/EmailCreateDraft";
import { RESOLVE_CONTACT_INSTRUCTIONS } from "../tools/gmail/ResolveContact";
import { EMAIL_SUMMARIZE_INSTRUCTIONS } from "../tools/gmail/EmailSummarize";
import { EMAIL_READ_INSTRUCTIONS } from "../tools/gmail/EmailRead";
import { EMAIL_REPLY_INSTRUCTIONS } from "../tools/gmail/EmailReply";
import { EMAIL_FORWARD_INSTRUCTIONS } from "../tools/gmail/EmailForward";
import { GCAL_CREATE_EVENT_INSTRUCTIONS } from "../tools/gcal/GcalCreateEvent";
import { GCAL_GET_EVENTS_INSTRUCTIONS } from "../tools/gcal/GcalGetEvents";

export const ALL_TOOLS_DESCRIPTION = `
  ${EMAIL_CREATE_DRAFT_INSTRUCTIONS}\n
  ${RESOLVE_CONTACT_INSTRUCTIONS}\n
  ${EMAIL_SUMMARIZE_INSTRUCTIONS}\n
  ${EMAIL_READ_INSTRUCTIONS}\n
  ${EMAIL_REPLY_INSTRUCTIONS}\n
  ${EMAIL_FORWARD_INSTRUCTIONS}\n
  ${GCAL_CREATE_EVENT_INSTRUCTIONS}\n
  ${GCAL_GET_EVENTS_INSTRUCTIONS}
  `;
