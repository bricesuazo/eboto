import { Stack, Text, useRadioGroup } from "@chakra-ui/react";
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
    <Stack key={position.id}>
      <Text fontSize="2xl">{position.title}</Text>
      <Stack {...group}>
        {candidates
          .filter((candidate) => candidate.position === position.uid)
          .map((candidate) => {
            const radio = getRadioProps({
              value: `${position.uid}-${candidate.uid}`,
            });
            return (
              <CandidateCard key={candidate.id} {...radio}>
                <Text>{`${candidate.lastName}, ${candidate.firstName}${
                  candidate.middleName && ` ${candidate.middleName.charAt(0)}.`
                } (${
                  partylists.find(
                    (partylist) => partylist.uid === candidate.partylist
                  )?.abbreviation
                })`}</Text>
              </CandidateCard>
            );
          })}
      </Stack>
      <CandidateCard {...radioUndecided}>
        <Text>Undecided</Text>
      </CandidateCard>
    </Stack>
  );
};

export default Card;
