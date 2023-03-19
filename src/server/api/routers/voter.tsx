import { sendEmailTransport } from "../../../../emails/index";
import { protectedProcedure } from "../trpc";
import { z } from "zod";

import { createTRPCRouter } from "../trpc";
import ElectionInvitation from "../../../../emails/ElectionInvitation";
import { render } from "@react-email/render";
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

      // TODO: Check if email is the email of this session user. Then just connect the voter to the user
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

      // const token = await ctx.prisma.verificationToken.create({
      //   data: {
      //     expiresAt: election.end_date,
      //     type: "ELECTION_INVITATION",
      //     invitedVoter: {
      //       connect: {
      //         id: invitedVoter.id,
      //       },
      //     },
      //   },
      // });

      // await sendEmailTransport({
      //   email: input.email,
      //   subject: `You have been invited to vote in ${election.name}`,
      //   html: render(
      //     <ElectionInvitation
      //       type="VOTER"
      //       token={token.id}
      //       electionName={election.name}
      //       electionEndDate={election.end_date}
      //     />
      //   ),
      // });
      return { invitedVoter, email: input.email };
    }),
});
