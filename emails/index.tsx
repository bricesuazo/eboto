import sendgrid from "@sendgrid/mail";
import { env } from "../src/env.mjs";

export const sendEmailTransport = async ({
  email,
  subject,
  html,
}: {
  email: string;
  subject: string;
  html: string;
}) => {
  sendgrid.setApiKey(env.SENDGRID_API_KEY);

  await sendgrid.send({
    from: env.EMAIL_FROM,
    to: email,
    subject,
    html,
  });
};
