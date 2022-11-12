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
                backgroundColor="blue.800"
                borderRadius="lg"
                width={["full", 372]}
                height={132}
                userSelect="none"
                transition="all 0.1s ease-in-out"
                _hover={{ backgroundColor: "blue.700" }}
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
                  <Box fontSize={["xs", "sm"]} width="full" color="gray.400">
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
            borderColor="blue.800"
            borderRadius="lg"
            width={["full", 172]}
            maxWidth="372px"
            onClick={onOpenCreateElection}
            color="blue.800"
            userSelect="none"
            cursor="pointer"
            transition="all 0.1s ease-in-out"
            _hover={{ backgroundColor: "blue.800", color: "white" }}
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

  if (!session) {
    return {
      redirect: {
        destination: "/signin",
        permanent: false,
      },
    };
  } else if (session.user.accountType === "voter") {
    const electionSnap = await getDoc(
      doc(firestore, "elections", session.user.election)
    );
    const election = electionSnap.data();
    return {
      redirect: {
        destination: `/${election?.electionIdName}`,
        permanent: false,
      },
    };
  } else if (session.user.accountType === "admin") {
    const electionSnapshot = await getDocs(
      query(
        collection(firestore, "elections"),
        where("uid", "in", session.user.elections)
      )
    );
    if (electionSnapshot.empty) {
      return {
        redirect: {
          destination: "/create-election",
          permanent: false,
        },
      };
    }
    const elections = electionSnapshot.docs.map((doc) => doc.data());
    return {
      props: { elections: JSON.parse(JSON.stringify(elections)) },
    };
  }
  return {
    props: {},
  };
};
