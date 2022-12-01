import { Container, Stack, Text, useRadioGroup } from "@chakra-ui/react";
import { candidateType, partylistType, positionType } from "../types/typings";
import CandidateCard from "./CandidateCard";

interface CardProps {
  position: positionType;
  setSelectedCandidates: React.Dispatch<React.SetStateAction<string[]>>;
  candidates: candidateType[];
  partylists: partylistType[];
}

const Card = ({
  position,
  setSelectedCandidates,
  candidates,
  partylists,
}: CardProps) => {
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
    <Stack key={position.id} alignItems="center">
      <Text fontSize="xl">{position.title}</Text>
      <Container padding={0}>
        <Stack
          {...group}
          direction={["column", "row"]}
          overflowX="auto"
          paddingX={4}
          paddingY={2}
          width="full"
        >
          {candidates
            .filter((candidate) => candidate.position === position.uid)
            .map((candidate) => {
              const radio = getRadioProps({
                value: `${position.uid}-${candidate.uid}`,
              });
              return (
                <CandidateCard key={candidate.id} {...radio}>
                  <Text>{`${candidate.lastName}, ${candidate.firstName}${
                    candidate.middleName &&
                    ` ${candidate.middleName.charAt(0)}.`
                  } (${
                    partylists.find(
                      (partylist) => partylist.uid === candidate.partylist
                    )?.abbreviation
                  })`}</Text>
                </CandidateCard>
              );
            })}
          <CandidateCard {...radioUndecided}>
            <Text>Undecided</Text>
          </CandidateCard>
        </Stack>
      </Container>
    </Stack>
  );
};

export default Card;
