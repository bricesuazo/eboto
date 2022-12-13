import { Timestamp } from "firebase/firestore";

export interface electionType {
  uid: string;
  id: string;
  name: string;
  about: string?;
  electionIdName: string;
  logoUrl: string?;
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
  description: string?;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
export interface positionType {
  order: number;
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
  slug: string;

  credentials: {
    affiliations: affiliationType[] | [];
    achievements: achievementType[] | [];
    seminarsAttended: seminarAttendedType[] | [];
  };
}

interface seminarAttendedType {
  id: string;
  name: string;
  startDate: Timestamp;
  endDate: Timestamp?;
}
interface achievementType {
  id: string;
  title: string;
}
interface affiliationType {
  id: string;
  organizationName: string;
  position: string;
  startDate: Timestamp;
  endDate: Timestamp?;
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
  emailSent: boolean;
}
export interface adminType {
  updatedAt: Timestamp;
  accountType: "admin";
  elections: string[];
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
