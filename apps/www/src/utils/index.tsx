// import { db } from "@eboto-mo/db";
// import { verification_tokens } from "@eboto-mo/db/schema";
import type { FileWithPath } from "@mantine/dropzone";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import type { TokenType } from "@eboto-mo/db/schema";

// import { nanoid } from "nanoid";

export const sendEmail = ({
  // type,
  // user_id,
  email,
}: {
  type: TokenType;
  user_id: string;
  email: string;
}) => {
  console.log("🚀 ~ file: index.tsx:42 ~ email:", email);
  // const token = await db.insert(verification_tokens).values({
  //   user_id,
  //   type,
  //   expires_at: new Date(Date.now() + 1000 * 60 * 60 * 3), // 3 hours
  // });
  // console.log("🚀 ~ file: index.tsx:48 ~ token ~ token:", token);

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
  const supabase = createClientComponentClient();

  await supabase.storage.from("eboto-mo").upload(path, image, {
    contentType: "image/png",
  });

  const {
    data: { publicUrl },
  } = supabase.storage.from("eboto-mo").getPublicUrl(path);

  return publicUrl;
};
