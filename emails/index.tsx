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
    from: "eboto@bricesuazo.com",
    to: email,
    subject,
    html,
  });
};
