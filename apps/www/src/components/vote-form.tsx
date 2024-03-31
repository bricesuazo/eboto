"use client";

import { useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useConfetti } from "@/components/providers";
import { api } from "@/trpc/client";
import toWords from "@/utils/toWords";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Divider,
  Group,
  List,
  ListItem,
  Modal,
  Radio,
  RadioGroup,
  Stack,
  Text,
  UnstyledButton,
  useMantineColorScheme,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconFingerprint,
  IconUser,
  IconUserQuestion,
  IconX,
} from "@tabler/icons-react";

import { formatName } from "@eboto/constants";

import type { Database } from "../../../../supabase/types";

export default function VoteForm({
  positions,
  election,
}: {
  election: Database["public"]["Tables"]["elections"]["Row"];
  positions: (Database["public"]["Tables"]["positions"]["Row"] & {
    candidates: (Database["public"]["Tables"]["candidates"]["Row"] & {
      partylist: Database["public"]["Tables"]["partylists"]["Row"];
    })[];
  })[];
}) {
  const positionsQuery = api.election.getElectionVoting.useQuery(election.id, {
    initialData: positions,
  });
  const router = useRouter();
  const { fireConfetti } = useConfetti();
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
      positionsQuery.data.map((position) => [
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

  const voteMutation = api.election.vote.useMutation({
    onSuccess: () => {
      router.push(`/${election.slug}/realtime`);
      notifications.show({
        title: "Vote casted successfully!",
        message: "You can now view the realtime results",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      fireConfetti();
    },
    onError: () => {
      notifications.show({
        title: "Error casting vote",
        message: voteMutation.error?.message,
        icon: <IconX size="1.1rem" />,
        color: "red",
        autoClose: 5000,
      });
    },
  });
  return (
    <>
      <Modal
        opened={opened || voteMutation.isPending}
        onClose={close}
        title={<Text fw={600}>Confirm Vote</Text>}
      >
        <form
          onSubmit={form.onSubmit((values) => {
            voteMutation.mutate({
              election_id: election.id,
              votes: Object.entries(values).map(([key, value]) => ({
                position_id: key,
                votes:
                  value.votes[0] === "abstain"
                    ? { isAbstain: true }
                    : {
                        isAbstain: false,
                        candidates: value.votes,
                      },
              })),
            });
          })}
        >
          <Stack>
            <Box>
              {positionsQuery.data.map((position, index) => (
                <Box key={position.id}>
                  <Text lineClamp={1}>{position.name}</Text>
                  <List listStyleType="none">
                    {Object.entries(form.values)
                      .find(([key]) => key === position.id)?.[1]
                      .votes.map((candidateId) => {
                        const candidate = position.candidates.find(
                          (candidate) => candidate.id === candidateId,
                        );

                        return candidate ? (
                          <ListItem
                            key={candidateId}
                            fw={600}
                            fz="lg"
                            style={{ lineClamp: 2 }}
                          >
                            {formatName(
                              election.name_arrangement,
                              candidate,
                              true,
                            )}{" "}
                            ({candidate.partylist.acronym})
                          </ListItem>
                        ) : (
                          <ListItem key={candidateId} fw={600} fz="lg">
                            Abstain
                          </ListItem>
                        );
                      })}
                  </List>

                  {index !== positionsQuery.data.length - 1 && (
                    <Divider my="sm" />
                  )}
                </Box>
              ))}
            </Box>

            {voteMutation.isError && (
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
                disabled={voteMutation.isPending}
              >
                Cancel
              </Button>
              <Button loading={voteMutation.isPending} type="submit">
                Confirm
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
      <form style={{ marginBottom: 80 }}>
        <Stack>
          {positionsQuery.data.map((position) => {
            return (
              <Box key={position.id}>
                <Box
                  py="xs"
                  style={{
                    position: "sticky",
                    top: 60,
                    backgroundColor: "var(--mantine-color-body)",
                  }}
                >
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
                </Box>

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
                      <Group>
                        {position.candidates.map((candidate) => (
                          <VoteCard
                            isSelected={
                              form.values[position.id]?.votes.includes(
                                candidate.id,
                              ) ?? false
                            }
                            // TODO: fix this when storage is implemented
                            candidate={{ ...candidate, image_url: null }}
                            type="radio"
                            key={candidate.id}
                            value={candidate.id}
                            name_arrangement={election.name_arrangement}
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
                          name_arrangement={election.name_arrangement}
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
                      <Group>
                        {position.candidates.map((candidate) => {
                          return (
                            <VoteCard
                              type="checkbox"
                              // TODO: fix this when storage is implemented
                              candidate={{ ...candidate, image_url: null }}
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
                              name_arrangement={election.name_arrangement}
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
                          name_arrangement={election.name_arrangement}
                        />
                      </Group>
                    </CheckboxGroup>
                  )}
                </Group>
              </Box>
            );
          })}
        </Stack>

        <Button
          onClick={open}
          disabled={
            voteMutation.isPending ||
            !Object.values(form.values).every((value) => value?.isValid)
          }
          leftSection={<IconFingerprint />}
          size="lg"
          radius="xl"
          style={{
            position: "fixed",
            bottom: 100,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          Cast Vote
        </Button>
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
  name_arrangement,
}: {
  type: "radio" | "checkbox";
  value: string;
  disabled?: boolean;
  candidate?: Database["public"]["Tables"]["candidates"]["Row"] & {
    image_url: string | null;
    partylist: Database["public"]["Tables"]["partylists"]["Row"];
  };
  isSelected: boolean;
  name_arrangement: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const { colorScheme } = useMantineColorScheme();
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
          backgroundColor: isSelected
            ? colorScheme === "light"
              ? theme.colors.gray[1]
              : theme.colors.dark[5]
            : "transparent",
          color: isSelected
            ? colorScheme === "light"
              ? theme.colors.green[6]
              : theme.colors.green[8]
            : theme.colors.gray[6],
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
        ) : candidate.image_url ? (
          <Image
            src={candidate.image_url}
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
        {candidate ? (
          <Text
            w="100%"
            ta={{ base: "left", sm: "center" }}
            lineClamp={2}
            h={50}
          >
            {formatName(name_arrangement, candidate, true)} (
            {candidate.partylist.acronym})
          </Text>
        ) : (
          <Text w="100%" ta="center" lineClamp={2}>
            Abstain
          </Text>
        )}
      </UnstyledButton>
    </>
  );
}
