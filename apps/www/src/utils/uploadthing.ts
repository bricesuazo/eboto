import { generateReactHelpers } from "@eboto-mo/storage";
import type { OurFileRouter } from "@eboto-mo/storage";

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();
