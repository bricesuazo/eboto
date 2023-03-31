import type { FileWithPath } from "@mantine/dropzone";

export const uploadImage = async (file: FileWithPath): Promise<string> => {
  console.log("🚀 ~ file: uploadImage.ts:4 ~ uploadImage ~ file:", file);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return "";
};
