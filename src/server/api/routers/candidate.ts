import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const candidateRouter = createTRPCRouter({
  uploadImage: protectedProcedure
    .input(z.object({ candidateId: z.string(), file: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const candidate = await ctx.prisma.candidate.findUniqueOrThrow({
        where: {
          id: input.candidateId,
        },
        select: {
          election: {
            select: {
              id: true,
              commissioners: true,
            },
          },
        },
      });

      if (
        !candidate.election.commissioners.some(
          (commissioner) => commissioner.userId === ctx.session.user.id
        )
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });

      return ctx.prisma.candidate.update({
        where: {
          id: input.candidateId,
        },
        data: {
          image: input.file,
        },
      });
    }),
  editSingle: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        firstName: z.string(),
        middleName: z.string().nullable(),
        lastName: z.string(),
        slug: z.string(),
        electionId: z.string(),
        partylistId: z.string(),
        positionId: z.string(),
        image: z.string().nullable(),

        achievements: z.array(
          z.object({
            id: z.string(),
            name: z.string().min(1),
            year: z.date(),
          })
        ),
        affiliations: z.array(
          z.object({
            id: z.string(),
            org_name: z.string().min(1),
            org_postion: z.string().min(1),
            start_year: z.date(),
            end_year: z.date(),
          })
        ),
        eventsAttended: z.array(
          z.object({
            id: z.string(),
            name: z.string().min(1),
            year: z.date(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const position = await ctx.prisma.position.findUniqueOrThrow({
        where: {
          id: input.positionId,
        },
        select: {
          election: {
            select: {
              id: true,
              commissioners: true,
            },
          },
        },
      });

      if (
        !position.election.commissioners.some(
          (commissioner) => commissioner.userId === ctx.session.user.id
        )
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });

      const candidate = await ctx.prisma.candidate.findFirst({
        where: {
          slug: input.slug,
          electionId: position.election.id,
          NOT: {
            id: input.id,
          },
        },
      });

      if (candidate)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Candidate's slug already exists",
        });

      return ctx.prisma.candidate.update({
        where: {
          id: input.id,
        },
        include: {
          credential: {
            include: {
              achievements: true,
              affiliations: true,
              eventsAttended: true,
            },
          },
        },
        data: {
          first_name: input.firstName,
          middle_name: input.middleName,
          last_name: input.lastName,
          slug: input.slug.trim().toLowerCase(),
          electionId: position.election.id,
          partylistId: input.partylistId,
          positionId: input.positionId,
          image: input.image,

          credential: {
            update: {
              achievements: {
                upsert: input.achievements.map((achievement) => ({
                  where: {
                    id: achievement.id,
                  },
                  create: {
                    name: achievement.name,
                    year: achievement.year,
                  },
                  update: {
                    name: achievement.name,
                    year: achievement.year,
                  },
                })),
              },
              affiliations: {
                upsert: input.affiliations.map((affiliation) => ({
                  where: {
                    id: affiliation.id,
                  },
                  create: {
                    org_name: affiliation.org_name,
                    org_postion: affiliation.org_postion,
                    start_year: affiliation.start_year,
                    end_year: affiliation.end_year,
                  },
                  update: {
                    org_name: affiliation.org_name,
                    org_postion: affiliation.org_postion,
                    start_year: affiliation.start_year,
                    end_year: affiliation.end_year,
                  },
                })),
              },
              eventsAttended: {
                upsert: input.eventsAttended.map((eventAttended) => ({
                  where: {
                    id: eventAttended.id,
                  },
                  create: {
                    name: eventAttended.name,
                    year: eventAttended.year,
                  },
                  update: {
                    name: eventAttended.name,
                    year: eventAttended.year,
                  },
                })),
              },
            },
          },
        },
      });
    }),
  deleteSingle: protectedProcedure
    .input(z.string().min(1))
    .mutation(async ({ input, ctx }) => {
      const candidate = await ctx.prisma.candidate.findUniqueOrThrow({
        where: {
          id: input,
        },
        select: {
          election: {
            select: {
              id: true,
              commissioners: true,
            },
          },
        },
      });

      if (
        !candidate.election.commissioners.some(
          (commissioner) => commissioner.userId === ctx.session.user.id
        )
      )
        throw new Error("Unauthorized");

      return ctx.prisma.candidate.delete({
        where: {
          id: input,
        },
      });
    }),

  createSingle: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        slug: z.string().min(1),
        position: z.object({
          id: z.string().min(1),
          electionId: z.string().min(1),
        }),
        partylistId: z.string().min(1),

        middleName: z.string().nullable(),
        message: z.string().min(1).optional(),
        image: z.string().min(1).optional(),

        achievements: z.array(
          z.object({
            name: z.string().min(1),
            year: z.date(),
          })
        ),
        affiliations: z.array(
          z.object({
            org_name: z.string().min(1),
            org_postion: z.string().min(1),
            start_year: z.date(),
            end_year: z.date(),
          })
        ),
        eventsAttended: z.array(
          z.object({
            name: z.string().min(1),
            year: z.date(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const election = await ctx.prisma.election.findUniqueOrThrow({
        where: {
          id: input.position.electionId,
        },
        select: {
          id: true,
          commissioners: true,
        },
      });

      if (
        !election.commissioners.some(
          (commissioner) => commissioner.userId === ctx.session.user.id
        )
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });

      const candidate = await ctx.prisma.candidate.findFirst({
        where: {
          slug: input.slug,
          electionId: election.id,
        },
      });

      if (candidate)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Candidate's slug already exists",
        });

      return ctx.prisma.candidate.create({
        data: {
          first_name: input.firstName,
          last_name: input.lastName,
          slug: input.slug.trim().toLowerCase(),
          electionId: election.id,
          partylistId: input.partylistId,
          positionId: input.position.id,

          middle_name: input.middleName,

          image: input.image,

          credential: {
            create: {
              affiliations: {
                createMany: {
                  data: input.affiliations,
                },
              },
              eventsAttended: {
                createMany: {
                  data: input.eventsAttended,
                },
              },
              achievements: {
                createMany: {
                  data: input.achievements,
                },
              },
            },
          },
        },
      });
    }),
  getAll: protectedProcedure
    .input(z.string().min(1))
    .query(async ({ input, ctx }) => {
      const election = await ctx.prisma.election.findUniqueOrThrow({
        where: {
          slug: input,
        },
        select: {
          id: true,
          slug: true,
          commissioners: true,
          name: true,
        },
      });

      if (
        !election.commissioners.some(
          (commissioner) => commissioner.userId === ctx.session.user.id
        )
      )
        throw new Error("Unauthorized");

      const positions = await ctx.prisma.position.findMany({
        where: {
          electionId: election.id,
        },
        orderBy: {
          order: "asc",
        },
      });
      const candidates = await ctx.prisma.candidate.findMany({
        where: {
          electionId: election.id,
        },
        include: {
          credential: {
            include: {
              affiliations: true,
              eventsAttended: true,
              achievements: true,
            },
          },
        },
        orderBy: {
          position: {
            order: "asc",
          },
        },
      });
      const partylists = await ctx.prisma.partylist.findMany({
        where: {
          electionId: election.id,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return { candidates, election, positions, partylists };
    }),
});
