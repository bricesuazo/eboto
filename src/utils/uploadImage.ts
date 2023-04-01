import { supabase } from "../lib/supabase";
import { decode } from "base64-arraybuffer";

export const uploadImage = async ({
  path,
  image,
}: {
  path: string;
  image: string;
}): Promise<string> => {
  console.log(
    "🚀 ~ file: uploadImage.ts:25 ~ uploadImage: lololololololololololllolol"
  );

  console.log("🚀 ~ file: uploadImage.ts:11 ~ image:", image);
  const { data } = await supabase.storage
    .from("eboto-mo")
    .upload(path, decode(image), {
      contentType: "image/png",
    });
  console.log("🚀 ~ file: uploadImage.ts:16 ~ data:", data);

  const {
    data: { publicUrl },
  } = supabase.storage.from("eboto-mo").getPublicUrl(path);

  return publicUrl;
};
