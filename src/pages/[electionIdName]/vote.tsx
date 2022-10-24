import { collection, getDocs, query, where } from "firebase/firestore";
import { GetServerSideProps } from "next";
import {
  candidateType,
  electionType,
  partylistType,
  positionType,
} from "../../types/typings";
import { firestore } from "../../firebase/firebase";
import { Box, Button, Text, useRadioGroup } from "@chakra-ui/react";
import CandidateCard from "../../components/CandidateCard";
import { useState } from "react";

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
  const [selectedCandidates, setSelectedCandidates] =
    useState<candidateType[]>();

  return (
    <Box>
      <Box>
        <Text fontSize="3xl">{election.name}</Text>

        <Box>
          {positions
            .sort((a, b) => a.createdAt.seconds - b.createdAt.seconds)
            .map((position) => {
              const { getRootProps, getRadioProps } = useRadioGroup({
                name: position.uid,
                onChange: console.log,
              });
              const group = getRootProps();
              const radioUndecided = getRadioProps({
                value: { type: "undecided", position: position.uid },
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
                        const radio = getRadioProps({ value: candidate.uid });
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

      <Button>Cast Vote</Button>
    </Box>
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
