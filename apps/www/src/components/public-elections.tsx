"use client";

import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselSlide } from "@mantine/carousel";
import {
  Box,
  Button,
  Center,
  Flex,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconArrowRight, IconFlag3 } from "@tabler/icons-react";
import moment from "moment";
import Balancer from "react-wrap-balancer";

import { parseHourTo12HourFormat } from "@eboto/constants";

import { api } from "~/trpc/client";

export default function PublicElections() {
  const getAllPublicElectionsQuery =
    api.election.getAllPublicElections.useQuery();
  return (
    <Stack>
      <Box>
        <Title order={2} ta="center">
          Public Elections
        </Title>
        <Text ta="center">
          <Balancer>Here, you can see the list of public elections.</Balancer>
        </Text>
      </Box>

      {getAllPublicElectionsQuery.isLoading ? (
        <Skeleton height={400} />
      ) : !getAllPublicElectionsQuery.data ||
        getAllPublicElectionsQuery.data.length === 0 ? (
        <Text ta="center">
          <Balancer>
            There are no public elections at the moment. Please check back
            later.
          </Balancer>
        </Text>
      ) : (
        <Carousel
          withIndicators
          slideSize={{ base: "100%", xs: "50%", md: "33.333333%" }}
          height={400}
          slideGap="md"
          loop
          align="start"
        >
          {getAllPublicElectionsQuery.data.map((election) => (
            <CarouselSlide key={election.id}>
              <Paper withBorder p="lg" h="100%">
                <Flex direction="column" justify="space-between" h="100%">
                  <Stack gap="sm">
                    <Center>
                      {election.logo_url ? (
                        <Image
                          src={election.logo_url}
                          alt={election.name + " logo"}
                          width={200}
                          height={200}
                          style={{
                            objectFit: "cover",
                            marginLeft: "auto",
                            marginRight: "auto",
                          }}
                          priority
                        />
                      ) : (
                        <Paper withBorder>
                          <IconFlag3
                            size={192}
                            style={{ padding: 40 }}
                            color="gray"
                          />
                        </Paper>
                      )}
                    </Center>
                    <Box>
                      <Text
                        fw="bold"
                        ta="center"
                        fz="xl"
                        lineClamp={2}
                        lh="xs"
                        w="100%"
                      >
                        {election.name}
                      </Text>
                      <Text size="sm" c="GrayText" ta="center">
                        {moment(election.start_date)
                          .local()
                          .format("MMM DD, YYYY")}
                        {" - "}
                        {moment(election.end_date)
                          .local()
                          .format("MMM DD, YYYY")}
                      </Text>
                      <Text size="sm" c="GrayText" ta="center">
                        {election.voting_hour_start === 0 &&
                        election.voting_hour_end === 24
                          ? "Whole day"
                          : parseHourTo12HourFormat(
                              election.voting_hour_start,
                            ) +
                            " - " +
                            parseHourTo12HourFormat(election.voting_hour_end)}
                      </Text>
                    </Box>
                  </Stack>
                  <Button
                    component={Link}
                    href={`/${election.slug}`}
                    radius="xl"
                    variant="default"
                    rightSection={<IconArrowRight size="1rem" />}
                  >
                    Visit Election
                  </Button>
                </Flex>
              </Paper>
            </CarouselSlide>
          ))}
        </Carousel>
      )}
    </Stack>
  );
}
