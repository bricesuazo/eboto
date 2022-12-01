import { Timestamp } from "firebase/firestore";

const isElectionOngoing = (
  startDate: Timestamp,
  endDate: Timestamp
): boolean => {
  const now = Timestamp.now();

  return now.seconds >= startDate.seconds && now.seconds <= endDate.seconds;
};

export default isElectionOngoing;
