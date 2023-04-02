import { supabase } from "../lib/supabase";
import { type FileWithPath } from "@mantine/dropzone";

export const uploadImage = async ({
  path,
  image,
}: {
  path: string;
  image: FileWithPath;
}): Promise<string> => {
  await supabase.storage.from("eboto-mo").upload(path, image, {
    contentType: "image/png",
  });

  const {
    data: { publicUrl },
  } = supabase.storage.from("eboto-mo").getPublicUrl(path);

  return publicUrl;
};
