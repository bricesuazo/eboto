import type { Election } from "@prisma/client";

export const isElectionOngoing = ({
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
    ? election.start_date.getTime() <= now.getTime() &&
        end.getTime() > now.getTime() &&
        election.voting_start <= nowPHT.getHours() &&
        election.voting_end > nowPHT.getHours()
    : election.start_date.getTime() <= now.getTime() &&
        end.getTime() > now.getTime();
};
