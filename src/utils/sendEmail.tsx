import { type TokenType } from "@prisma/client";
import { render } from "@react-email/render";
import { sendEmailTransport } from "../../emails";
import VerifyEmail from "../../emails/VerifyEmail";
import { prisma } from "../server/db";

export const sendEmail = async ({
  type,
  userId,
  email,
}: {
  type: TokenType;
  userId: string;
  email: string;
}) => {
  const token = await prisma.verificationToken.create({
    data: {
      userId,
      type,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 3), // 3 hours
    },
  });

  await sendEmailTransport({
    email,
    subject: "Verify your email",
    html: render(<VerifyEmail type={type} token={token.id} />),
  });
};
