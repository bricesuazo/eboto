import sgMail from "@sendgrid/mail";
import { env } from "../env.mjs";

const SendGrid = ({ to }: { to: string }) => {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
  const msg = {
    to,
    from: "eboto@bricesuazo.com", // Change to your verified sender
    subject: "Sending with SendGrid is Fun",
    text: "and easy to do anywhere, even with Node.js",
    html: "<strong>and easy to do anywhere, even with Node.js</strong>",
  };

  return sgMail.send(msg);
};

export default SendGrid;
