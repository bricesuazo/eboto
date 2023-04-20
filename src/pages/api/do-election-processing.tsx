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
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
  );

  const elections = await prisma.election.findMany({
    where: {
      start_date: now,
      voting_start: now.getHours(),
    },
  });

  for (const election of elections) {
    await prisma.election.update({
      where: {
        id: election.id,
      },
      data: {
        publicity: "VOTER",
      },
    });
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
  }

  // Generate election results when the election is over

  const electionsEnd = await prisma.election.findMany({
    where: {
      end_date: now,
      voting_end: now.getHours(),
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
