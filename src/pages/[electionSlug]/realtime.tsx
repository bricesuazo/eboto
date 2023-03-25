import {
  Container,
  Text,
  Table,
  Flex,
  SimpleGrid,
  Title,
  Center,
  Stack,
  Box,
  Group,
} from "@mantine/core";
import type { Election } from "@prisma/client";
import { IconFingerprint } from "@tabler/icons-react";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import Image from "next/image";
import Moment from "react-moment";
import { getServerAuthSession } from "../../server/auth";
import { prisma } from "../../server/db";
import { api } from "../../utils/api";
import { convertNumberToHour } from "../../utils/convertNumberToHour";
import Balancer from "react-wrap-balancer";

const RealtimePage = ({ election }: { election: Election }) => {
  const positions = api.election.getElectionRealtime.useQuery(election.id, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    // refetchInterval: 1000,
  });

  if (positions.isLoading) return <div>Loading...</div>;
  if (positions.isError) return <div>Error: {positions.error.message}</div>;

  if (!positions.data) return <div>No data</div>;
  return (
    <Container>
      <Stack spacing="xl">
        <Center>
          <Box>
            <Group position="center">
              {election.logo ? (
                <Image src={election.logo} alt="Logo" width={92} height={92} />
              ) : (
                <IconFingerprint size={92} style={{ padding: 8 }} />
              )}
            </Group>
            <Title order={2} lineClamp={2} align="center">
              {election.name} (@{election.slug})
            </Title>
            <Text align="center">
              <Moment format="MMMM DD, YYYY" date={election.start_date} />
              {" - "}
              <Moment format="MMMM DD, YYYY" date={election.end_date} />
            </Text>
            <Text align="center">
              Open from {convertNumberToHour(election.voting_start)} to{" "}
              {convertNumberToHour(election.voting_end)}
            </Text>
            <Text align="center" size="xs" color="dimmed">
              <Balancer>
                Realtime result as of{" "}
                <Moment date={new Date()} format="MMMM Do YYYY, h:mm:ss a" />
              </Balancer>
            </Text>
          </Box>
        </Center>
        <SimpleGrid
          cols={3}
          breakpoints={[
            { maxWidth: "md", cols: 2, spacing: "md" },
            { maxWidth: "xs", cols: 1, spacing: "sm" },
          ]}
        >
          {positions.data.map((position) => (
            <Table
              key={position.id}
              striped
              highlightOnHover
              withBorder
              captionSide="bottom"
              h="fit-content"
            >
              {/* <caption>
              As of{" "}
              <Moment date={new Date()} format="MMMM Do YYYY, h:mm:ss a" />
            </caption> */}
              <thead>
                <tr>
                  <th>
                    <Text lineClamp={2}>{position.name}</Text>
                  </th>
                </tr>
              </thead>

              <tbody>
                {position.candidate.map((candidate) => (
                  <tr key={candidate.id}>
                    <td>
                      <Flex justify="space-between" align="center">
                        <Text lineClamp={2}>{`${candidate.last_name}, ${
                          candidate.first_name
                        }${candidate.middle_name ?? " "} (${
                          candidate.partylist.acronym
                        })`}</Text>
                        <Text>{candidate.vote.length}</Text>
                      </Flex>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td>
                    <Flex justify="space-between">
                      <Text>Abstain</Text>
                      <Text>{position.vote.length}</Text>
                    </Flex>
                  </td>
                </tr>
              </tbody>
            </Table>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
};

export default RealtimePage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  if (
    !context.query.electionSlug ||
    typeof context.query.electionSlug !== "string"
  )
    return { notFound: true };

  const session = await getServerAuthSession(context);
  const election = await prisma.election.findFirst({
    where: {
      slug: context.query.electionSlug,
    },
  });

  if (!election) return { notFound: true };

  switch (election.publicity) {
    case "PRIVATE":
      if (!session)
        return { redirect: { destination: "/signin", permanent: false } };

      const commissioner = await prisma.commissioner.findFirst({
        where: {
          electionId: election.id,
          userId: session.user.id,
        },
      });

      if (!commissioner) return { notFound: true };
      break;
    case "VOTER":
      if (!session)
        return { redirect: { destination: "/signin", permanent: false } };

      const vote = await prisma.vote.findFirst({
        where: {
          voterId: session.user.id,
          electionId: election.id,
        },
      });

      if (!vote)
        return {
          redirect: { destination: `/${election.slug}`, permanent: false },
        };
      break;
  }

  return {
    props: {
      election,
    },
  };
};
