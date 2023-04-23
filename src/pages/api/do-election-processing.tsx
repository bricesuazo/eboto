import { render } from "@react-email/render";
import { verifySignature } from "@upstash/qstash/nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { sendEmailTransport } from "../../../emails";
import ElectionInvitation from "../../../emails/ElectionInvitation";
import { prisma } from "../../server/db";
import GenerateResult, { type ResultType } from "../../pdf/GenerateResult";
import { supabase } from "../../lib/supabase";
import ReactPDF from "@react-pdf/renderer";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const nowUTC = new Date();
  console.log(
    "🚀 ~ file: do-election-processing.tsx:13 ~ handler ~ nowUTC:",
    nowUTC
  );
  const nowPHT = new Date(
    nowUTC.toLocaleString("en-US", { timeZone: "Asia/Manila" })
  );
  console.log(
    "🚀 ~ file: do-election-processing.tsx:15 ~ handler ~ nowPHT:",
    nowPHT
  );

  const start_date = new Date(nowUTC);
  start_date.setHours(0, 0, 0, 0);
  console.log(
    "🚀 ~ file: do-election-processing.tsx:18 ~ handler ~ start_date:",
    start_date
  );
  start_date.setDate(start_date.getDate() - 1);
  console.log(
    "🚀 ~ file: do-election-processing.tsx:18 ~ handler ~ start_date:",
    start_date
  );
  console.log(
    "🚀 ~ file: do-election-processing.tsx:18 ~ handler ~ start_date.toISOString():",
    start_date.toISOString()
  );
  console.log(
    "🚀 ~ file: do-election-processing.tsx:18 ~ handler ~ start_date.toISOString().split(T)[0]?.concat(T16:00:00.000Z):",
    start_date.toISOString().split("T")[0]?.concat("T16:00:00.000Z")
  );

  console.log(
    "🚀 ~ file: do-election-processing.tsx:52 ~ handler ~ nowPHT.getHours():",
    nowPHT.getHours()
  );
  const elections = await prisma.election.findMany({
    where: {
      start_date: start_date
        .toISOString()
        .split("T")[0]
        ?.concat("T16:00:00.000Z"),
      voting_start: nowPHT.getHours(),
    },
  });

  for (const election of elections) {
    const invitedVoters = await prisma.invitedVoter.findMany({
      where: {
        electionId: election.id,
        status: "ADDED",
      },
    });

    for (const voter of invitedVoters) {
      const token = await prisma.verificationToken.create({
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

      await prisma.invitedVoter.update({
        where: {
          id: voter.id,
        },
        data: {
          status: "INVITED",
        },
      });
    }

    await prisma.election.update({
      where: {
        id: election.id,
      },
      data: {
        publicity: "VOTER",
      },
    });
  }

  // Generate election results when the election is over
  console.log("--------------------------");
  const end_date = new Date(nowUTC);
  console.log(
    "🚀 ~ file: do-election-processing.tsx:96 ~ handler ~ end_date:",
    end_date
  );
  end_date.setHours(0, 0, 0, 0);
  console.log(
    "🚀 ~ file: do-election-processing.tsx:96 ~ handler ~ end_date:",
    end_date
  );
  end_date.setDate(end_date.getDate() - 1);
  console.log(
    "🚀 ~ file: do-election-processing.tsx:96 ~ handler ~ end_date:",
    end_date
  );
  console.log(
    "🚀 ~ file: do-election-processing.tsx:130 ~ handler ~ nowPHT.getHours():",
    nowPHT.getHours()
  );

  const electionsEnd = await prisma.election.findMany({
    where: {
      end_date: end_date.toISOString().split("T")[0]?.concat("T16:00:00.000Z"),
      voting_end: nowPHT.getHours(),
    },
    include: {
      positions: {
        include: {
          candidate: {
            include: {
              vote: true,
              partylist: true,
            },
          },
          vote: true,
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
      logo: election.logo || null,
      voting_start: election.voting_start,
      voting_end: election.voting_end,
      positions: election.positions.map((position) => ({
        id: position.id,
        name: position.name,
        votes: position.vote.length,
        candidates: position.candidate.map((candidate) => ({
          id: candidate.id,
          name: `${candidate.last_name}, ${candidate.first_name}${
            candidate.middle_name
              ? " " + candidate.middle_name.charAt(0) + "."
              : ""
          } (${candidate.partylist.acronym})`,
          votes: candidate.vote.length,
        })),
      })),
    } satisfies ResultType;

    const nowForName = new Date();

    const name = `${nowForName.getTime().toString()} - ${
      election.name
    } (Result) (${nowForName.toDateString()}).pdf`;

    const path = `elections/${election.id}/results/${name}`;

    await supabase.storage
      .from("eboto-mo")
      .upload(
        path,
        await ReactPDF.renderToStream(<GenerateResult result={result} />)
      );
    const {
      data: { publicUrl },
    } = supabase.storage.from("eboto-mo").getPublicUrl(path);

    await prisma.generatedElectionResult.create({
      data: {
        name,
        link: publicUrl,
        electionId: election.id,
      },
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
