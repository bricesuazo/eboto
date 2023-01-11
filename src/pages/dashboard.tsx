import {
  Box,
  Center,
  Container,
  Flex,
  Grid,
  GridItem,
  Text,
  useColorMode,
  useDisclosure,
} from "@chakra-ui/react";
import { ChevronRightIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import { collection, getDocs, query, where } from "firebase/firestore";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import Moment from "react-moment";
import CreateElectionModal from "../components/CreateElectionModal";
import { firestore } from "../firebase/firebase";
import { electionType } from "../types/typings";

const DashboardPage = ({ elections }: { elections: electionType[] }) => {
  const {
    isOpen: isOpenCreateElection,
    onOpen: onOpenCreateElection,
    onClose: onCloseCreateElection,
  } = useDisclosure();
  const { colorMode } = useColorMode();
  return (
    <>
      <CreateElectionModal
        isOpen={isOpenCreateElection}
        onClose={onCloseCreateElection}
      />
      <Head>
        <title>Dashboard | eBoto Mo</title>
      </Head>
      <Container maxW="6xl" paddingY="8">
        {elections.length === 0 ? (
          <Text>No Election</Text>
        ) : (
          <>
            <Text mb={4} fontWeight="bold" fontSize={{ sm: "lg", lg: "xl" }}>
              Your elections
            </Text>

            <Grid
              templateColumns={[
                "repeat(1, 1fr)",
                "repeat(2, 1fr)",
                "repeat(3, 1fr)",
                "repeat(4, 1fr)",
              ]}
              gridTemplateRows="repeat(5, 1fr)"
              gap={4}
            >
              {elections.map((election) => (
                <GridItem key={election.id}>
                  <Link href={`/${election.electionIdName}/dashboard/`}>
                    <Flex
                      key={election.id}
                      padding={4}
                      height="full"
                      backgroundColor={
                        colorMode === "dark" ? "gray.900" : "gray.600"
                      }
                      borderRadius="lg"
                      userSelect="none"
                      transition="all 0.1s ease-in-out"
                      _hover={{
                        backgroundColor:
                          colorMode === "dark" ? "gray.700" : "gray.500",
                      }}
                      justifyContent="space-between"
                      alignItems="flex-start"
                      role="group"
                    >
                      <Flex justifyContent="space-between" direction="column">
                        <Text
                          fontWeight="bold"
                          fontSize={["sm", "initial"]}
                          color="white"
                        >
                          {election.name}
                        </Text>
                        <Box fontSize={["xs", "sm"]} color="gray.300">
                          <Text>
                            <Moment format="MM/DD/YY h:mmA">
                              {election.electionStartDate.seconds * 1000}
                            </Moment>
                            -
                            <Moment format="MM/DD/YY h:mmA">
                              {election.electionEndDate.seconds * 1000}
                            </Moment>
                          </Text>
                          <Text>
                            Created:{" "}
                            <Moment interval={10000} fromNow>
                              {election.createdAt.seconds * 1000}
                            </Moment>
                          </Text>
                        </Box>
                      </Flex>
                      <Box
                        width={6}
                        color="transparent"
                        mr={1}
                        transition="all 0.25s ease-in-out"
                        _groupHover={{ color: "white", mr: 0 }}
                      >
                        <ChevronRightIcon />
                      </Box>
                    </Flex>
                  </Link>
                </GridItem>
              ))}
              <GridItem>
                <Center
                  border="2px"
                  height="full"
                  borderColor={colorMode === "dark" ? "gray.900" : "gray.700"}
                  borderRadius="lg"
                  onClick={onOpenCreateElection}
                  color={colorMode === "dark" ? "gray.200" : "gray.400"}
                  userSelect="none"
                  cursor="pointer"
                  transition="all 0.1s ease-in-out"
                  _hover={{
                    backgroundColor:
                      colorMode === "dark" ? "gray.700" : "gray.800",
                    color: "white",
                    borderColor: colorMode === "dark" ? "gray.700" : "gray.800",
                  }}
                >
                  <Center flexDirection="column">
                    <PlusCircleIcon width={32} />
                    <Text>Create election</Text>
                  </Center>
                </Center>
              </GridItem>
            </Grid>
          </>
        )}
      </Container>
    </>
  );
};

export default DashboardPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const session = await getSession(context);
  if (session && session.user.accountType === "admin") {
    if (session.user.elections.length === 0) {
      return {
        redirect: {
          destination: "/create-election",
          permanent: false,
        },
      };
    }
    const electionSnapshot = await getDocs(
      query(
        collection(firestore, "elections"),
        where("uid", "in", session.user.elections)
      )
    );
    const elections = electionSnapshot.docs.map((doc) => doc.data());
    return {
      props: { elections: JSON.parse(JSON.stringify(elections)) },
    };
  }
  return {
    props: {},
  };
};
