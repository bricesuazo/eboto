// TODO: migrate this to inngest

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/admin";
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";

import { sendElectionStart } from "@eboto/email/emails/election-start";

// export const runtime = "edge";
export const dynamic = "force-dynamic";

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

  // TODO: add transaction

  // const electionsStart = await trx.query.elections.findMany({
  //   where: (election, { eq, and, isNull }) =>
  //     and(
  //       eq(election.start_date, date_today),
  //       isNull(election.deleted_at),
  //       eq(election.voting_hour_start, today.getHours()),
  //     ),
  //   with: {
  //     commissioners: {
  //       with: {
  //         user: true,
  //       },
  //     },
  //     voters: true,
  //   },
  // });

  const { data: electionsStart } = await supabase
    .from("elections")
    .select()
    .eq("start_date", date_today.toISOString())
    .eq("voting_hour_start", today.getHours())
    .is("deleted_at", null);

  if (!electionsStart)
    return NextResponse.json({ success: false }, { status: 500 });

  const { data: commissionersElections } = await supabase
    .from("commissioners")
    .select("*, user: users(email)")
    .in(
      "election_id",
      electionsStart.map((election) => election.id),
    )
    .is("deleted_at", null);

  const { data: votersElections } = await supabase
    .from("voters")
    .select()
    .in(
      "election_id",
      electionsStart.map((election) => election.id),
    )
    .is("deleted_at", null);

  if (!commissionersElections || !votersElections)
    return NextResponse.json({ success: false }, { status: 500 });

  for (const election of electionsStart) {
    const commissioners = commissionersElections.filter(
      (commissioner) => commissioner.election_id === election.id,
    );
    const voters = votersElections.filter(
      (voter) => voter.election_id === election.id,
    );
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
          start_date: new Date(election.start_date),
          end_date: new Date(election.end_date),
        },
        emails: voters.map((voter) => voter.email),
      }),
      sendElectionStart({
        isForCommissioner: true,
        election: {
          name: election.name,
          slug: election.slug,
          start_date: new Date(election.start_date),
          end_date: new Date(election.end_date),
        },
        emails: commissioners.map((commissioner) =>
          commissioner.user ? commissioner.user.email : "",
        ),
      }),
    ]);

    if (election.publicity === "PRIVATE") {
      await supabase
        .from("elections")
        .update({
          publicity: "VOTER",
        })
        .eq("id", election.id);
    }
    console.log("Email start sent to", election.name);
  }

  return NextResponse.json({ success: true });
}

export const POST = verifySignatureAppRouter(handler);
