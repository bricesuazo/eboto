import nodemailer from "nodemailer";
import { buildSendMail } from "mailing-core";
import { env } from "../src/env.mjs";

const sendMail = buildSendMail({
  transport: nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    // port: 587,
    port: 465,
    auth: {
      user: "apikey",
      pass: env.SENDGRID_API_KEY,
    },
  }),
  defaultFrom: "Brice from eBoto Mo <eboto@bricesuazo.com>",
  configPath: "./mailing.config.json",
});

export default sendMail;
