import { UnstyledButton, Box, Group, Text } from "@mantine/core";
import type { Election } from "@prisma/client";
import { IconFingerprint } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import Moment from "react-moment";

const DashboardCard = ({
  election,
  type,
}: {
  election: Election;
  type: "vote" | "manage";
}) => {
  return (
    <UnstyledButton
      component={Link}
      href={
        type === "vote" ? `/${election.slug}` : `/dashboard/${election.slug}`
      }
      key={election.id}
      target={type === "vote" ? "_blank" : undefined}
      sx={(theme) => ({
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        width: 264,
        height: 72,
        borderRadius: theme.radius.md,
        padding: theme.spacing.sm,
        backgroundColor:
          theme.colorScheme === "dark"
            ? theme.colors.dark[6]
            : theme.colors.gray[1],

        [theme.fn.smallerThan("xs")]: { width: "100%" },

        "&:focus": {
          boxShadow: `0 0 0 2px ${theme.primaryColor}`,
        },

        "&:hover": {
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[5]
              : theme.colors.gray[0],
        },
      })}
    >
      <Group spacing="xs" w="100%">
        {election.logo ? (
          <Image
            src={election.logo}
            alt={election.name + " logo"}
            width={40}
            height={40}
          />
        ) : (
          <IconFingerprint size={40} />
        )}
        <Box w="75%">
          <Text weight="bold" truncate>
            {election.name}
          </Text>
          <Text size="sm" color="GrayText" truncate>
            <Moment format="MMM D, YYYY">{election.start_date}</Moment>
            {" - "}
            <Moment format="MMM D, YYYY">{election.end_date}</Moment>
          </Text>
        </Box>
      </Group>
    </UnstyledButton>
  );
};

export default DashboardCard;
