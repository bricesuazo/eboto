import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import { doc, getDoc } from "firebase/firestore";
import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextPage,
} from "next";
import { getSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { firestore } from "../firebase/firebase";

const Home: NextPage = () => {
  return (
    <Flex flexDirection="column" gap={16}>
      <Box
        backgroundImage="linear-gradient(0deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('/assets/images/cvsu-front.jpg')"
        backgroundSize="cover"
        backgroundPosition="center"
        backgroundRepeat="no-repeat"
      >
        <Container maxW="6xl">
          <Flex
            minHeight="xl"
            direction="column"
            justifyContent="center"
            alignItems="center"
            gap={2}
          >
            <HStack>
              <Text
                color="#ffde59"
                // boxShadow="-16px 16px 0px 0px #1F7A3A;"
                fontWeight="bold"
                fontSize={["4xl", "6xl"]}
                textAlign="center"
              >
                eBoto Mo
              </Text>
              <Image
                src="/assets/images/eboto-mo-logo.png"
                alt="eBoto Mo Logo"
                width={64}
                height={64}
                style={{
                  filter: "invert(1)",
                  rotate: "8deg",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            </HStack>
            <Text color="white" fontSize={["md", "xl"]} textAlign="center">
              An Online Voting System for Cavite State University - Don Severino
              Delas Alas Campus with Real-time Voting Count.
            </Text>
          </Flex>
        </Container>
      </Box>
      <Container maxW="6xl">
        <Stack
          direction={["column-reverse", "row"]}
          textAlign={["center", "left"]}
          alignItems="center"
          spacing={8}
        >
          <Stack flex={2} alignItems={["center", "flex-start"]}>
            <Box lineHeight="normal">
              <Text fontWeight="black" fontSize={["4xl", "5xl", "6xl"]}>
                VOTE NOW!
              </Text>
              <Text fontWeight="bold" fontSize={["xl", "2xl"]} color="#deac45">
                IT&apos;S YOUR RIGHT!
              </Text>
            </Box>
            <Text>
              Take nothing for granted! Voting is about more than just electing
              a candidate; it&apos;s also about choosing the appropriate
              policies and individuals to make decisions that will affect our
              Alma Mater.
            </Text>
            <Link href="/signin" style={{ width: "fit-content" }}>
              <Button colorScheme="gray" variant="solid">
                Sign in as voter
              </Button>
            </Link>
          </Stack>
          <Box
            position="relative"
            width={[256, 222, 256, 356]}
            height={[256, 222, 256, 356]}
            flex={["none", 1]}
          >
            <Image
              src="/assets/images/vote1.png"
              alt=""
              fill
              sizes="contain"
              style={{
                objectFit: "contain",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          </Box>
        </Stack>
      </Container>
      <Container maxW="6xl">
        <Stack
          direction={["column-reverse", "row-reverse"]}
          textAlign={["center", "left"]}
          alignItems="center"
          spacing={8}
        >
          <Stack flex={2} alignItems={["center", "flex-start"]}>
            <Box lineHeight="normal">
              <Text fontWeight="black" fontSize={["4xl", "5xl", "6xl"]}>
                KNOW YOUR
              </Text>
              <Text fontWeight="bold" fontSize={["xl", "2xl"]} color="#deac45">
                CANDIDATES!
              </Text>
            </Box>
            <Text>
              Credentials matter - it is an undeniable fact that credentials are
              an essential component of our educational system. Take the time to
              learn about the candidates and their agendas.
            </Text>
          </Stack>
          <Box
            position="relative"
            width={[256, 222, 256, 356]}
            height={[256, 222, 256, 356]}
            flex={["none", 1]}
          >
            <Image
              src="/assets/images/vote2.png"
              alt=""
              fill
              sizes="contain"
              style={{
                objectFit: "contain",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          </Box>
        </Stack>
      </Container>
      <Container maxW="6xl">
        <Stack
          direction={["column-reverse", "row"]}
          textAlign={["center", "left"]}
          alignItems="center"
          spacing={8}
        >
          <Stack flex={2} alignItems={["center", "flex-start"]}>
            <Box lineHeight="normal">
              <Text fontWeight="black" fontSize={["4xl", "5xl", "6xl"]}>
                YOUR VOTES
              </Text>
              <Text fontWeight="bold" fontSize={["xl", "2xl"]} color="#deac45">
                ARE SAFE!
              </Text>
            </Box>
            <Text>
              Your vote security is our outmost priority! The number of votes at
              the homepage is real-time where you can also monitor the actual
              counting of votes. Your votes and all your data are safe and
              secure in our database.
            </Text>
            <Link href="/signup" style={{ width: "fit-content" }}>
              <Button colorScheme="gray" variant="solid">
                Create an account as admin
              </Button>
            </Link>
          </Stack>
          <Box
            position="relative"
            width={[256, 222, 256, 356]}
            height={[256, 222, 256, 356]}
            flex={["none", 1]}
          >
            <Image
              src="/assets/images/vote3.png"
              alt=""
              fill
              sizes="contain"
              style={{
                objectFit: "contain",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          </Box>
        </Stack>
      </Container>
      <div />
    </Flex>
  );
};

export default Home;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const session = await getSession(context);

  if (session && session.user.accountType === "voter") {
    const electionSnapshot = await getDoc(
      doc(firestore, "elections", session.user.election)
    );

    return {
      redirect: {
        destination: `/${electionSnapshot.data()?.electionIdName}`,
        permanent: false,
      },
    };
  } else if (session && session.user.accountType === "admin") {
    if (session.user.elections.length === 0) {
      return {
        redirect: {
          destination: "/create-election",
          permanent: false,
        },
      };
    }
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }
  return { props: {} };
};
