"use client";

import toWords from "@/utils/toWords";
import type { Candidate, Partylist, Position } from "@eboto-mo/db/schema";
import {
  Box,
  Button,
  Center,
  Checkbox,
  CheckboxGroup,
  Group,
  Modal,
  Radio,
  RadioGroup,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useColorScheme, useDisclosure } from "@mantine/hooks";
import {
  IconFingerprint,
  IconUser,
  IconUserQuestion,
} from "@tabler/icons-react";
import Image from "next/image";
import { useRef } from "react";

export default function VoteForm({
  positions,
}: {
  positions: (Position & {
    candidates: (Candidate & {
      partylist: Partylist;
    })[];
  })[];
}) {
  const form = useForm<
    Record<
      string,
      {
        votes: string[];
        min: number;
        max: number;
        isValid: boolean;
      }
    >
  >({
    initialValues: Object.fromEntries(
      positions.map((position) => [
        position.id,
        {
          votes: [],
          min: position.min,
          max: position.max,
          isValid: false,
        },
      ]),
    ),
  });

  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title={<Text fw={600}>Confirm Vote</Text>}
      >
        <form
          onSubmit={form.onSubmit((values) => {
            console.log(
              "🚀 ~ file: vote-form.tsx:60 ~ onSubmit={form.onSubmit ~ values:",
              values,
            );
            // voteMutation.mutate({
            //   electionId: election.id,
            //   votes: Object.entries(values).map(([key, value]) => ({
            //     positionId: key,
            //     votes: value.votes,
            //   })),
            // });
          })}
        >
          <Stack>
            {positions.map((position) => {
              return (
                <Box key={position.id}>
                  <Text lineClamp={1}>{position.name}</Text>
                  <Text lineClamp={1} size="xs" c="dimmed">
                    {position.min === 0 && position.max === 1
                      ? `One selection only (1)`
                      : `${
                          position.min
                            ? `At least ${toWords
                                .convert(position.min)
                                .toLowerCase()} and a`
                            : " A"
                        }t most ${toWords
                          .convert(position.max)
                          .toLowerCase()} (${position.min} - ${position.max})`}
                  </Text>
                  {Object.entries(form.values)
                    .find(([key]) => key === position.id)?.[1]
                    .votes.map((candidateId) => {
                      const candidate = position.candidates.find(
                        (candidate) => candidate.id === candidateId,
                      );

                      return (
                        <Text
                          key={candidateId}
                          fw={600}
                          lineClamp={2}
                          c="gray.500"
                          size="lg"
                        >
                          {candidate
                            ? `${candidate.last_name}, ${candidate.first_name}${
                                candidate.middle_name
                                  ? " " + candidate.middle_name.charAt(0) + "."
                                  : ""
                              } (${candidate.partylist.acronym})`
                            : "Abstain"}
                        </Text>
                      );
                    })}
                </Box>
              );
            })}

            {/* {voteMutation.isError && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                title="Error"
                color="red"
              >
                {voteMutation.error.message}
              </Alert>
            )}
            <Group justify="right" gap="xs">
              <Button
                variant="default"
                onClick={close}
                disabled={voteMutation.isLoading}
              >
                Cancel
              </Button>
              <Button
                loading={voteMutation.isLoading}
                // onClick={() => {
                //   voteMutation.mutate({
                //     electionId: election.id,
                //     votes:
                //   });
                // }}
                type="submit"
              >
                Confirm
              </Button>
            </Group> */}
          </Stack>
        </form>
      </Modal>
      <form>
        <Stack>
          {positions.map((position) => {
            return (
              <Box key={position.id}>
                <Text size="xl">{position.name}</Text>
                <Text size="sm" c="grayText">
                  {position.min === 0 && position.max === 1
                    ? "Select only one."
                    : `Select ${
                        position.min
                          ? `at least ${toWords
                              .convert(position.min)
                              .toLowerCase()} and `
                          : ""
                      }at most ${toWords
                        .convert(position.max)
                        .toLowerCase()}. (${
                        position.min ? `${position.min} - ` : ""
                      }${position.max})`}
                </Text>

                <Group>
                  {position.min === 0 && position.max === 1 ? (
                    <RadioGroup
                      onChange={(e) => {
                        form.setFieldValue(position.id, {
                          votes: [e],
                          min: position.min,
                          max: position.max,
                          isValid: true,
                        });
                      }}
                    >
                      <Group mt="xs">
                        {position.candidates.map((candidate) => (
                          <VoteCard
                            isSelected={
                              form.values[position.id]?.votes.includes(
                                candidate.id,
                              ) ?? false
                            }
                            candidate={candidate}
                            type="radio"
                            key={candidate.id}
                            value={candidate.id}
                          />
                        ))}
                        <VoteCard
                          type="radio"
                          isSelected={
                            form.values[position.id]?.votes.includes(
                              "abstain",
                            ) ?? false
                          }
                          value="abstain"
                        />
                      </Group>
                    </RadioGroup>
                  ) : (
                    <CheckboxGroup
                      onChange={(e) => {
                        const votes = e.includes("abstain")
                          ? form.values[position.id]?.votes.includes("abstain")
                            ? e.filter((e) => e !== "abstain")
                            : ["abstain"]
                          : e;

                        form.setFieldValue(position.id, {
                          votes,
                          min: position.min,
                          max: position.max,
                          isValid:
                            votes.length !== 0 &&
                            ((votes.includes("abstain") &&
                              votes.length === 1) ||
                              (votes.length >= position.min &&
                                votes.length <= position.max)),
                        });
                      }}
                      value={form.values[position.id]?.votes}
                    >
                      <Group mt="xs">
                        {position.candidates.map((candidate) => {
                          return (
                            <VoteCard
                              type="checkbox"
                              candidate={candidate}
                              isSelected={
                                form.values[position.id]?.votes.includes(
                                  candidate.id,
                                ) ?? false
                              }
                              value={candidate.id}
                              disabled={
                                (form.values[position.id]?.votes.length ?? 0) >=
                                  position.max &&
                                !form.values[position.id]?.votes.includes(
                                  candidate.id,
                                )
                              }
                              key={candidate.id}
                            />
                          );
                        })}
                        <VoteCard
                          type="checkbox"
                          isSelected={
                            form.values[position.id]?.votes.includes(
                              "abstain",
                            ) ?? false
                          }
                          value="abstain"
                        />
                      </Group>
                    </CheckboxGroup>
                  )}
                </Group>
              </Box>
            );
          })}
        </Stack>

        <Center
          style={{
            position: "sticky",
            bottom: 100,
            alignSelf: "center",
            marginTop: 12,
            marginBottom: 100,
          }}
        >
          <Button
            onClick={open}
            disabled={
              // voteMutation.isLoading ??
              !Object.values(form.values).every((value) => value?.isValid)
            }
            leftSection={<IconFingerprint />}
            size="lg"
            radius="xl"
          >
            Cast Vote
          </Button>
        </Center>
      </form>
    </>
  );
}

