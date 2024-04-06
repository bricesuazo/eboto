import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  getUser: publicProcedure.query(({ ctx }) => {
    if (!ctx.user) return null;

    let image_url: string | null = null;

    if (ctx.user.db.image_path) {
      const { data: image } = ctx.supabase.storage
        .from("users")
        .getPublicUrl(ctx.user.db.image_path);

      image_url = image.publicUrl;
    }

    return { ...ctx.user, db: { ...ctx.user.db, image_url } };
  }),
  getUserProtected: protectedProcedure.query(({ ctx }) => {
    let image_url: string | null = null;

    if (ctx.user.db.image_path) {
      const { data: image } = ctx.supabase.storage
        .from("users")
        .getPublicUrl(ctx.user.db.image_path);

      image_url = image.publicUrl;
    }

    return { ...ctx.user, db: { ...ctx.user.db, image_url } };
  }),
});
