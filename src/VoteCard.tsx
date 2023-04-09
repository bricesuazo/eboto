import { UnstyledButton, Text, Box, Checkbox, Radio } from "@mantine/core";
import type { Candidate, Partylist } from "@prisma/client";
import { IconUser, IconUserQuestion } from "@tabler/icons-react";
import Image from "next/image";
import { useRef } from "react";

const VoteCard = ({
  candidate,
  isSelected,
  value,
  disabled,
  type,
}: {
  type: "radio" | "checkbox";
  value: string;
  disabled?: boolean;
  candidate?: Candidate & {
    partylist: Partylist;
  };
  isSelected: boolean;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      {type === "radio" && (
        <Radio
          value={value}
          ref={ref}
          sx={{
            display: "none",
          }}
          disabled={disabled}
        />
      )}
      {type === "checkbox" && (
        <Checkbox
          ref={ref}
          value={value}
          sx={{
            display: "none",
          }}
          disabled={disabled}
        />
      )}
      <UnstyledButton
        onClick={() => ref.current?.click()}
        disabled={disabled}
        sx={(theme) => ({
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          width: candidate ? 200 : 120,
          opacity: disabled ? 0.5 : 1,
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
    </>
  );
};

export default VoteCard;
