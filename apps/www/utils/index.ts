import { Election } from '@eboto-mo/db/schema';

export const isElectionOngoing = ({ election }: { election: Election }) => {
  const end = new Date(election.end_date);
  end.setDate(end.getDate() + 1);

  const now = new Date();
  return (
    election.start_date.getTime() <= now.getTime() &&
    end.getTime() > now.getTime()
  );
};
