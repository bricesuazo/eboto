import { Timestamp } from "firebase/firestore";
import { electionType } from "../types/typings";

const isElectionOngoing = (election: electionType): boolean => {
  const nowTimestamp = Timestamp.now();
  const nowDate = new Date();

  const startHourDate = new Date();
  startHourDate.setHours(election.votingStartHour);
  startHourDate.setMinutes(0);

  const endHourDate = new Date();
  endHourDate.setHours(election.votingEndHour);
  endHourDate.setMinutes(0);

  return (
    nowTimestamp.seconds >= election.electionStartDate.seconds &&
    nowTimestamp.seconds <= election.electionEndDate.seconds &&
    nowDate.getHours() >= election.votingStartHour &&
    nowDate.getHours() <= election.votingEndHour &&
    nowDate.getTime() >= startHourDate.getTime() &&
    nowDate.getTime() < endHourDate.getTime()
  );
};

export default isElectionOngoing;
