import type { Election } from "@prisma/client";

export const isElectionEnded = ({
  election,
  withTime,
}: {
  election: Election;
  withTime: boolean;
}) => {
  const end_date = new Date(election.end_date);
  const end = new Date(end_date.setHours(election.voting_end));

  return withTime ? new Date() > end : new Date().getDate() > end.getDate();
};
