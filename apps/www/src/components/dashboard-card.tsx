"use client";

import Image from "next/image";
import Link from "next/link";
import classes from "@/styles/Dashboard.module.css";
import {
  ActionIcon,
  Box,
  Center,
  Flex,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useHover } from "@mantine/hooks";
import {
  IconCheck,
  IconExternalLink,
  IconLock,
  IconUsersGroup,
  IconWorldWww,
  IconX,
} from "@tabler/icons-react";
import moment from "moment";

import { parseHourTo12HourFormat } from "@eboto/constants";
import type { Election } from "@eboto/db/schema";

export default function DashboardCard({
  election,
  type,
  hasVoted,
  is_free,
}: {
  election: Election;
  type: "vote" | "manage";
  hasVoted?: boolean;
  is_free?: boolean;
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
      style={{
        borderColor:
          is_free === false && type === "manage"
            ? "var(--mantine-color-green-5)"
            : undefined,
      }}
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
            src={election.logo.url}
            alt={election.name + " logo"}
            fill
            sizes="100%"
            style={{
              objectFit: "cover",
            }}
            priority
            blurDataURL={election.logo.url}
          />
          <Flex
            gap="xs"
            style={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%) translateY(50%)",
            }}
          >
            <HoverCard width={200} openDelay={200} closeDelay={0}>
              <HoverCardTarget>
                <Box
                  style={{
                    display: "grid",
                    placeItems: "center",
                    background: "var(--mantine-color-green-filled)",
                    borderRadius: "100%",
                    width: 48,
                    height: 48,
                  }}
                >
                  {(() => {
                    switch (election.publicity) {
                      case "PRIVATE":
                        return <IconLock color="white" />;
                      case "VOTER":
                        return <IconUsersGroup color="white" />;
                      case "PUBLIC":
                        return <IconWorldWww color="white" />;
                    }
                  })()}
                </Box>
              </HoverCardTarget>
              <HoverCardDropdown>
                <Text size="sm">
                  Publicity:{" "}
                  {(() => {
                    switch (election.publicity) {
                      case "PRIVATE":
                        return "Private (Only commissioners can see this election)";
                      case "VOTER":
                        return "Voter (Only commissioners and voters can see this election)";
                      case "PUBLIC":
                        return "Public (Everyone can see this election)";
                    }
                  })()}
                </Text>
              </HoverCardDropdown>
            </HoverCard>
            {type === "vote" && (
              <HoverCard width={200} openDelay={200} closeDelay={0}>
                <HoverCardTarget>
                  <Box
                    style={{
                      display: "grid",
                      placeItems: "center",
                      backgroundColor: hasVoted
                        ? "var(--mantine-color-green-filled)"
                        : "var(--mantine-color-red-filled)",
                      borderRadius: "100%",
                      width: 48,
                      height: 48,
                    }}
                  >
                    {hasVoted ? (
                      <IconCheck color="white" />
                    ) : (
                      <IconX color="white" />
                    )}
                  </Box>
                </HoverCardTarget>
                <HoverCardDropdown>
                  <Text size="sm">
                    {hasVoted
                      ? "You have voted in this election"
                      : "You have not voted in this election"}
                  </Text>
                </HoverCardDropdown>
              </HoverCard>
            )}
          </Flex>
        </Box>
      )}
      <Center style={{ flex: 1 }}>
        <Box>
          {!election.logo && (
            <Flex gap="xs" justify="center" mb="sm">
              <HoverCard width={200} openDelay={200} closeDelay={0}>
                <HoverCardTarget>
                  <Box
                    style={{
                      display: "grid",
                      placeItems: "center",
                      background: "var(--mantine-color-green-filled)",
                      borderRadius: "100%",
                      width: 48,
                      height: 48,
                    }}
                  >
                    {(() => {
                      switch (election.publicity) {
                        case "PRIVATE":
                          return <IconLock color="white" />;
                        case "VOTER":
                          return <IconUsersGroup color="white" />;
                        case "PUBLIC":
                          return <IconWorldWww color="white" />;
                      }
                    })()}
                  </Box>
                </HoverCardTarget>
                <HoverCardDropdown>
                  <Text size="sm">
                    Publicity:{" "}
                    {(() => {
                      switch (election.publicity) {
                        case "PRIVATE":
                          return "Private (Only commissioners can see this election)";
                        case "VOTER":
                          return "Voter (Only commissioners and voters can see this election)";
                        case "PUBLIC":
                          return "Public (Everyone can see this election)";
                      }
                    })()}
                  </Text>
                </HoverCardDropdown>
              </HoverCard>
              {type === "vote" && (
                <HoverCard width={200} openDelay={200} closeDelay={0}>
                  <HoverCardTarget>
                    <Box
                      style={{
                        display: "grid",
                        placeItems: "center",
                        backgroundColor: hasVoted
                          ? "var(--mantine-color-green-filled)"
                          : "var(--mantine-color-red-filled)",
                        borderRadius: "100%",
                        width: 48,
                        height: 48,
                      }}
                    >
                      {hasVoted ? (
                        <IconCheck color="white" />
                      ) : (
                        <IconX color="white" />
                      )}
                    </Box>
                  </HoverCardTarget>
                  <HoverCardDropdown>
                    <Text size="sm">
                      {hasVoted
                        ? "You have voted in this election"
                        : "You have not voted in this election"}
                    </Text>
                  </HoverCardDropdown>
                </HoverCard>
              )}
            </Flex>
          )}

          <Text fw="bold" ta="center" fz="xl" lineClamp={2} lh="xs" w="100%">
            {election.name}
          </Text>
          <Text size="sm" c="GrayText" ta="center">
            {moment(election.start_date).local().format("MMM DD, YYYY")}
            {" - "}
            {moment(election.end_date).local().format("MMM DD, YYYY")}
          </Text>
          <Text size="sm" c="GrayText" ta="center">
            {election.voting_hour_start === 0 && election.voting_hour_end === 24
              ? "Whole day"
              : parseHourTo12HourFormat(election.voting_hour_start) +
                " - " +
                parseHourTo12HourFormat(election.voting_hour_end)}
          </Text>
        </Box>
      </Center>
    </UnstyledButton>
  );
}
