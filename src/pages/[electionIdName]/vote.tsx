import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { GetServerSideProps } from "next";
import {
  candidateType,
  electionType,
  partylistType,
  positionType,
} from "../../types/typings";
import { firestore } from "../../firebase/firebase";
import {
  Box,
  Button,
  Stack,
  Text,
  useDisclosure,
  useRadioGroup,
} from "@chakra-ui/react";
import CandidateCard from "../../components/CandidateCard";
import { useState } from "react";
import ConfirmVoteModal from "../../components/ConfirmVoteModal";
import Head from "next/head";
import Card from "../../components/Card";

interface VotePageProps {
  election: electionType;
  partylists: partylistType[];
  positions: positionType[];
  candidates: candidateType[];
}
const VotePage = ({
  election,
  partylists,
  positions,
  candidates,
}: VotePageProps) => {
  const pageTitle = `${election.name} - Vote | eBoto Mo`;
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <ConfirmVoteModal
        isOpen={isOpen}
        onClose={onClose}
        election={election}
        partylists={partylists}
        positions={positions}
        candidates={candidates}
        selectedCandidates={selectedCandidates}
      />
      <Box padding={4}>
        <Box>
          <Text fontSize="3xl" textAlign="center">
            {election.name}
          </Text>

          <Stack spacing={4}>
            {positions.map((position) => (
              <Card
                key={position.id}
                position={position}
                setSelectedCandidates={setSelectedCandidates}
                candidates={candidates}
                partylists={partylists}
              />
            ))}
          </Stack>
        </Box>

        <Button
          disabled={positions.length !== selectedCandidates.length}
          onClick={onOpen}
        >
          Cast Vote
        </Button>
      </Box>
    </>
  );
};

export default VotePage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const electionSnapshot = await getDocs(
    query(
      collection(firestore, "elections"),
      where("electionIdName", "==", context.query.electionIdName)
    )
  );
  if (electionSnapshot.empty) {
    return {
      notFound: true,
    };
  }
  const positionsSnapshot = await getDocs(
    query(
      collection(
        firestore,
        "elections",
        electionSnapshot.docs[0].id,
        "positions"
      ),
      orderBy("createdAt", "asc")
    )
  );
  const positions = positionsSnapshot.docs.map((doc) => doc.data());

  const partylistsSnapshot = await getDocs(
    query(
      collection(
        firestore,
        "elections",
        electionSnapshot.docs[0].id,
        "partylists"
      ),
      orderBy("createdAt", "asc")
    )
  );
  const partylists = partylistsSnapshot.docs.map((doc) => doc.data());

  const candidatesSnapshot = await getDocs(
    collection(
      firestore,
      "elections",
      electionSnapshot.docs[0].id,
      "candidates"
    )
  );
  const candidates = candidatesSnapshot.docs.map((doc) => doc.data());
  return {
    props: {
      election: JSON.parse(JSON.stringify(electionSnapshot.docs[0].data())),
      positions: JSON.parse(JSON.stringify(positions)) as positionType[],
      partylists: JSON.parse(JSON.stringify(partylists)) as partylistType[],
      candidates: JSON.parse(JSON.stringify(candidates)) as candidateType[],
    },
  };
};
