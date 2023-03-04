import { type TokenType } from "@prisma/client";
import { render } from "@react-email/render";
import { sendEmailTransport } from "../../emails";
import ResetPassword from "../../emails/ResetPassword";
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

  switch (type) {
    case "EMAIL_VERIFICATION":
      await sendEmailTransport({
        email,
        subject: "Verify your email",
        html: render(<VerifyEmail token={token.id} />),
      });
      break;
    case "PASSWORD_RESET":
      await sendEmailTransport({
        email,
        subject: "Reset your password",
        html: render(<ResetPassword token={token.id} />),
      });
      break;
  }
};
