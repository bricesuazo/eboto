import { protectedProcedure } from "../trpc";
import { z } from "zod";
import { createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";

export const voterRouter = createTRPCRouter({
  removeSingle: protectedProcedure
    .input(
      z.object({
        electionId: z.string(),
        voterId: z.string(),
        isInvitedVoter: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const election = await ctx.prisma.election.findFirst({
        where: {
          id: input.electionId,
          commissioners: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
      });

      if (!election) {
        throw new Error("Election not found");
      }

      await ctx.prisma.verificationToken.deleteMany({
        where: {
          invitedVoterId: input.voterId,
          userId: input.voterId,
          type: "ELECTION_INVITATION",
        },
      });

      if (input.isInvitedVoter) {
        await ctx.prisma.invitedVoter.delete({
          where: {
            id: input.voterId,
          },
        });
      } else {
        await ctx.prisma.voter.delete({
          where: {
            id: input.voterId,
          },
        });
      }

      return true;
    }),
  createSingle: protectedProcedure
    .input(
      z.object({
        electionId: z.string(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const election = await ctx.prisma.election.findUnique({
        where: {
          id: input.electionId,
        },
        include: {
          commissioners: true,
        },
      });

      if (!election) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election not found",
        });
      }

      if (
        !election.commissioners.some(
          (commissioner) => commissioner.userId === ctx.session.user.id
        )
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not a commissioner of this election",
        });
      }

      const isVoterExistsInElection = await ctx.prisma.voter.findFirst({
        where: {
          user: {
            email: input.email,
          },
          electionId: input.electionId,
        },
      });

      if (isVoterExistsInElection) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email is already a voter of this election",
        });
      }

      const isVoterExistsInInvitedVoters =
        await ctx.prisma.invitedVoter.findFirst({
          where: {
            email: input.email,
            electionId: input.electionId,
          },
        });

      if (isVoterExistsInInvitedVoters) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email is already a voter of this election",
        });
      }

      if (ctx.session.user.email === input.email) {
        return {
          voter: await ctx.prisma.voter.create({
            data: {
              userId: ctx.session.user.id,
              electionId: input.electionId,
            },
          }),
          email: input.email,
        };
      }

      const invitedVoter = await ctx.prisma.invitedVoter.create({
        data: {
          email: input.email,
          electionId: input.electionId,
        },
      });

      return { invitedVoter, email: input.email };
    }),

  createMany: protectedProcedure

    .input(
      z.object({
        electionId: z.string(),
        emails: z.array(z.string().email()),
      })
    )

    .mutation(async ({ input, ctx }) => {
      const election = await ctx.prisma.election.findUnique({
        where: {
          id: input.electionId,
        },
        include: {
          commissioners: true,
        },
      });

      if (!election) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election not found",
        });
      }

      if (
        !election.commissioners.some(
          (commissioner) => commissioner.userId === ctx.session.user.id
        )
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not a commissioner of this election",
        });
      }

      const voters = await ctx.prisma.voter.findMany({
        where: {
          electionId: input.electionId,
        },
        include: {
          user: true,
        },
      });

      const invitedVoters = await ctx.prisma.invitedVoter.findMany({
        where: {
          electionId: input.electionId,
        },
      });

      const votersEmails = voters.map((voter) => voter.user.email);

      const invitedVotersEmails = invitedVoters.map(
        (invitedVoter) => invitedVoter.email
      );

      const emails = input.emails.filter(
        (email) =>
          !votersEmails.includes(email) && !invitedVotersEmails.includes(email)
      );

      const uniqueEmails = [...new Set(emails)];

      return await ctx.prisma.invitedVoter.createMany({
        data: uniqueEmails.map((email) => ({
          email,
          electionId: input.electionId,
        })),
      });
    }),
});
