import { sendEmail } from "./sendEmail";


export async function replyEmail({
  to,
  subject,
  body,
  accessToken,
  messageId,
  threadId,
}: {
  to: string;
  subject: string;
  body: string;
  accessToken: string;
  messageId: string;
  threadId: string;
}) {
  const result = await sendEmail({
    to,
    subject,
    body,
    accessToken,
    messageId,
    threadId,
  });
  return result;
}