function VoteCard({
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
}) {
  const ref = useRef<HTMLInputElement>(null);
  const colorScheme = useColorScheme();
  return (
    <>
      {type === "radio" && (
        <Radio
          value={value}
          ref={ref}
          style={{
            display: "none",
          }}
          disabled={disabled}
        />
      )}
      {type === "checkbox" && (
        <Checkbox
          ref={ref}
          value={value}
          style={{
            display: "none",
          }}
          disabled={disabled}
        />
      )}
      <UnstyledButton
        onClick={() => ref.current?.click()}
        disabled={disabled}
        w={{ base: "100%", sm: 140 }}
        h="auto"
        style={(theme) => ({
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          width: candidate ? 200 : 120,
          opacity: disabled ? 0.5 : 1,
          padding: theme.spacing.md,
          borderWidth: 2,
          borderStyle: "solid",
          borderColor: isSelected
            ? colorScheme === "light"
              ? theme.colors.green[6]
              : theme.colors.green[8]
            : colorScheme === "light"
            ? theme.colors.gray[3]
            : theme.colors.gray[7],
          backgroundColor:
            colorScheme === "light"
              ? isSelected
                ? theme.colors.gray[1]
                : "transparent"
              : isSelected
              ? theme.colors.dark[6]
              : "transparent",
          color: isSelected
            ? colorScheme === "light"
              ? theme.colors.green[6]
              : theme.colors.green[8]
            : colorScheme === "light"
            ? theme.colors.gray[7]
            : theme.colors.gray[3],
          borderRadius: theme.radius.md,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          columnGap: theme.spacing.sm,
        })}
      >
        {candidate === undefined ? (
          <Box>
            <IconUserQuestion size={80} style={{ padding: 8 }} />
          </Box>
        ) : candidate.image_link ? (
          <Image
            src={candidate.image_link}
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
        <Text w="100%" ta={{ base: "left", sm: "center" }} lineClamp={1}>
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
}
