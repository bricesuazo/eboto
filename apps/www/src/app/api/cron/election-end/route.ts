import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";

import { db } from "@eboto/db";
import type { GeneratedElectionResult } from "@eboto/db/schema";
import { generated_election_results } from "@eboto/db/schema";
import { sendElectionResult } from "@eboto/email/emails/election-result";

// export const runtime = "edge";

async function handler(_req: NextRequest) {
  console.log("ELECTION START CRON");
  // TODO: Use toISOString() instead of toLocaleDateString() and toLocaleString()
  const date_today = new Date(
    new Date().toLocaleDateString("en-US", {
      timeZone: "Asia/Manila",
    }),
  );
  const today = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Manila",
    }),
  );
  console.log("END: 🚀 ~ file: cron.tsx:12 ~ handler ~ today:", date_today);
  console.log("END: 🚀 ~ file: cron.tsx:19 ~ handler ~ today:", today);

  await db.transaction(async (trx) => {
    const date_today_end = new Date(date_today);
    const electionsEnd = await trx.query.elections.findMany({
      where: (election, { eq, and, isNull }) =>
        and(
          eq(
            election.end_date,
            new Date(date_today_end.setDate(date_today_end.getDate() + 1)),
          ),
          eq(election.voting_hour_end, today.getHours()),
          isNull(election.deleted_at),
        ),
      with: {
        voters: true,
        commissioners: {
          with: {
            user: true,
          },
        },
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
        "END: 🚀 ~ file: cron.tsx:91 ~ awaitdb.transaction ~ election:",
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

      await Promise.all([
        trx.insert(generated_election_results).values({
          election_id: election.id,
          election: result,
        }),
        sendElectionResult({
          emails: [
            ...new Set([
              ...election.voters.map((voter) => voter.email),
              ...election.commissioners.map(
                (commissioner) => commissioner.user.email,
              ),
            ]),
          ],
          election: result,
        }),
      ]);
      console.log("Email result sent to", election.name);
    }
  });

  return NextResponse.json({});
}

export const POST = verifySignatureAppRouter(handler);
