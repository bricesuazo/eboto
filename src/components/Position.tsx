import { Button, Flex, Group, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { Position } from "@prisma/client";
import EditPositionModal from "./modals/EditPosition";
import ConfirmDeletePositionModal from "./modals/ConfirmDeletePositionModal";

const PositionCard = ({ position }: { position: Position }) => {
  const [
    openedConfirmDeletePosition,
    { open: openConfirmDeletePosition, close: closeConfirmDeletePosition },
  ] = useDisclosure(false);
  const [
    openedEditPosition,
    { open: openEditPosition, close: closeEditPosition },
  ] = useDisclosure(false);

  return (
    <>
      <ConfirmDeletePositionModal
        isOpen={openedConfirmDeletePosition}
        onClose={closeConfirmDeletePosition}
        position={position}
      />
      <EditPositionModal
        isOpen={openedEditPosition}
        onClose={closeEditPosition}
        position={position}
      />
      <Flex
        direction="column"
        w={172}
        align="center"
        p={8}
        sx={(theme) => ({
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          width: 200,
          height: 128,
          padding: theme.spacing.md,
          border: "1px solid",
          borderColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[5]
              : theme.colors.gray[3],
          borderRadius: theme.radius.md,

          [theme.fn.smallerThan("xs")]: {
            width: "100%",
          },
        })}
      >
        <Title order={4} align="center" w="full" lineClamp={2}>
          {position.name}
        </Title>

        <Group spacing="xs">
          <Button onClick={openEditPosition} variant="light" size="sm" compact>
            Edit
          </Button>
          <Button
            onClick={openConfirmDeletePosition}
            variant="light"
            color="red"
            size="sm"
            compact
          >
            Delete
          </Button>
        </Group>
      </Flex>
    </>
  );
};

export default PositionCard;
