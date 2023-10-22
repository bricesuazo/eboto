import type { NextApiRequest, NextApiResponse } from "next";
import GenerateResult from "@/pdf/generate-result";
import type { ResultType } from "@/pdf/generate-result";
import ReactPDF from "@react-pdf/renderer";
import { verifySignature } from "@upstash/qstash/nextjs";
import { UTApi } from "uploadthing/server";

import { db } from "@eboto-mo/db";
import { generated_election_results } from "@eboto-mo/db/schema";
import { sendElectionResult } from "@eboto-mo/email/emails/election-result";
import { sendElectionStart } from "@eboto-mo/email/emails/election-start";

const utapi = new UTApi();

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await db.transaction(async (trx) => {
    const start_date = new Date();
    console.log("🚀 ~ file: cron.tsx:13 ~ handler ~ start_date:", start_date);
    start_date.setSeconds(0);
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
      const result = {
        id: election.id,
        name: election.name,
        slug: election.slug,
        start_date: election.start_date,
        end_date: election.end_date,
        logo: election.logo?.url ?? null,
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

      const file = await utapi.uploadFiles(
        await ReactPDF.render(<GenerateResult result={result} />, path),
        path,
      );

      if (file.error) throw file.error;

      await db.insert(generated_election_results).values({
        election_id: election.id,
        file: file.data,
      });

      await sendElectionResult({
        emails: election.voters.map((voter) => voter.email),
        election: {
          name: election.name,
          slug: election.slug,
          start_date: election.start_date,
          end_date: election.end_date,
          positions: election.positions.map((position) => ({
            id: position.id,
            name: position.name,
            abstain_count: position.votes.filter((vote) => vote.position_id)
              .length,
            candidates: position.candidates.map((candidate) => ({
              id: candidate.id,
              first_name: candidate.first_name,
              middle_name: candidate.middle_name,
              last_name: candidate.last_name,
              vote_count: candidate.votes.length,
            })),
          })),
        },
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
