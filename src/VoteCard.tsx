import { UnstyledButton, Text } from "@mantine/core";
import type { Candidate, Partylist } from "@prisma/client";
import { IconUser, IconUserX } from "@tabler/icons-react";
import Image from "next/image";

const VoteCard = ({
  candidate,
  votes,
  setVotes,
  positionId,
}: {
  candidate?: Candidate & {
    partylist: Partylist;
  };
  votes: string[];
  setVotes: React.Dispatch<React.SetStateAction<string[]>>;
  positionId: string;
}) => {
  const isSelected = votes.some(
    (vote) =>
      vote.split("-")[0] === positionId &&
      vote.split("-")[1] === (candidate ? candidate.id : "abstain")
  );

  return (
    <UnstyledButton
      sx={(theme) => ({
        width: candidate ? 180 : 140,
        height: 140,
        padding: theme.spacing.md,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: isSelected
          ? theme.colorScheme === "light"
            ? theme.colors.green[6]
            : theme.colors.green[8]
          : theme.colorScheme === "light"
          ? theme.colors.gray[3]
          : theme.colors.gray[7],
        backgroundColor:
          theme.colorScheme === "light"
            ? isSelected
              ? theme.colors.gray[1]
              : "transparent"
            : isSelected
            ? theme.colors.dark[6]
            : "transparent",
        color: isSelected
          ? theme.colorScheme === "light"
            ? theme.colors.green[6]
            : theme.colors.green[8]
          : theme.colorScheme === "light"
          ? theme.colors.gray[7]
          : theme.colors.gray[3],
        borderRadius: theme.radius.md,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        columnGap: theme.spacing.sm,

        [theme.fn.smallerThan("xs")]: {
          width: "100%",
          height: candidate ? 128 : 80,
          flexDirection: "row",
          justifyContent: "flex-start",
        },
      })}
      onClick={() => {
        if (isSelected) return;

        setVotes((prev) => {
          return prev
            .filter((prev) => prev.split("-")[0] !== positionId)
            .concat(positionId + "-" + (candidate ? candidate.id : "abstain"));
        });
      }}
    >
      {candidate === undefined ? (
        <IconUserX size={80} style={{ padding: 8 }} />
      ) : candidate.image ? (
        <Image
          src={candidate.image}
          alt=""
          width={80}
          height={80}
          style={{
            objectFit: "cover",
          }}
        />
      ) : (
        <IconUser size={80} style={{ padding: 8 }} />
      )}
      <Text
        sx={(theme) => ({
          width: "100%",
          textAlign: "center",
          [theme.fn.smallerThan("xs")]: {
            width: "100%",
            textAlign: "left",
          },
        })}
        truncate
      >
        {candidate
          ? `${candidate.last_name}, ${candidate.first_name}${
              candidate.middle_name
                ? " " + candidate.middle_name.charAt(0) + "."
                : ""
            } (${candidate.partylist.acronym})`
          : "Abstain"}
      </Text>
    </UnstyledButton>
  );
};

export default VoteCard;
