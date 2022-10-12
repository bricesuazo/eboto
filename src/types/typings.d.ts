export interface electionType {
  uid: string;
  id: string;
  name: string;
  about: string?;
  electionIdName: string;
  ongoing: boolean;
  partylists: [
    {
      id: string;
      title: string;
      acronym: string;
    }
  ];
  positions: [
    {
      id: string;
      title: string;
      undecidedVotingCount: number;
    }?
  ];
  candidates: [
    {
      id: string;
      firstName: string;
      middleName: string?;
      lastName: string;
      img: string?;
      position: string;
      partylist: string;
      votingCount: number;
      significantAchievements: [string]?;
      leadershipAchievements: [string]?;
      question: {
        question: string;
        answer: [string];
      }?;
    }?
  ];
  createdAt: Date;
  updatedAt: Date;
}

export interface voterType {
  accountType: "voter";
  uid: string;
  fullName: string;
  email: string;
  password: string;
  hasVoted: boolean;
  election: string;
  loading?: boolean;
}
