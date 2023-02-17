import nodemailer from "nodemailer";
import { env } from "../src/env.mjs";

const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  // port: 587,
  port: 465,
  auth: {
    user: "apikey",
    pass: env.SENDGRID_API_KEY,
  },
});

export const sendEmail = async ({
  email,
  subject,
  html,
}: {
  email: string;
  subject: string;
  html: string;
}) => {
  await transporter.sendMail({
    from: "eboto@bricesuazo.com",
    to: email,
    subject,
    html,
  });
};
