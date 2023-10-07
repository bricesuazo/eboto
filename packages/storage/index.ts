import { createUploadthing, type FileRouter } from "uploadthing/next";

import { auth } from "@eboto-mo/auth";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const mainFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  profilePictureUploader: f({ image: { maxFileSize: "4MB" } })
    // Set permissions and file types for this FileRoute
    .middleware(async () => {
      // This code runs on your server before upload
      const session = await auth();

      // If you throw, the user will not be able to upload
      if (!session) throw new Error("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { user_id: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.user_id);

      console.log("file url", file.url);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof mainFileRouter;

export * from "uploadthing/next";
export * from "@uploadthing/react";
