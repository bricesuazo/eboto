import { verifySignature } from "@upstash/qstash/nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../server/db";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("If this is printed, the signature has already been verified");

  const election = await prisma.election.findUnique({
    where: {
      slug: "test",
    },
  });
  console.log(
    "🚀 ~ file: do-election-processing.ts:17 ~ handler ~ elections:",
    election
  );
  console.log("Date now", new Date());

  // do stuff
  res.status(200).end();
}

export default verifySignature(handler);

export const config = {
  api: {
    bodyParser: false,
  },
};
