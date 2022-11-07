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
  return (
    <div>{`${candidate.firstName} ${candidate.middleName} ${candidate.lastName}`}</div>
  );
};

export default CandidateCredentialPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { electionIdName, candidateUid } = context.query;

  if (electionIdName && candidateUid) {
    const electionSnapshot = await getDocs(
      query(
        collection(firestore, "elections"),
        where("electionIdName", "==", electionIdName)
      )
    );
    const candidateSnapshot = await getDoc(
      doc(
        firestore,
        "elections",
        electionSnapshot.docs[0].data().uid,
        "candidates",
        candidateUid as string
      )
    );
    if (candidateSnapshot.exists()) {
      return {
        props: {
          candidate: JSON.parse(
            JSON.stringify(candidateSnapshot.data() as candidateType)
          ),
        },
      };
    }
  }

  return { notFound: true };
};
