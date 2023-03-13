import {
  Button,
  Group,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import type { Partylist } from "@prisma/client";
import { IconCheck } from "@tabler/icons-react";
import { api } from "../utils/api";
import EditPartylistModal from "./modals/EditPartylist";

const PartylistCard = ({
  partylist,
  refetch,
}: {
  partylist: Partylist;
  refetch: () => Promise<unknown>;
}) => {
  const [opened, { open, close }] = useDisclosure(false);
  const deletePartylistMutation = api.partylist.deleteSingle.useMutation({
    onSuccess: async (data) => {
      await refetch();
      notifications.show({
        title: `${data.name} (${data.acronym}) deleted!`,
        message: "Successfully deleted partylist",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
    },
  });

  return (
    <>
      <EditPartylistModal
        isOpen={opened}
        onClose={close}
        partylist={partylist}
        refetch={refetch}
      />
      <UnstyledButton
        sx={(theme) => ({
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          width: 172,
          height: 100,
          padding: theme.spacing.md,
          border: "1px solid",
          borderColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[5]
              : theme.colors.gray[3],
          borderRadius: 8,

          [theme.fn.smallerThan("xs")]: {
            width: "100%",
          },
        })}
      >
        <Title order={4}>
          {partylist.name} ({partylist.acronym})
        </Title>

        <Group>
          <Button
            disabled={deletePartylistMutation.isLoading}
            onClick={open}
            variant="subtle"
            size="sm"
            compact
          >
            Edit
          </Button>
          <Button
            onClick={() => deletePartylistMutation.mutate(partylist.id)}
            loading={deletePartylistMutation.isLoading}
            variant="subtle"
            color="red"
            size="sm"
            compact
          >
            Delete
          </Button>
        </Group>
      </UnstyledButton>
    </>
  );
};

export default PartylistCard;
