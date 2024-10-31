import { SES } from "@aws-sdk/client-ses";

// if (!process.env.AWS_SES_REGION)
//   throw new Error("AWS_SES_REGION is not defined");
// if (!process.env.AWS_ACCESS_KEY_ID)
//   throw new Error("AWS_ACCESS_KEY_ID is not defined");
// if (!process.env.AWS_SECRET_ACCESS_KEY)
//   throw new Error("AWS_SECRET_ACCESS_KEY is not defined");

export const ses = new SES({
  region: process.env.AWS_SES_REGION,

  // credentials: {
  //   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  // },
});

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
