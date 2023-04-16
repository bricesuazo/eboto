import { Button, Flex, Text, Group, Box } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type {
  Achievement,
  Affiliation,
  Candidate,
  Credential,
  EventAttended,
  Partylist,
  Position,
} from "@prisma/client";
import EditCandidateModal from "./modals/EditCandidate";
import { IconUser } from "@tabler/icons-react";
import Image from "next/image";
import ConfirmDeleteCandidateModal from "./modals/ConfirmDeleteCandidateModal";

const CandidateCard = ({
  candidate,
  partylists,
  positions,
}: {
  candidate: Candidate & {
    credential:
      | (Credential & {
          achievements: Achievement[];
          affiliations: Affiliation[];
          eventsAttended: EventAttended[];
        })
      | null;
  };
  partylists: Partylist[];
  positions: Position[];
}) => {
  const [
    openedConfirmDeleteCandidate,
    { open: openConfirmDeleteCandidate, close: closeConfirmDeleteCandidate },
  ] = useDisclosure(false);
  const [
    openedEditCandidate,
    { open: openEditCandidate, close: closeEditCandidate },
  ] = useDisclosure(false);

  return (
    <>
      <ConfirmDeleteCandidateModal
        isOpen={openedConfirmDeleteCandidate}
        onClose={closeConfirmDeleteCandidate}
        candidate={candidate}
      />
      <EditCandidateModal
        isOpen={openedEditCandidate}
        onClose={closeEditCandidate}
        partylists={partylists}
        candidate={candidate}
        positions={positions}
      />

      <Box>
        <Flex
          direction="column"
          h={140}
          p={8}
          align="center"
          justify="space-between"
          sx={(theme) => ({
            width: 200,
            border: "1px solid",
            borderColor:
              theme.colorScheme === "dark"
                ? theme.colors.dark[5]
                : theme.colors.gray[3],
            borderRadius: 8,

            [theme.fn.smallerThan("xs")]: {
              width: 140,
            },
          })}
        >
          <Flex direction="column" align="center">
            {candidate.image ? (
              <Image
                src={candidate.image}
                width={52}
                height={52}
                alt={candidate.first_name}
                priority
              />
            ) : (
              <IconUser
                size={52}
                style={{
                  padding: 8,
                }}
              />
            )}
            <Text align="center" w="full" lineClamp={1}>
              {candidate.first_name} {candidate.last_name}
              {candidate.middle_name ? ` ${candidate.middle_name}` : ""}
            </Text>
          </Flex>

          <Group spacing="xs">
            <Button
              onClick={openEditCandidate}
              variant="light"
              compact
              size="sm"
              w="fit-content"
            >
              Edit
            </Button>
            <Button
              onClick={openConfirmDeleteCandidate}
              variant="light"
              color="red"
              compact
              size="sm"
              w="fit-content"
            >
              Delete
            </Button>
          </Group>
        </Flex>
      </Box>
    </>
  );
};

export default CandidateCard;
