import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifySignatureEdge } from "@upstash/qstash/dist/nextjs";

import { db } from "@eboto/db";
import { elections } from "@eboto/db/schema";
import { sendElectionStart } from "@eboto/email/emails/election-start";

export const runtime = "edge";

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
  console.log("START: 🚀 ~ file: cron.tsx:12 ~ handler ~ today:", date_today);
  console.log("START: 🚀 ~ file: cron.tsx:19 ~ handler ~ today:", today);

  await db.transaction(async (trx) => {
    const electionsStart = await trx.query.elections.findMany({
      where: (election, { eq, and, isNull }) =>
        and(
          eq(election.start_date, date_today),
          isNull(election.deleted_at),
          eq(election.voting_hour_start, today.getHours()),
        ),
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
      console.log(
        "START: 🚀 ~ file: cron.tsx:35 ~ awaitdb.transaction ~ election:",
        election,
      );
      await Promise.all([
        sendElectionStart({
          isForCommissioner: false,
          election: {
            name: election.name,
            slug: election.slug,
            start_date: election.start_date,
            end_date: election.end_date,
          },
          emails: election.voters.map((voter) => voter.email),
        }),
        sendElectionStart({
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
        }),
      ]);

      if (election.publicity === "PRIVATE") {
        await trx.update(elections).set({
          publicity: "VOTER",
        });
      }
      console.log("Email start sent to", election.name);
    }
  });

  return NextResponse.json({});
}

export const POST = verifySignatureEdge(handler);
