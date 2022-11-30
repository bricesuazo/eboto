import { firestore } from "../firebase/firebase";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { getSession } from "next-auth/react";
import {
  Box,
  Center,
  Flex,
  Text,
  useColorMode,
  useDisclosure,
} from "@chakra-ui/react";
import { electionType } from "../types/typings";
import Link from "next/link";
import Moment from "react-moment";
import { ChevronRightIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import CreateElectionModal from "../components/CreateElectionModal";
import Head from "next/head";

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
      <Box padding={4}>
        <Text mb={4} fontWeight="bold" fontSize={{ sm: "lg", lg: "xl" }}>
          Your elections
        </Text>

        <Flex flexWrap="wrap" gap={4}>
          {elections.map((election) => (
            <Link
              href={`/${election.electionIdName}/dashboard/`}
              key={election.id}
              style={{ width: "100%", maxWidth: "372px" }}
            >
              <Flex
                key={election.id}
                padding={4}
                backgroundColor={colorMode === "dark" ? "gray.900" : "gray.600"}
                borderRadius="lg"
                width={["full", 372]}
                height={132}
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
                <Flex
                  justifyContent="space-between"
                  direction="column"
                  height="full"
                >
                  <Text
                    fontWeight="bold"
                    fontSize={["sm", "initial"]}
                    color="white"
                  >
                    {election.name}
                  </Text>
                  <Box fontSize={["xs", "sm"]} width="full" color="gray.300">
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
                      Updated:{" "}
                      <Moment interval={10000} fromNow>
                        {election.updatedAt.seconds * 1000}
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
                  color="gray.500"
                  mr={1}
                  transition="all 0.25s ease-in-out"
                  _groupHover={{ color: "white", mr: 0 }}
                >
                  <ChevronRightIcon />
                </Box>
              </Flex>
            </Link>
          ))}
          <Center
            height={132}
            border="2px"
            borderColor={colorMode === "dark" ? "gray.900" : "gray.700"}
            borderRadius="lg"
            width={["full", 172]}
            maxWidth="372px"
            onClick={onOpenCreateElection}
            color={colorMode === "dark" ? "gray.200" : "gray.400"}
            userSelect="none"
            cursor="pointer"
            transition="all 0.1s ease-in-out"
            _hover={{
              backgroundColor: colorMode === "dark" ? "gray.700" : "gray.800",
              color: "white",
              borderColor: colorMode === "dark" ? "gray.700" : "gray.800",
            }}
          >
            <Center flexDirection="column">
              <PlusCircleIcon width={32} />
              <Text>Create election</Text>
            </Center>
          </Center>
        </Flex>
      </Box>
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
