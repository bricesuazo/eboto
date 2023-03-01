import { Flex, Text, useRadioGroup } from "@chakra-ui/react";
import type { Candidate, Partylist, Position } from "@prisma/client";
import VotingCandidate from "./VotingCandidate";

const VotingPosition = ({
  position,
  candidates,
  partylists,
  setSelectedCandidates,
}: {
  position: Position;
  candidates: Candidate[];
  partylists: Partylist[];
  setSelectedCandidates: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const { getRootProps, getRadioProps } = useRadioGroup({
    name: position.id,
    onChange: (value) => {
      setSelectedCandidates((prev) => {
        return prev
          .filter((prev) => prev.split("-")[0] !== position.id)
          .concat(value);
      });
    },
  });
  const group = getRootProps();
  const radioAbstain = getRadioProps({
    value: `${position.id}-abstain`,
  });
  return (
    <>
      <Text fontSize="xl" fontWeight="medium">
        {position.name}
      </Text>

      <Flex flexWrap="wrap" {...group}>
        {candidates
          .filter((candidate) => candidate.positionId === position.id)
          .map((candidate) => {
            const radio = getRadioProps({
              value: `${position.id}-${candidate.id}`,
            });

            const partylist = partylists.find(
              (partylist) => partylist.id === candidate.partylistId
            );
            return (
              <VotingCandidate key={candidate.id} {...radio}>
                {/* <Box
                  position="relative"
                  width={[32, 40]}
                  height={[32, 40]}
                  pointerEvents="none"
                  borderRadius="md"
                  overflow="hidden"
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
                </Box> */}
                <Text
                  textAlign="center"
                  noOfLines={2}
                  fontSize={["sm", "inherit"]}
                >{`${candidate.last_name}, ${candidate.first_name}${
                  candidate.middle_name ? ` ${candidate.middle_name}` : ""
                }${partylist ? ` (${partylist.acronym})` : ""}`}</Text>
              </VotingCandidate>
            );
          })}
        <VotingCandidate {...radioAbstain}>
          {/* <Box
            position="relative"
            width={[32, 40]}
            height={[32, 40]}
            pointerEvents="none"
            borderRadius="md"
            overflow="hidden"
          >
            <Image
              src="/assets/images/abstain.jpg"
              alt="Abstain photo"
              fill
              sizes="contain"
              priority
              style={{ objectFit: "cover" }}
            />
          </Box> */}
          <Text textAlign="center">Abstain</Text>
        </VotingCandidate>
      </Flex>
    </>
  );
};

export default VotingPosition;
