"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Flex,
  Modal,
  NumberFormatter,
  Select,
  Slider,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconRocket } from "@tabler/icons-react";

import { PRICING } from "@eboto/constants";

import { useStore } from "~/store";
import { api } from "~/trpc/client";
import KeyFeatures from "../key-features";

export default function ElectionBoost({
  value: initialValue,
}: {
  value?: number;
}) {
  const router = useRouter();
  const userQuery = api.auth.getUser.useQuery();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const store = useStore();
  const electionsQuery = api.election.getAllMyElections.useQuery(undefined, {
    enabled: !!userQuery.data && store.electionBoost,
  });

  const boostMutation = api.payment.boost.useMutation({
    onSuccess: (url) => {
      if (!url) return;

      setIsRedirecting(true);
      router.push(url);
    },
    onError: (error) => {
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
        autoClose: 3000,
      });
    },
  });

  const form = useForm<{
    election_id?: string;
    price: number;
  }>({
    initialValues: {
      price: initialValue ?? 0,
    },
    validate: {
      election_id: (value) => {
        if (!value?.length) {
          return "Election is required";
        }
      },
      price: (value) => {
        if (value < 0 || value > 100) {
          return "Invalid price";
        }
      },
    },
  });

  useEffect(() => {
    if (!store.electionBoostElectionId) return;

    form.setFieldValue("election_id", store.electionBoostElectionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.electionBoostElectionId]);
  useEffect(() => {
    form.setFieldValue("price", ((initialValue ?? 0) / 20) * 25);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  useEffect(() => {
    if (store.electionBoost) {
      boostMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.electionBoost]);

  const PRICING_WITHOUT_UNLI = PRICING.slice(0, 5).map((item, index) => ({
    ...item,
    value: 25 * index,
  }));

  return (
    <Modal
      opened={store.electionBoost || boostMutation.isPending || isRedirecting}
      onClose={() => store.toggleElectionBoost(false)}
      title={<Text fw={600}>Get Your Election Boosted!</Text>}
    >
      <form
        onSubmit={form.onSubmit((values) =>
          values.election_id
            ? boostMutation.mutate({
                election_id: values.election_id,
                price: values.price,
              })
            : undefined,
        )}
      >
        <Flex direction="column" align="center" justify="center">
          <Title>
            <NumberFormatter
              prefix="₱ "
              value={
                499 +
                (PRICING_WITHOUT_UNLI.find(
                  (item) => item.value === form.values.price,
                )?.price_added ?? 0)
              }
              fixedDecimalScale
              decimalScale={2}
            />
          </Title>
          <Text>
            with up to{" "}
            <NumberFormatter
              value={
                PRICING_WITHOUT_UNLI.find(
                  (item) => item.value === form.values.price,
                )?.label
              }
              thousandSeparator
            />{" "}
            voters
          </Text>
        </Flex>

        <Slider
          px={{ xs: "xl" }}
          mt="xl"
          mb="md"
          thumbSize={20}
          step={25}
          label={(value) => (
            <NumberFormatter
              value={
                PRICING_WITHOUT_UNLI.find((item) => item.value === value)?.label
              }
              thousandSeparator
            />
          )}
          marks={PRICING_WITHOUT_UNLI.map((item) => ({
            value: item.value,
          }))}
          {...form.getInputProps("price")}
        />

        <Box w="fit-content" mb="xl" mx="auto">
          <KeyFeatures isModal />
        </Box>

        <Stack gap="sm">
          <Select
            label="Election"
            ta="center"
            placeholder="Select election"
            withAsterisk
            size="md"
            data={
              electionsQuery.data?.map(({ election }) => ({
                value: election.id,
                label: election.name,
              })) ?? []
            }
            disabled={electionsQuery.isLoading || boostMutation.isPending}
            {...form.getInputProps("election_id")}
          />

          {boostMutation.isError && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              title="Error"
              color="red"
            >
              {boostMutation.error.message}
            </Alert>
          )}
          <Flex mt="xl" direction="column" align="center" gap="xs">
            <Button
              type="submit"
              variant="gradient"
              size="xl"
              radius="xl"
              disabled={!form.isValid() || isRedirecting}
              loading={boostMutation.isPending}
              rightSection={
                !isRedirecting ? <IconRocket size="1.75rem" /> : undefined
              }
            >
              {isRedirecting ? "Redirecting..." : "Get Boost!"}
            </Button>
            <Button
              variant="subtle"
              radius="xl"
              onClick={
                boostMutation.isPending || isRedirecting
                  ? undefined
                  : () => store.toggleElectionBoost(false)
              }
              disabled={boostMutation.isPending || isRedirecting}
            >
              Close
            </Button>
          </Flex>
        </Stack>
      </form>
    </Modal>
  );
}
