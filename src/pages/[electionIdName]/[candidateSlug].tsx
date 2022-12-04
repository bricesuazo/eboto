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
import { Container } from "@chakra-ui/react";

const CandidateCredentialPage = ({
  candidate,
}: {
  candidate: candidateType;
}) => {
  return (
    <Container maxW="8xl">{`${candidate.firstName}${
      candidate.middleName && " " + candidate.middleName
    } ${candidate.lastName}`}</Container>
  );
};

export default CandidateCredentialPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { electionIdName, candidateSlug } = context.query;

  if (electionIdName && candidateSlug) {
    const electionSnapshot = await getDocs(
      query(
        collection(firestore, "elections"),
        where("electionIdName", "==", electionIdName)
      )
    );
    const candidateSnapshot = await getDocs(
      query(
        collection(
          firestore,
          "elections",
          electionSnapshot.docs[0].data().uid,
          "candidates"
        ),
        where("slug", "==", candidateSlug)
      )
    );
    if (!candidateSnapshot.empty) {
      return {
        props: {
          candidate: JSON.parse(
            JSON.stringify(candidateSnapshot.docs[0].data() as candidateType)
          ),
        },
      };
    }
  }

  return { notFound: true };
};
