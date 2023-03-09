import type { Election } from "@prisma/client";

export const isElectionOngoing = (election: Election) => {
  return (
    election.start_date.getTime() <= new Date().getTime() &&
    election.end_date.getTime() > new Date().getTime() &&
    election.voting_start <= new Date().getHours() &&
    election.voting_end > new Date().getHours()
  );
};
