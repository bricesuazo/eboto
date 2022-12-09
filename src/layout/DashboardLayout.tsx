import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  Hide,
  HStack,
  Icon,
  IconButton,
  Input,
  Select,
  Show,
  Stack,
  Text,
  Tooltip,
  useColorMode,
  useDisclosure,
} from "@chakra-ui/react";
import { PlusIcon } from "@heroicons/react/24/solid";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import CreateElectionModal from "../components/CreateElectionModal";
import DashboardSidebar, {
  dashboardSidebar,
} from "../components/DashboardSidebar";
import { firestore } from "../firebase/firebase";
import { useRouter } from "next/router";
import { useRouter as useRouterNavigation } from "next/navigation";
import AddVoterModal from "../components/AddVoterModal";
import { UserPlusIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import {
  ArrowPathIcon,
  ArrowUpOnSquareIcon,
} from "@heroicons/react/24/outline";
import { adminType, electionType, positionType } from "../types/typings";
import AddPartylistModal from "../components/AddPartylistModal";
import AddPositionModal from "../components/AddPositionModal";
import Moment from "react-moment";
import { useFirestoreCollectionData } from "reactfire";
import UploadBulkVotersModal from "../components/UploadBulkVotersModal";

const DashboardLayout = ({
  children,
  title,
  overflow,
  session,
}: {
  children: any;
  title: string;
  overflow?: string;
  session: { user: adminType; expires: string };
}) => {
  const router = useRouter();
  const routerNavigation = useRouterNavigation();
  // Reloads the page when router changes
  // useEffect(() => {
  //   currentElection?.electionIdName === router.query.electionIdName &&
  //     routerNavigation.refresh();
  // }, [router.query.electionIdName]);
  const {
    isOpen: isOpenCreateElection,
    onOpen: onOpenCreateElection,
    onClose: onCloseCreateElection,
  } = useDisclosure();
  const {
    isOpen: isOpenAddPartylist,
    onOpen: onOpenAddPartylist,
    onClose: onCloseAddPartylist,
  } = useDisclosure();
  const {
    isOpen: isOpenAddPosition,
    onOpen: onOpenAddPosition,
    onClose: onCloseAddPosition,
  } = useDisclosure();

  const {
    isOpen: isOpenAddVoter,
    onOpen: onOpenAddVoter,
    onClose: onCloseAddVoter,
  } = useDisclosure();
  const {
    isOpen: isOpenUploadBulkVoter,
    onOpen: onOpenUploadBulkVoter,
    onClose: onCloseUploadBulkVoter,
  } = useDisclosure();

  const [elections, setElections] = useState<electionType[]>();
  const [currentElection, setCurrentElection] = useState<electionType>();

  const { colorMode } = useColorMode();
  const { data } = useFirestoreCollectionData(
    query(
      collection(firestore, "elections"),
      where("uid", "in", session.user.elections)
    )
  );

  useEffect(() => {
    setElections(data as electionType[]);
  }, [data]);

  useEffect(() => {
    setCurrentElection(
      elections?.find(
        (election) => election.electionIdName === router.query.electionIdName
      )
    );

    if (elections?.length === 0) {
      router.push("/create-election");
    }
    if (
      currentElection &&
      session.user.elections.includes(currentElection.uid)
    ) {
      router.replace("/dashboard");
    }
  }, [elections]);

  return (
    <>
      <CreateElectionModal
        isOpen={isOpenCreateElection}
        onClose={onCloseCreateElection}
      />
      <AddPartylistModal
        election={currentElection as electionType}
        isOpen={isOpenAddPartylist}
        onClose={onCloseAddPartylist}
      />
      <AddPositionModal
        election={currentElection as electionType}
        isOpen={isOpenAddPosition}
        onClose={onCloseAddPosition}
      />
      <AddVoterModal
        election={currentElection as electionType}
        isOpen={isOpenAddVoter}
        onClose={onCloseAddVoter}
      />
      <UploadBulkVotersModal
        isOpen={isOpenUploadBulkVoter}
        onClose={onCloseUploadBulkVoter}
        election={currentElection as electionType}
      />

      <Stack spacing={4} padding="4">
        <Stack
          direction={["column", "row"]}
          alignItems="center"
          spacing={[0, 4]}
        >
          <Center columnGap={2} width={["full", "full", "356px"]}>
            <Select
              placeholder={
                false
                  ? !elections?.length
                    ? "Loading..."
                    : "Create election"
                  : undefined
              }
              disabled={!elections?.length}
              value={router.query.electionIdName}
              onChange={(e) => {
                router.push(
                  "/" +
                    e.target.value +
                    router.pathname.split("/[electionIdName]")[1]
                );
              }}
            >
              {elections?.map((election) => (
                <option value={election.electionIdName} key={election.id}>
                  {election.name}
                </option>
              ))}
            </Select>
            <Tooltip label="Create an election">
              <IconButton
                aria-label="Add election"
                icon={<PlusIcon width="1.5rem" />}
                onClick={onOpenCreateElection}
              />
            </Tooltip>
          </Center>
          <Tooltip label="Last updated" hasArrow>
            <Stack
              direction="row"
              color={`${
                (colorMode === "dark" ? "white" : "black") + "Alpha.600"
              }`}
              p={2}
              cursor="pointer"
              role="group"
              justifyContent={["center", "flex-start"]}
            >
              <Center gap={2}>
                <Icon
                  as={ArrowPathIcon}
                  _groupHover={{
                    color: `${
                      (colorMode === "dark" ? "white" : "black") + "Alpha.900"
                    }`,
                    transform: "rotate(180deg)",
                    transition: "all 0.5s",
                  }}
                />
                {!currentElection ? (
                  <Text fontSize="xs">Loading...</Text>
                ) : (
                  <Text
                    fontSize="xs"
                    _groupHover={{
                      color: `${
                        (colorMode === "dark" ? "white" : "black") + "Alpha.700"
                      }`,
                      transition: "all 0.5s",
                    }}
                  >
                    Updated{" "}
                    <Moment
                      interval={10000}
                      fromNow
                      date={currentElection.updatedAt.toDate()}
                    />
                  </Text>
                )}
              </Center>
            </Stack>
          </Tooltip>
        </Stack>
        <Flex
          flexDirection={["column", "column", "row"]}
          borderRadius="0.25rem"
          gap={4}
          height="full"
        >
          <Show below="md">
            <Select
              value={router.pathname.split("/dashboard")[1]}
              onChange={(e) => {
                router.push(
                  `/${router.query.electionIdName}/dashboard${e.target.value}`
                );
              }}
            >
              {dashboardSidebar.map((sidebar) => (
                <option value={sidebar.href} key={sidebar.id}>
                  {sidebar.title}
                </option>
              ))}
            </Select>
          </Show>

          <Hide below="md">
            <Box
              padding={4}
              backgroundColor={colorMode === "dark" ? "gray.700" : "gray.50"}
              borderRadius="md"
              height="fit-content"
            >
              <DashboardSidebar />
            </Box>
          </Hide>

          <Stack
            padding={4}
            backgroundColor={colorMode === "dark" ? "gray.700" : "gray.50"}
            flex="1"
            borderRadius="md"
          >
            <Flex justifyContent="space-between" alignItems="center">
              <Text fontSize={["xl", "2xl"]} fontWeight="bold">
                {title}
              </Text>
              {(() => {
                switch (title) {
                  case "Partylists":
                    return (
                      <HStack>
                        <Hide above="sm">
                          <IconButton
                            aria-label="Add partylist"
                            icon={<UserPlusIcon width={18} />}
                            onClick={onOpenAddPartylist}
                            isLoading={!currentElection}
                          />
                        </Hide>
                        <Hide below="sm">
                          <Button
                            onClick={onOpenAddPartylist}
                            leftIcon={<UserPlusIcon width={18} />}
                            isLoading={!currentElection}
                          >
                            Add partylist
                          </Button>
                        </Hide>
                      </HStack>
                    );
                  case "Positions":
                    return (
                      <HStack>
                        <Hide above="sm">
                          <IconButton
                            aria-label="Add position"
                            icon={<UserPlusIcon width={18} />}
                            onClick={onOpenAddPosition}
                            isLoading={!currentElection}
                          />
                        </Hide>

                        <Hide below="sm">
                          <Button
                            onClick={onOpenAddPosition}
                            leftIcon={<UserPlusIcon width={18} />}
                            isLoading={!currentElection}
                          >
                            Add position
                          </Button>
                        </Hide>
                      </HStack>
                    );
                  case "Voters":
                    return (
                      <HStack>
                        <Tooltip label="Upload bulk voters. (.xlsx)">
                          <IconButton
                            aria-label="Upload bulk voters"
                            icon={<ArrowUpOnSquareIcon width={24} />}
                            onClick={onOpenUploadBulkVoter}
                          />
                        </Tooltip>
                        <Hide above="sm">
                          <IconButton
                            aria-label="Add voter"
                            icon={<UserPlusIcon width={18} />}
                            onClick={onOpenAddVoter}
                          />
                        </Hide>
                        <Hide below="sm">
                          <Button
                            onClick={onOpenAddVoter}
                            leftIcon={<UserPlusIcon width={18} />}
                            isLoading={!currentElection}
                          >
                            Add voter
                          </Button>
                        </Hide>
                      </HStack>
                    );
                }
              })()}
            </Flex>

            <Divider />
            <Box paddingTop={2} overflow={overflow} height="xl">
              {children}
            </Box>
          </Stack>
        </Flex>
      </Stack>
    </>
  );
};

export default DashboardLayout;
