import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "../firebase/firebase";

const isElectionIdNameExists = async (electionIdName: string) => {
  const electionIdNameQuery = await getDocs(
    query(
      collection(firestore, "elections"),
      where("electionIdName", "==", electionIdName)
    )
  );

  return electionIdNameQuery.docs.length !== 0;
};

export default isElectionIdNameExists;
