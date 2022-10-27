interface election {
  id: string;
  name: string;
  about: string?;
  electionIDName: string;
  ongoing: boolean;
  partylists: [
    {
      id: string;
      title: string;
      acronym: string;
    }?
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
