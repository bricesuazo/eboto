import { generateReactHelpers } from "@uploadthing/react/hooks";

import type { MainFileRouter } from "@eboto-mo/storage";

export const { uploadFiles } = generateReactHelpers<MainFileRouter>();
