import GenerateResult from "@/pdf/generate-result";
import type { ResultType } from "@/pdf/generate-result";
import { db } from "@eboto-mo/db";
import { generated_election_results } from "@eboto-mo/db/schema";
import ReactPDF from "@react-pdf/renderer";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { verifySignature } from "@upstash/qstash/nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { cookies } from "next/headers";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const nowUTC = new Date();
  const nowPHT = new Date(
    nowUTC.toLocaleString("en-US", { timeZone: "Asia/Manila" }),
  );

  // const start_date = new Date(nowPHT);

  // const elections = await db.query.elections.findMany({
  //   where: (election, { eq }) => eq(election.start_date, start_date),
  // });

  // for (const election of elections) {
  //   // send to commissioners and inform them that they can now invite voters to vote
  //   // const commissioners = await db.query.commissioners.findMany({
  //   //   where: (commissioner, { eq }) =>
  //   //     eq(commissioner.election_id, election.id),
  //   // });
  //   // for (const commissioner of commissioners) {
  //   //   await sendEmailTransport({
  //   //     email: voter.email,
  //   //     subject: `You have been invited to vote in ${election.name}`,
  //   //     html: render(
  //   //       <ElectionInvitation
  //   //         type="VOTER"
  //   //         token={token.id}
  //   //         electionName={election.name}
  //   //         electionEndDate={expiresAtPHT}
  //   //       />,
  //   //     ),
  //   //   });
  //   // }
  // }

  // Generate election results when the election is over
  const end_date = new Date(nowPHT);

  const electionsEnd = await db.query.elections.findMany({
    where: (election, { eq }) => eq(election.end_date, end_date),
    with: {
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
    const result = {
      id: election.id,
      name: election.name,
      slug: election.slug,
      start_date: election.start_date,
      end_date: election.end_date,
      logo: election.logo ?? null,
      positions: election.positions.map((position) => ({
        id: position.id,
        name: position.name,
        votes: position.votes.length,
        candidates: position.candidates.map((candidate) => ({
          id: candidate.id,
          name: `${candidate.last_name}, ${candidate.first_name}${
            candidate.middle_name
              ? " " + candidate.middle_name.charAt(0) + "."
              : ""
          } (${candidate.partylist.acronym})`,
          votes: candidate.votes.length,
        })),
      })),
    } satisfies ResultType;

    const nowForName = new Date();

    const name = `${nowForName.getTime().toString()} - ${
      election.name
    } (Result) (${nowForName.toDateString()}).pdf`;

    const path = `elections/${election.id}/results/${name}`;

    const supabase = createRouteHandlerClient({
      cookies,
    });

    await supabase.storage
      .from("eboto-mo")
      .upload(
        path,
        await ReactPDF.renderToStream(<GenerateResult result={result} />),
      );
    const {
      data: { publicUrl },
    } = supabase.storage.from("eboto-mo").getPublicUrl(path);

    await db.insert(generated_election_results).values({
      name,
      link: publicUrl,
      election_id: election.id,
    });
  }

  res.status(200).end();
}

// export default handler;
export default verifySignature(handler);

export const config = {
  api: {
    bodyParser: false,
  },
};
