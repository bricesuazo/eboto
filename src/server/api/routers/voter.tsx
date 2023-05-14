import { publicProcedure, protectedProcedure } from "../trpc";
import { z } from "zod";
import { createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { sendEmailTransport } from "../../../../emails";
import ElectionInvitation from "../../../../emails/ElectionInvitation";
import { render } from "@react-email/render";
import type { InvitedVoter, User, Voter } from "@prisma/client";

export const voterRouter = createTRPCRouter({
  editSingle: protectedProcedure
    .input(
      z.object({
        voterId: z.string(),
        electionId: z.string(),
        voterEmail: z.string().email(),
        field: z.record(z.string()),
        accountStatus: z.enum(["ACCEPTED", "INVITED", "DECLINED", "ADDED"]),
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

      if (!election)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election not found",
        });

      if (!election.commissioners.some((c) => c.userId === ctx.session.user.id))
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to edit this election",
        });

      if (input.accountStatus === "ACCEPTED") {
        const voter = await ctx.prisma.voter.findFirst({
          where: {
            id: input.voterId,
            electionId: election.id,
          },
        });
        if (!voter)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Voter not found",
          });
        return {
          type: "voter",
          voter: await ctx.prisma.voter.update({
            where: {
              id: input.voterId,
            },
            data: {
              field: input.field,
            },
            include: {
              user: true,
            },
          }),
        } as {
          type: "voter";
          voter: Voter & {
            user: User;
          };
        };
      } else {
        const voter = await ctx.prisma.invitedVoter.findFirst({
          where: {
            id: input.voterId,
            electionId: election.id,
          },
        });
        if (!voter)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Voter not found",
          });
        return {
          type: "invitedVoter",
          invitedVoter: await ctx.prisma.invitedVoter.update({
            where: {
              id: input.voterId,
            },
            data: {
              email: input.voterEmail,
              field: input.field,
            },
          }),
        } as {
          type: "invitedVoter";
          invitedVoter: InvitedVoter;
        };
      }
    }),

  getFieldsStats: publicProcedure
    .input(
      z.object({
        electionSlug: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const election = await ctx.prisma.election.findFirst({
        where: {
          slug: input.electionSlug,
        },
        include: {
          voterField: true,
        },
      });

      if (!election)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election not found",
        });

      const voters = await ctx.prisma.voter.findMany({
        where: {
          electionId: election.id,
        },
      });

      const invitedVoters = await ctx.prisma.invitedVoter.findMany({
        where: {
          electionId: election.id,
        },
      });

      const votes = await ctx.prisma.vote.findMany({
        where: {
          electionId: election.id,
        },
      });

      const votersThatVoted = voters.filter((voter) =>
        votes.some((vote) => vote.voterId === voter.userId)
      );

      return election.voterField.map((field) => {
        const fieldValuesAccepted = voters.map((voter) => {
          if (typeof voter.field !== "object" || Array.isArray(voter.field))
            return "";
          const voterFields = voter.field ?? {};
          return voterFields[field.name] as string;
        });
        const fieldValuesInvited = invitedVoters.map((voter) => {
          if (typeof voter.field !== "object" || Array.isArray(voter.field))
            return "";
          const voterFields = voter.field ?? {};
          return voterFields[field.name] as string;
        });

        const uniqueFieldValues = [
          ...new Set(fieldValuesAccepted.concat(fieldValuesInvited)),
        ];

        const fieldStats = uniqueFieldValues.map((value) => {
          return {
            fieldValue: value,
            voteCount: votersThatVoted.filter((voter) => {
              if (typeof voter.field !== "object" || Array.isArray(voter.field))
                return false;
              const voterFields = voter.field ?? {};
              return voterFields[field.name] === value;
            }).length,
            allCountAccepted: fieldValuesAccepted.filter((v) => v === value)
              .length,
            allCountInvited: fieldValuesInvited.filter((v) => v === value)
              .length,
          };
        });

        return {
          fieldName: field.name,
          fields: fieldStats.sort((a, b) =>
            a.fieldValue.localeCompare(b.fieldValue)
          ),
        };
      });
    }),
  getFields: protectedProcedure
    .input(
      z.object({
        electionId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const election = await ctx.prisma.election.findFirst({
        where: {
          id: input.electionId,
          commissioners: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
        include: {
          voterField: true,
        },
      });

      if (!election)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election not found",
        });

      const voters = await ctx.prisma.voter.findMany({
        where: {
          electionId: election.id,
        },
      });

      const invitedVoters = await ctx.prisma.invitedVoter.findMany({
        where: {
          electionId: election.id,
        },
      });

      return election.voterField.map((field) => {
        const fieldValuesAccepted = voters.map((voter) => {
          if (typeof voter.field !== "object" || Array.isArray(voter.field))
            return "";
          const voterFields = voter.field ?? {};
          return voterFields[field.name] as string;
        });
        const fieldValuesInvited = invitedVoters.map((voter) => {
          if (typeof voter.field !== "object" || Array.isArray(voter.field))
            return "";
          const voterFields = voter.field ?? {};
          return voterFields[field.name] as string;
        });

        const uniqueFieldValues = [
          ...new Set(fieldValuesAccepted.concat(fieldValuesInvited)),
        ];

        const fieldStats = uniqueFieldValues.map((value) => {
          return {
            fieldValue: value,
          };
        });

        return {
          fieldName: field.name,
          fields: fieldStats.sort((a, b) =>
            a.fieldValue.localeCompare(b.fieldValue)
          ),
        };
      });
    }),

  sendSingleInvitation: protectedProcedure
    .input(
      z.object({
        voterId: z.string(),
        electionId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const voter = await ctx.prisma.invitedVoter.findFirst({
        where: {
          id: input.voterId,
          electionId: input.electionId,
          status: {
            in: ["ADDED", "INVITED"],
          },
        },
      });

      if (!voter) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Voter not found",
        });
      }

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

      await ctx.prisma.verificationToken.deleteMany({
        where: {
          invitedVoterId: voter.id,
        },
      });

      const token = await ctx.prisma.verificationToken.create({
        data: {
          expiresAt: election.end_date,
          type: "ELECTION_INVITATION",
          invitedVoter: {
            connect: {
              id: voter.id,
            },
          },
        },
      });

      await sendEmailTransport({
        email: voter.email,
        subject: `You have been invited to vote in ${election.name}`,
        html: render(
          <ElectionInvitation
            type="VOTER"
            token={token.id}
            electionName={election.name}
            electionEndDate={election.end_date}
          />
        ),
      });

      await ctx.prisma.invitedVoter.update({
        where: {
          id: voter.id,
        },
        data: {
          status: "INVITED",
        },
      });
    }),
  sendManyInvitations: protectedProcedure
    .input(
      z.object({
        electionId: z.string(),
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

      const invitedVoters = await ctx.prisma.invitedVoter.findMany({
        where: {
          electionId: input.electionId,
          status: "ADDED",
        },
      });

      // send email to all invited voters
      for (const voter of invitedVoters) {
        await ctx.prisma.verificationToken.deleteMany({
          where: {
            invitedVoterId: voter.id,
          },
        });

        const token = await ctx.prisma.verificationToken.create({
          data: {
            expiresAt: election.end_date,
            type: "ELECTION_INVITATION",
            invitedVoter: {
              connect: {
                id: voter.id,
              },
            },
          },
        });

        await sendEmailTransport({
          email: voter.email,
          subject: `You have been invited to vote in ${election.name}`,
          html: render(
            <ElectionInvitation
              type="VOTER"
              token={token.id}
              electionName={election.name}
              electionEndDate={election.end_date}
            />
          ),
        });

        await ctx.prisma.invitedVoter.update({
          where: {
            id: voter.id,
          },
          data: {
            status: "INVITED",
          },
        });
      }
      return invitedVoters;
    }),
  removeBulk: protectedProcedure
    .input(
      z.object({
        electionId: z.string(),
        voterIds: z.array(z.string()),
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
          invitedVoterId: {
            in: input.voterIds,
          },
          userId: {
            in: input.voterIds,
          },
          type: "ELECTION_INVITATION",
        },
      });

      const invitedVoters = await ctx.prisma.invitedVoter.deleteMany({
        where: {
          electionId: input.electionId,
          id: {
            in: input.voterIds,
          },
        },
      });

      const voters = await ctx.prisma.voter.deleteMany({
        where: {
          electionId: input.electionId,
          id: {
            in: input.voterIds,
          },
        },
      });

      return invitedVoters.count + voters.count;
    }),

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
        fields: z.array(
          z.object({
            name: z.string(),
            value: z.string(),
          })
        ),
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

      const field: { [key: string]: string } = input.fields.reduce(
        (result: { [key: string]: string }, item) => {
          result[item.name] = item.value;
          return result;
        },
        {}
      );

      if (ctx.session.user.email === input.email) {
        return {
          voter: await ctx.prisma.voter.create({
            data: {
              userId: ctx.session.user.id,
              electionId: input.electionId,
              field,
            },
          }),
          email: input.email,
        };
      }

      const invitedVoter = await ctx.prisma.invitedVoter.create({
        data: {
          email: input.email,
          electionId: input.electionId,
          field,
        },
      });

      return { invitedVoter, email: input.email };
    }),

  createMany: protectedProcedure
    .input(
      z.object({
        electionId: z.string(),
        voters: z.array(
          z.object({
            email: z.string().email({ message: "Email is invalid" }),
            field: z.record(z.string(), z.string()),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (
        input.voters.some((voter) =>
          Object.values(voter.field).some(
            (value) =>
              value === "" || !value || !value.trim() || value.length === 0
          )
        )
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Field value cannot be empty",
        });

      let counter = 0;
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

      if (
        input.voters.some((voter) => voter.email === ctx.session.user.email)
      ) {
        await ctx.prisma.voter
          .create({
            data: {
              userId: ctx.session.user.id,
              electionId: input.electionId,
              field: input.voters.find(
                (voter) => voter.email === ctx.session.user.email
              )?.field,
            },
          })
          .then(() => {
            counter += 1;
          });
      }

      const votersInput = input.voters.filter(
        (voter) =>
          ctx.session.user.email !== voter.email &&
          !votersEmails.includes(voter.email) &&
          !invitedVotersEmails.includes(voter.email)
      );

      const invited = await ctx.prisma.invitedVoter.createMany({
        data: votersInput.map((voter) => ({
          email: voter.email,
          field: voter.field,
          electionId: input.electionId,
        })),
      });

      return invited.count + counter;
    }),
});
