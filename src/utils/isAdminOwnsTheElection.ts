import { Session } from "next-auth";
const isAdminOwnsTheElection = (session: Session, electionUid: string) => {
  return (
    session &&
    session.user.accountType === "admin" &&
    session.user.elections.includes(electionUid)
  );
};

export default isAdminOwnsTheElection;
