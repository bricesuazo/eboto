import { Timestamp } from "firebase/firestore";

export interface electionType {
  uid: string;
  id: string;
  name: string;
  about: string?;
  electionIdName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  electionStartDate: Timestamp;
  electionEndDate: Timestamp;
  publicity: "private" | "voters" | "public";
}
export interface partylistType {
  uid: string;
  id: string;
  name: string;
  abbreviation: string;
  logo: string?;
  description: string?;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
export interface positionType {
  uid: string;
  id: string;
  title: string;
  undecidedVotingCount: number;
  updatedAt: Timestamp;
  createdAt: Timestamp;
}
export interface candidateType {
  id: string;
  uid: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  photoUrl: string?;
  position: string;
  partylist: string;
  votingCount: number;
  updatedAt: Timestamp;
  createdAt: Timestamp;
}

export interface voterType {
  accountType: "voter";
  uid: string;
  id: string;
  fullName: string;
  email: string;
  password: string;
  hasVoted: boolean;
  election: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
export interface adminType {
  updatedAt: Timestamp;
  accountType: "admin";
  elections: electionType[];
  email: string;
  emailVerified: boolean;
  uid: string;
  firstName: string;
  createdAt: Timestamp;
  photoUrl: string;
  password: string;
  id: string;
  lastName: string;
}
