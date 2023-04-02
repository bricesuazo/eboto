import { supabase } from "../lib/supabase";
// import { decode } from "base64-arraybuffer";
import { type FileWithPath } from "@mantine/dropzone";

export const uploadImage = async ({
  path,
  image,
}: {
  path: string;
  image: FileWithPath;
  // image: string;
}): Promise<string> => {
  const { data } = await supabase.storage.from("eboto-mo").upload(path, image, {
    contentType: "image/png",
  });

  const {
    data: { publicUrl },
  } = supabase.storage.from("eboto-mo").getPublicUrl(path);

  return publicUrl;
};
