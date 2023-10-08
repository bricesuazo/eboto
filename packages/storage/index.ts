import { env } from "env.mjs";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UTApi } from "uploadthing/server";
import { z } from "zod";

import { auth } from "@eboto-mo/auth";
import { db, eq } from "@eboto-mo/db";
import { elections, users } from "@eboto-mo/db/schema";

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
  electionLogoUploader: f({ image: { maxFileSize: "4MB" } })
    .input(z.object({ election_id: z.string() }))
    .middleware(async ({ input }) => {
      const session = await auth();

      if (!session) throw new Error("Unauthorized");

      const isCommissioner = await db.query.commissioners.findFirst({
        where: (commissioner, { and, eq }) =>
          and(
            eq(commissioner.election_id, input.election_id),
            eq(commissioner.user_id, session.user.id),
          ),
      });

      if (!isCommissioner) throw new Error("Unauthorized");

      const election = await db.query.elections.findFirst({
        where: eq(elections.id, input.election_id),
      });

      if (!election) throw new Error("Election not found");

      if (election.logo && !!election.logo.length)
        await utapi.deleteFiles(
          election.logo.split("https://utfs.io/f/")[1] ?? "",
        );

      return input;
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("🚀 ~ file: index.ts:65 ~ .onUploadComplete ~ file:", file);
      await db
        .update(elections)
        .set({ logo: file.url })
        .where(eq(elections.id, metadata.election_id));
    }),
} satisfies FileRouter;

export type MainFileRouter = typeof mainFileRouter;

export * from "uploadthing/next";

export const utapi = new UTApi({
  apiKey: env.UPLOADTHING_SECRET,
});
