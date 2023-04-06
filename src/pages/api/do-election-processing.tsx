import { render } from "@react-email/render";
import { verifySignature } from "@upstash/qstash/nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { sendEmailTransport } from "../../../emails";
import ElectionInvitation from "../../../emails/ElectionInvitation";
import { prisma } from "../../server/db";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const elections = await prisma.election.findMany({
    where: {
      start_date: {
        equals: new Date(
          new Date().toUTCString().split(" ").slice(0, 4).join(" ")
        ),
      },
    },
  });
  console.log(
    "🚀 ~ file: do-election-processing.tsx:16 ~ handler ~ elections:",
    elections
  );
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
      // const token = await prisma.verificationToken.create({
      //   data: {
      //     expiresAt: election.end_date,
      //     type: "ELECTION_INVITATION",
      //     invitedVoter: {
      //       connect: {
      //         id: voter.id,
      //       },
      //     },
      //   },
      // });

      // await sendEmailTransport({
      //   email: voter.email,
      //   subject: `You have been invited to vote in ${election.name}`,
      //   html: render(
      //     <ElectionInvitation
      //       type="VOTER"
      //       token={token.id}
      //       electionName={election.name}
      //       electionEndDate={election.end_date}
      //     />
      //   ),
      // });

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

  res.status(200).end();
}

export default verifySignature(handler);

export const config = {
  api: {
    bodyParser: false,
  },
};
