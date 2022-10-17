export interface electionType {
  uid: string;
  id: string;
  name: string;
  about: string?;
  electionIdName: string;
  ongoing: boolean;
  partylists: partylistType[];
  positions: positionType[]?;
  candidates: candidateType[]?;
  createdAt: Date;
  updatedAt: Date;
  electionStartDate: Date?;
  electionEndDate: Date?;
}
export interface partylistType {
  uid: string;
  id: string;
  name: string;
  abbreviation: string;
  logo: string?;
  description: string?;
}
export interface positionType {
  uid: string;
  id: string;
  title: string;
  undecidedVotingCount: number;
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
}
export interface adminType {
  updatedAt: Date;
  accountType: "admin";
  elections: electionType[];
  email: string;
  emailVerified: boolean;
  uid: string;
  firstName: string;
  createdAt: Date;
  photoUrl: string;
  password: string;
  id: string;
  lastName: string;
}
