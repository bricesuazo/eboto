// TODO: migrate this to inngest

import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/admin";
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";

import { sendElectionResult } from "@eboto/email/emails/election-result";

import type { GeneratedElectionResult } from "./../../../../../../../supabase/custom-types";

// export const runtime = "edge";
export const dynamic = "force-dynamic";

async function handler(_req: Request) {
  console.log("ELECTION END CRON");
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

  // TODO: add transaction
  // const date_today_end = new Date(date_today);

  const { data: electionsEnd } = await supabase
    .from("elections")
    .select(
      "*, positions(*, votes(*), candidates(*, votes(*)), partylist: partylists(*))",
    )
    .eq("end_date", date_today.toISOString())
    .eq("voting_hour_end", today.getHours())

    .is("deleted_at", null);

  if (!electionsEnd)
    return NextResponse.json({ success: false }, { status: 500 });

  const { data: commissionersElections } = await supabase
    .from("commissioners")
    .select("*, user: users(email)")
    .in(
      "election_id",
      electionsEnd.map((election) => election.id),
    )
    .is("deleted_at", null);

  const { data: votersElections } = await supabase
    .from("voters")
    .select()
    .in(
      "election_id",
      electionsEnd.map((election) => election.id),
    )
    .is("deleted_at", null);

  if (!commissionersElections || !votersElections)
    return NextResponse.json({ success: false }, { status: 500 });

  for (const election of electionsEnd) {
    const commissioners = commissionersElections.filter(
      (commissioner) => commissioner.election_id === election.id,
    );
    const voters = votersElections.filter(
      (voter) => voter.election_id === election.id,
    );
    console.log(
      "END: 🚀 ~ file: cron.tsx:91 ~ awaitdb.transaction ~ election:",
      election,
    );
    const result = {
      ...election,
      // TODO: Fix this
      logo_url: null,
      positions: election.positions.map((position) => ({
        ...position,
        abstain_count: position.votes.length,
        candidates: position.candidates.map((candidate) => ({
          ...candidate,
          vote_count: candidate.votes.length,
        })),
      })),
    } satisfies GeneratedElectionResult;

    await Promise.all([
      supabase.from("generated_election_results").insert({
        election_id: election.id,
        result,
      }),
      sendElectionResult({
        emails: [
          ...new Set([
            ...voters.map((voter) => voter.email),
            ...commissioners.map((commissioner) =>
              commissioner.user ? commissioner.user.email : "",
            ),
          ]),
        ],
        election: result,
      }),
    ]);
    console.log("Email result sent to", election.name);
  }

  return NextResponse.json({ success: true });
}

export const POST = verifySignatureAppRouter(handler);
