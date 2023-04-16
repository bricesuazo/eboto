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

  return withTime
    ? election.start_date.getTime() <= new Date().getTime() &&
        end.getTime() > new Date().getTime() &&
        election.voting_start <= new Date().getHours() &&
        election.voting_end > new Date().getHours()
    : election.start_date.getTime() <= new Date().getTime() &&
        end.getTime() > new Date().getTime();
};
