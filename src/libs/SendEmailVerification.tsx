import { render } from "@react-email/render";
import { sendEmail } from "../../emails";
import VerifyEmail from "../../emails/VerifyEmail";
import { prisma } from "../server/db";

const SendEmailVerification = async ({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) => {
  const token = await prisma.token.create({
    data: {
      temporaryUserId: userId,
      type: "EMAIL_VERIFICATION",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 3), // 3 hours
    },
  });

  await sendEmail({
    email,
    subject: "Verify your email",
    html: render(<VerifyEmail token={token.id} />),
  });
};

export default SendEmailVerification;
