import { SES } from "@aws-sdk/client-ses";
import type { SendEmailCommandInput } from "@aws-sdk/client-ses";

const ses = new SES({ region: process.env.AWS_SES_REGION });

export async function sendEmail(args: SendEmailCommandInput) {
  await ses.sendEmail({
    ...args,

    Source: process.env.EMAIL_FROM,
  });
}

// {
//     Source: "you@example.com",
//     Destination: {
//       ToAddresses: ["user@gmail.com"],
//     },
//     Message: {
//       Body: {
//         Html: {
//           Charset: "UTF-8",
//           Data: emailHtml,
//         },
//       },
//       Subject: {
//         Charset: "UTF-8",
//         Data: "hello world",
//       },
//     },
//   }
