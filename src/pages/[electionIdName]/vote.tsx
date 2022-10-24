import { collection, getDocs, query, where } from "firebase/firestore";
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
  Text,
  useDisclosure,
  useRadioGroup,
} from "@chakra-ui/react";
import CandidateCard from "../../components/CandidateCard";
import { useState } from "react";
import ConfirmVoteModal from "../../components/ConfirmVoteModal";
import Head from "next/head";

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
      <Box>
        <Box>
          <Text fontSize="3xl">{election.name}</Text>

          <Box>
            {positions
              .sort((a, b) => a.createdAt.seconds - b.createdAt.seconds)
              .map((position) => {
                const { getRootProps, getRadioProps } = useRadioGroup({
                  name: position.uid,
                  onChange: (value) => {
                    setSelectedCandidates((prev) => {
                      return prev
                        .filter((prev) => prev.split("-")[0] !== position.uid)
                        .concat(value);
                    });
                  },
                });
                const group = getRootProps();
                const radioUndecided = getRadioProps({
                  value: `${position.uid}-undecided`,
                });
                return (
                  <Box key={position.id}>
                    <Text fontSize="2xl">{position.title}</Text>
                    <Box {...group}>
                      {candidates
                        .filter(
                          (candidate) => candidate.position === position.uid
                        )
                        .map((candidate) => {
                          const radio = getRadioProps({
                            value: `${position.uid}-${candidate.uid}`,
                          });
                          return (
                            <CandidateCard key={candidate.id} {...radio}>
                              <Text>{`${candidate.lastName}, ${
                                candidate.firstName
                              }${
                                candidate.middleName &&
                                ` ${candidate.middleName.charAt(0)}.`
                              } (${
                                partylists.find(
                                  (partylist) =>
                                    partylist.uid === candidate.partylist
                                )?.abbreviation
                              })`}</Text>
                            </CandidateCard>
                          );
                        })}
                    </Box>
                    <CandidateCard {...radioUndecided}>
                      <Text>Undecided</Text>
                    </CandidateCard>
                  </Box>
                );
              })}
          </Box>
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
    collection(firestore, "elections", electionSnapshot.docs[0].id, "positions")
  );
  const positions = positionsSnapshot.docs.map((doc) => doc.data());

  const partylistsSnapshot = await getDocs(
    collection(
      firestore,
      "elections",
      electionSnapshot.docs[0].id,
      "partylists"
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
