import type { Election } from "@prisma/client";

export const isElectionEnded = ({
  election,
  withTime,
}: {
  election: Election;
  withTime: boolean;
}) => {
  const end = new Date(election.end_date);
  end.setDate(end.getDate() + 1);

  const now = new Date();
  const nowPHT = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Manila" })
  );

  return withTime
    ? end.getTime() <= now.getTime() && election.voting_end > nowPHT.getHours()
    : end.getTime() <= now.getTime();
};
