import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "../firebase/firebase";

const isVoterExists = async (election: string, email: string) => {
  const voterSnaphot = await getDocs(
    query(
      collection(firestore, "elections", election, "voters"),
      where("email", "==", email)
    )
  );

  return voterSnaphot.docs.length !== 0;
};

export default isVoterExists;
