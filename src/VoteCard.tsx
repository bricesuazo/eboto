import { UnstyledButton, Text, Box } from "@mantine/core";
import type { Candidate, Partylist, Position } from "@prisma/client";
import { IconUser, IconUserQuestion } from "@tabler/icons-react";
import Image from "next/image";

const VoteCard = ({
  candidate,
  position,
  setVotesState,
  votesState,
}: {
  candidate?: Candidate & {
    partylist: Partylist;
  };
  position: Position;
  setVotesState: React.Dispatch<
    React.SetStateAction<
      { positionId: string; votes: string[]; min: number; max: number }[]
    >
  >;
  votesState: {
    positionId: string;
    votes: string[];
    min: number;
    max: number;
  }[];
}) => {
  const isSelected = votesState.some(
    (vote) =>
      vote.positionId === position.id &&
      (candidate
        ? vote.votes.includes(candidate.id)
        : vote.votes.includes("abstain"))
  );

  return (
    <UnstyledButton
      onClick={() => {
        if (candidate) {
          if (position.min === 0 && position.max === 1) {
            setVotesState((votes) => {
              const vote = votes.find(
                (vote) => vote.positionId === position.id
              );

              if (vote) {
                vote.votes = [candidate.id];
              } else {
                votes.push({
                  positionId: position.id,
                  votes: [candidate.id],
                  min: position.min,
                  max: position.max,
                });
              }

              return [...votes];
            });
          } else {
            setVotesState((votes) => {
              const vote = votes.find(
                (vote) => vote.positionId === position.id
              );

              if (
                vote &&
                vote.votes.length === position.max &&
                !vote.votes.includes(candidate.id)
              ) {
                return votes;
              }

              if (vote && vote.votes.includes("abstain")) {
                vote.votes = vote.votes.filter((vote) => vote !== "abstain");
              }

              return votes
                .filter((vote) => vote.positionId !== position.id)
                .concat({
                  positionId: position.id,
                  votes: vote
                    ? vote.votes.includes(candidate.id)
                      ? vote.votes.filter((vote) => vote !== candidate.id)
                      : vote.votes.concat(candidate.id)
                    : [candidate.id],
                  min: position.min,
                  max: position.max,
                });
            });
          }
        } else {
          setVotesState((votes) => {
            const vote = votes.find((vote) => vote.positionId === position.id);

            if (vote) {
              vote.votes = ["abstain"];
            } else {
              votes.push({
                positionId: position.id,
                votes: ["abstain"],
                min: position.min,
                max: position.max,
              });
            }

            return [...votes];
          });
        }
      }}
      sx={(theme) => ({
        width: candidate ? 200 : 120,
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
          height: candidate ? 128 : 100,
          flexDirection: "row",
          justifyContent: "flex-start",
        },
      })}
    >
      {candidate === undefined ? (
        <Box>
          <IconUserQuestion size={80} style={{ padding: 8 }} />
        </Box>
      ) : candidate.image ? (
        <Image
          src={candidate.image}
          alt=""
          width={80}
          height={80}
          style={{
            objectFit: "cover",
          }}
          priority
        />
      ) : (
        <Box>
          <IconUser size={80} style={{ padding: 8 }} />
        </Box>
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
        lineClamp={1}
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
