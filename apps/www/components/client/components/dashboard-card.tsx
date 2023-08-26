"use client";

import classes from "@/styles/Dashboard.module.css";
import type { Election } from "@eboto-mo/db/schema";
import {
  ActionIcon,
  Box,
  Center,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useHover } from "@mantine/hooks";
import { IconExternalLink } from "@tabler/icons-react";
import moment from "moment";
import Image from "next/image";
import Link from "next/link";

export default function DashboardCard({
  election,
  type,
  hasVoted,
}: {
  election: Election;
  type: "vote" | "manage";
  hasVoted?: boolean;
}) {
  const { hovered, ref } = useHover<HTMLAnchorElement>();
  return (
    <UnstyledButton
      ref={ref}
      className={classes["card-container"]}
      maw={288}
      w="100%"
      h={400}
      p="md"
      component={Link}
      href={
        type === "vote" ? `/${election.slug}` : `/dashboard/${election.slug}`
      }
      target={type === "vote" ? "_blank" : undefined}
    >
      {type === "vote" && (
        <ActionIcon
          variant="default"
          disabled
          style={{
            position: "absolute",
            top: -12,
            right: -12,
            width: 32,
            height: 32,
            borderRadius: "100%",
            opacity: hovered ? 1 : 0,
            transition: "opacity 100ms ease-in-out",
            pointerEvents: "none",
          }}
        >
          <IconExternalLink size="1rem" />
        </ActionIcon>
      )}

      {election.logo && (
        <Box
          mx="auto"
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1/1",
            // maxWidth: 256,
          }}
        >
          <Image
            src={election.logo}
            alt={election.name + " logo"}
            fill
            sizes="100%"
            style={{
              objectFit: "contain",
            }}
            priority
            blurDataURL={election.logo}
          />
        </Box>
      )}
      <Center style={{ flex: 1 }}>
        <Box>
          <Title
            fw="bold"
            ta="center"
            order={3}
            style={{
              lineClamp: 2,
            }}
            w="100%"
          >
            {election.name}
          </Title>
          <Text size="sm" c="GrayText" ta="center">
            {moment(election.start_date).local().format("MMM DD (hA)")}
            {" - "}
            {moment(election.end_date).local().format("MMM DD (hA)")}
          </Text>

          {/* <Text size="sm" lineClamp={1} c="dimmed" ta="center">
            Publicity:{" "}
            {election.publicity.charAt(0) +
              election.publicity.slice(1).toLowerCase()}
          </Text> */}

          {type === "vote" && (
            <Text size="sm" c="dimmed" lineClamp={1} ta="center">
              {hasVoted ? "You have voted" : "You have not voted"}
            </Text>
          )}
        </Box>
      </Center>
    </UnstyledButton>
  );
}
