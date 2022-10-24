import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { firestore } from "../../firebase/firebase";
import { candidateType } from "../../types/typings";

interface CandidateCredentialPageProps {
  candidate: candidateType;
}

const CandidateCredentialPage = ({
  candidate,
}: CandidateCredentialPageProps) => {
  console.log(candidate);
  return <div>CandidateCredentialPage</div>;
};

export default CandidateCredentialPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  //   console.log(context);
  const { electionIdName, fullName } = context.query;

  if (electionIdName && fullName) {
    const electionSnapshot = await getDocs(
      query(
        collection(firestore, "elections"),
        where("electionIdName", "==", electionIdName)
      )
    );
    const fullNameArray = (fullName as string).split("-");
    console.log(fullNameArray[0]);
    if (fullNameArray.length === 2) {
      const candidateSnapshot = await getDocs(
        query(
          collection(
            firestore,
            "elections",
            electionSnapshot.docs[0].data().uid,
            "candidates"
          ),
          where("firstName", "==", "Imong")
          //   where("lastName", "==", fullNameArray[1])
        )
      );
      if (candidateSnapshot.empty) {
        return {
          notFound: true,
        };
      }
      const candidate = candidateSnapshot.docs[0].data() as candidateType;
      return {
        props: { candidate: JSON.parse(JSON.stringify(candidate)) },
      };
    } else if (fullNameArray.length === 3) {
      const candidateSnapshot = await getDocs(
        query(
          collection(
            firestore,
            "elections",
            electionSnapshot.docs[0].data().uid,
            "candidates"
          ),
          where("firstName", "==", fullNameArray[0]),
          where("middleName", "==", fullNameArray[1]),
          where("lastName", "==", fullNameArray[2])
        )
      );
      if (candidateSnapshot.empty) {
        return {
          notFound: true,
        };
      }
      const candidate = candidateSnapshot.docs[0].data() as candidateType;
      return {
        props: { candidate },
      };
    }
  }

  return { notFound: true };
};
