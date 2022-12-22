import { Timestamp } from "firebase/firestore";
import { electionType } from "../types/typings";

const isElectionOngoing = (
  startDate: Timestamp,
  endDate: Timestamp,
  votingStartHour?: electionType["votingStartDate"],
  votingEndHour?: electionType["votingEndDate"]
): boolean => {
  const now = Timestamp.now();

  if (votingStartHour && votingEndHour)
    return now.seconds >= startDate.seconds && now.seconds <= endDate.seconds;
  return now.seconds >= startDate.seconds && now.seconds <= endDate.seconds;
};

export default isElectionOngoing;
