import type { NextApiRequest, NextApiResponse } from "next";
import { verifySignature } from "@upstash/qstash/nextjs";

import { db } from "@eboto-mo/db";
import type { GeneratedElectionResult } from "@eboto-mo/db/schema";
import { elections, generated_election_results } from "@eboto-mo/db/schema";
import { sendElectionResult } from "@eboto-mo/email/emails/election-result";
import { sendElectionStart } from "@eboto-mo/email/emails/election-start";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await db.transaction(async (trx) => {
    const start_date = new Date();
    console.log("🚀 ~ file: cron.tsx:13 ~ handler ~ start_date:", start_date);
    start_date.setSeconds(0);
    start_date.setMilliseconds(0);
    console.log("🚀 ~ file: cron.tsx:15 ~ handler ~ start_date:", start_date);

    const electionsStart = await trx.query.elections.findMany({
      where: (election, { eq, and, isNull }) =>
        and(eq(election.start_date, start_date), isNull(election.deleted_at)),
      with: {
        commissioners: {
          with: {
            user: true,
          },
        },
        voters: true,
      },
    });

    for (const election of electionsStart) {
      await sendElectionStart({
        isForCommissioner: false,
        election: {
          name: election.name,
          slug: election.slug,
          start_date: election.start_date,
          end_date: election.end_date,
        },
        emails: election.voters.map((voter) => voter.email),
      });
      await sendElectionStart({
        isForCommissioner: true,
        election: {
          name: election.name,
          slug: election.slug,
          start_date: election.start_date,
          end_date: election.end_date,
        },
        emails: election.commissioners.map(
          (commissioner) => commissioner.user.email,
        ),
      });

      if (election.publicity === "PRIVATE") {
        await trx.update(elections).set({
          publicity: "VOTER",
        });
      }
      console.log("Email start sent to", election.name);
    }

    const end_date = new Date(start_date);
    console.log("🚀 ~ file: cron.tsx:49 ~ handler ~ end_date:", end_date);

    const electionsEnd = await db.query.elections.findMany({
      where: (election, { eq, and, isNull }) =>
        and(eq(election.end_date, end_date), isNull(election.deleted_at)),
      with: {
        voters: true,
        positions: {
          with: {
            candidates: {
              with: {
                votes: true,
                partylist: true,
              },
            },
            votes: true,
          },
        },
      },
    });

    for (const election of electionsEnd) {
      console.log(
        "🚀 ~ file: cron.tsx:91 ~ awaitdb.transaction ~ election:",
        election,
      );
      const result = {
        ...election,
        positions: election.positions.map((position) => ({
          ...position,
          abstain_count: position.votes.length,
          candidates: position.candidates.map((candidate) => ({
            ...candidate,
            vote_count: candidate.votes.length,
          })),
        })),
      } satisfies Pick<GeneratedElectionResult, "election">["election"];

      await db.insert(generated_election_results).values({
        election_id: election.id,
        election: result,
      });

      await sendElectionResult({
        emails: election.voters.map((voter) => voter.email),
        election: result,
      });
      console.log("Email result sent to", election.name);
    }
  });

  res.status(200).end();
}

export default verifySignature(handler);

export const config = {
  api: {
    bodyParser: false,
  },
};
