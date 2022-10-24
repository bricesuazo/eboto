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
  const { electionIdName, candidateUid } = context.query;

  if (electionIdName && candidateUid) {
    const electionSnapshot = await getDocs(
      query(
        collection(firestore, "elections"),
        where("electionIdName", "==", electionIdName)
      )
    );
    // console.log(fullNameArray[0]);
    // if (fullNameArray.length === 2) {
    //   const candidateSnapshot = await getDocs(
    //     query(
    //       collection(
    //         firestore,
    //         "elections",
    //         electionSnapshot.docs[0].data().uid,
    //         "candidates"
    //       ),
    //       where("firstName", "==", "Imong")
    //       //   where("lastName", "==", fullNameArray[1])
    //     )
    //   );
    //   if (candidateSnapshot.empty) {
    //     return {
    //       notFound: true,
    //     };
    //   }
    //   const candidate = candidateSnapshot.docs[0].data() as candidateType;
    //   return {
    //     props: { candidate: JSON.parse(JSON.stringify(candidate)) },
    //   };
    // }
    const candidateSnapshot = await getDoc(
      doc(
        firestore,
        "elections",
        electionSnapshot.docs[0].data().uid,
        "candidates",
        candidateUid as string
      )
    );
    console.log(candidateSnapshot.data());
    if (candidateSnapshot.exists()) {
      return {
        props: {
          candidates: JSON.parse(
            JSON.stringify(candidateSnapshot.data() as candidateType)
          ),
        },
      };
    }
  }

  return { notFound: true };
};
