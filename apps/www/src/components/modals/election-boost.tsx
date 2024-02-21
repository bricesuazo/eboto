"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/client";
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
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle } from "@tabler/icons-react";
import { useSession } from "next-auth/react";

import { PRICING } from "@eboto/constants";

import KeyFeatures from "../key-features";

export default function ElectionBoost({
  value: initialValue,
}: {
  value: number;
}) {
  const router = useRouter();
  const session = useSession();
  const [opened, { open, close }] = useDisclosure(false);
  const electionsQuery = api.election.getAllMyElections.useQuery(undefined, {
    enabled: session.status === "authenticated" && opened,
  });

  const boostMutation = api.payment.boost.useMutation({
    onSuccess: (url) => router.push(url),
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
      price: initialValue,
    },
    validate: {
      election_id: (value) => {
        if (!value ?? !value?.length) {
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
    form.setFieldValue("price", (initialValue / 20) * 25);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  useEffect(() => {
    if (opened) {
      boostMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const PRICING_WITHOUT_UNLI = PRICING.slice(0, 5).map((item, index) => ({
    ...item,
    value: 25 * index,
  }));

  return (
    <>
      {form.values.price > 100 ? (
        <Button
          size="lg"
          radius="xl"
          variant="gradient"
          w="100%"
          disabled={boostMutation.isPending}
          component={Link}
          href="/contact"
        >
          Contact us
        </Button>
      ) : session.status === "authenticated" ? (
        <Button
          size="lg"
          radius="xl"
          variant="gradient"
          w="100%"
          onClick={open}
          disabled={boostMutation.isPending}
        >
          Get Boost
        </Button>
      ) : (
        <Button
          size="lg"
          radius="xl"
          variant="gradient"
          w="100%"
          disabled={boostMutation.isPending || session.status === "loading"}
          component={Link}
          href="/sign-in"
          loading={session.status === "loading"}
        >
          Get Boost
        </Button>
      )}

      <Modal
        opened={opened || boostMutation.isPending}
        onClose={close}
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
                  PRICING_WITHOUT_UNLI.find((item) => item.value === value)
                    ?.label
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
                disabled={!form.isValid()}
                loading={boostMutation.isPending}
              >
                Get boost!
              </Button>
              <Button
                variant="default"
                radius="xl"
                onClick={close}
                disabled={boostMutation.isPending}
              >
                Close
              </Button>
            </Flex>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
