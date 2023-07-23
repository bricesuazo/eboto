import { db } from "@eboto-mo/db";
import { Election, TokenType, verification_tokens } from "@eboto-mo/db/schema";
import { FileWithPath } from "@mantine/dropzone";

export const isElectionOngoing = ({ election }: { election: Election }) => {
  const end = new Date(election.end_date);
  end.setDate(end.getDate() + 1);

  const now = new Date();
  return (
    election.start_date.getTime() <= now.getTime() &&
    end.getTime() > now.getTime()
  );
};

export const isElectionEnded = ({
  election,
  dateOnly,
}: {
  election: Election;
  dateOnly?: boolean;
}) => {
  const end_date = new Date(election.end_date);
  const now = new Date();

  return dateOnly
    ? end_date.getTime() <=
        new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    : end_date.getTime() <= now.getTime();
};

export const sendEmail = async ({
  type,
  user_id,
  email,
}: {
  type: TokenType;
  user_id: string;
  email: string;
}) => {
  const token = await db.insert(verification_tokens).values({
    id: crypto.randomUUID(),
    user_id,
    type,
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 3), // 3 hours
  });

  // switch (type) {
  //   case 'EMAIL_VERIFICATION':
  //     await sendEmailTransport({
  //       email,
  //       subject: 'Verify your email',
  //       html: render(<VerifyEmail token={token.id} />),
  //     });
  //     break;
  //   case 'PASSWORD_RESET':
  //     await sendEmailTransport({
  //       email,
  //       subject: 'Reset your password',
  //       html: render(<ResetPassword token={token.id} />),
  //     });
  //     break;
  // }
};

export const uploadImage = async ({
  path,
  image,
}: {
  path: string;
  image: FileWithPath;
}): Promise<string> => {
  // await supabase.storage.from("eboto-mo").upload(path, image, {
  //   contentType: "image/png",
  // });

  // const {
  //   data: { publicUrl },
  // } = supabase.storage.from("eboto-mo").getPublicUrl(path);

  return "publicUrl";
};
