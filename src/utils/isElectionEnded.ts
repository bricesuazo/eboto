import type { Election } from "@prisma/client";

export const isElectionEnded = ({
  election,
  dateOnly,
}: {
  election: Election;
  dateOnly?: boolean;
}) => {
  const end_date = new Date(election.end_date);
  const end = new Date(end_date.setHours(election.voting_end));

  return dateOnly ? new Date().getDate() > end.getDate() : new Date() > end;
};
