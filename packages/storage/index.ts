import { createUploadthing, type FileRouter } from "uploadthing/next";

import { auth } from "@eboto-mo/auth";
import { db, eq } from "@eboto-mo/db";
import { users } from "@eboto-mo/db/schema";

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
      await db
        .update(users)
        .set({ image: file.url })
        .where(eq(users.id, metadata.user_id));
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof mainFileRouter;

export * from "uploadthing/next";
export * from "@uploadthing/react";
export * from "@uploadthing/react/hooks";
