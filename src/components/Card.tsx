import {
  Box,
  Center,
  Container,
  HStack,
  Stack,
  Text,
  useRadioGroup,
} from "@chakra-ui/react";
import Image from "next/image";
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
      <Text fontSize="xl" fontWeight="bold" textAlign="center">
        {position.title}
      </Text>
      <Container maxW="4xl">
        <HStack {...group} overflowX="auto" paddingX={4} paddingY={2}>
          {candidates
            .filter((candidate) => candidate.position === position.uid)
            .map((candidate) => {
              const radio = getRadioProps({
                value: `${position.uid}-${candidate.uid}`,
              });
              return (
                <CandidateCard key={candidate.id} {...radio}>
                  <Box
                    position="relative"
                    width="10rem"
                    height="10rem"
                    pointerEvents="none"
                  >
                    <Image
                      src={
                        candidate.photoUrl
                          ? candidate.photoUrl
                          : "/assets/images/default-profile-picture.png"
                      }
                      alt={`${candidate.firstName}${
                        candidate.middleName && ` ${candidate.middleName}`
                      } ${candidate.lastName} photo`}
                      fill
                      sizes="contain"
                      priority
                      style={{ objectFit: "cover" }}
                    />
                  </Box>
                  <Text textAlign="center">{`${candidate.lastName}, ${
                    candidate.firstName
                  }${
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
            <Box
              position="relative"
              width="10rem"
              height="10rem"
              pointerEvents="none"
            >
              <Image
                src="/assets/images/undecided.jpg"
                alt="Undecided photo"
                fill
                sizes="contain"
                priority
                style={{ objectFit: "cover" }}
              />
            </Box>
            <Text textAlign="center">Undecided</Text>
          </CandidateCard>
        </HStack>
      </Container>
    </Stack>
  );
};

export default Card;
