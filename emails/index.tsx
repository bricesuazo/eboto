import AWS from "aws-sdk";
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
  AWS.config.update({ region: env.AWS_SES_REGION });

  await new AWS.SES()
    .sendEmail({
      Source: env.EMAIL_FROM,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: html,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: subject,
        },
      },
    })
    .promise();
};
