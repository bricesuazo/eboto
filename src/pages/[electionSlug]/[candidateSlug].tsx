import {
  Container,
  Text,
  Box,
  Flex,
  Title,
  Breadcrumbs,
  Stack,
  Anchor,
} from "@mantine/core";
import type { Candidate, Election, Partylist, Position } from "@prisma/client";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getServerAuthSession } from "../../server/auth";
import { prisma } from "../../server/db";
import Image from "next/image";
import { IconUser } from "@tabler/icons-react";
import Link from "next/link";

const CandidatePage = ({
  election,
  candidate,
}: {
  election: Election;
  candidate: Candidate & {
    partylist: Partylist;
    position: Position;
  };
}) => {
  return (
    <Container>
      <Stack>
        <Breadcrumbs w="100%">
          <Box>
            <Anchor
              component={Link}
              href={`/${election.slug}`}
              truncate
              maw={300}
            >
              {election.name}
            </Anchor>
          </Box>

          <Text truncate maw={300}>
            {`${candidate.last_name}, ${candidate.first_name}${
              candidate.middle_name ? " " + candidate.middle_name : ""
            }`}
          </Text>
        </Breadcrumbs>
        <Flex
          gap="md"
          sx={(theme) => ({
            [theme.fn.smallerThan("xs")]: {
              flexDirection: "column",
            },
          })}
        >
          <Box
            sx={(theme) => ({
              position: "sticky",
              top: 76,
              height: "100%",

              [theme.fn.smallerThan("xs")]: {
                position: "initial",
              },
            })}
          >
            {candidate.image ? (
              <Box
                pos="relative"
                sx={(theme) => ({
                  width: 280,
                  aspectRatio: "1/1",

                  [theme.fn.smallerThan("sm")]: {
                    width: 200,
                    height: "auto",
                  },
                  [theme.fn.smallerThan("xs")]: {
                    width: "100%",
                    height: "auto",
                  },
                })}
              >
                <Image
                  src={candidate.image}
                  alt={candidate.first_name + " " + candidate.last_name}
                  fill
                  sizes="100%"
                />
              </Box>
            ) : (
              <Box
                sx={(theme) => ({
                  width: 280,
                  aspectRatio: "1/1",

                  [theme.fn.smallerThan("sm")]: {
                    width: 200,
                    height: "auto",
                  },
                  [theme.fn.smallerThan("xs")]: {
                    width: "100%",
                    height: "auto",
                  },
                })}
              >
                <IconUser width="100%" height="100%" stroke={1.5} />
              </Box>
            )}
          </Box>

          <Box sx={{ flex: 1 }}>
            <Title order={2}>
              {`${candidate.last_name}, ${candidate.first_name}${
                candidate.middle_name ? " " + candidate.middle_name : ""
              }`}
            </Title>
            <Text>Running for {candidate.position.name}</Text>
            <Text>{candidate.partylist.name}</Text>
          </Box>
        </Flex>
      </Stack>
    </Container>
  );
};

export default CandidatePage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  if (
    !context.query.electionSlug ||
    !context.query.candidateSlug ||
    typeof context.query.electionSlug !== "string" ||
    typeof context.query.candidateSlug !== "string"
  )
    return { notFound: true };

  const session = await getServerAuthSession(context);
  const election = await prisma.election.findFirst({
    where: {
      slug: context.query.electionSlug,
      candidates: {
        some: {
          slug: context.query.candidateSlug,
        },
      },
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

      const voter = await prisma.voter.findFirst({
        where: {
          electionId: election.id,
          userId: session.user.id,
        },
      });

      if (!voter)
        return {
          redirect: { destination: "/signin", permanent: false },
        };
      break;
  }

  const candidate = await prisma.candidate.findFirst({
    where: {
      electionId: election.id,
      slug: context.query.candidateSlug,
    },
    include: {
      partylist: true,
      position: true,
    },
  });

  if (!candidate) return { notFound: true };

  return {
    props: {
      election,
      candidate,
    },
  };
};
