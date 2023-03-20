import { Button, Flex, Text, Group, Box } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import type { Candidate, Partylist, Position } from "@prisma/client";
import { api } from "../utils/api";
import EditCandidateModal from "./modals/EditCandidate";
import { IconCheck, IconUser } from "@tabler/icons-react";
import Image from "next/image";

const CandidateCard = ({
  candidate,
  refetch,
  partylists,
  positions,
}: {
  candidate: Candidate;
  refetch: () => Promise<unknown>;
  partylists: Partylist[];
  positions: Position[];
}) => {
  const [opened, { open, close }] = useDisclosure(false);
  const deletePositionMutation = api.candidate.deleteSingle.useMutation({
    onSuccess: async (data) => {
      await refetch();
      notifications.show({
        title: `${data.first_name} ${data.last_name} deleted!`,
        message: "Successfully deleted candidate",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
    },
  });

  return (
    <>
      <EditCandidateModal
        isOpen={opened}
        onClose={close}
        partylists={partylists}
        candidate={candidate}
        refetch={refetch}
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
              onClick={open}
              variant="light"
              compact
              size="sm"
              w="fit-content"
            >
              Edit
            </Button>
            <Button
              onClick={() => deletePositionMutation.mutate(candidate.id)}
              loading={deletePositionMutation.isLoading}
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
