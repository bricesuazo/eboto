import {
  Box,
  Button,
  Center,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftAddon,
  InputRightAddon,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
// import PDFDownloadLink but disable SSR
import dynamic from "next/dynamic";
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
  }
);
PDFDownloadLink;
import { collection, getDocs, query, where } from "firebase/firestore";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import Moment from "react-moment";
import { useFirestoreCollectionData } from "reactfire";
import { firestore } from "../../../firebase/firebase";
import DashboardLayout from "../../../layout/DashboardLayout";
import GenerateResult from "../../../pdf/GenerateResult";
import { adminType, electionType } from "../../../types/typings";
import { getHourByNumber } from "../../../utils/getHourByNumber";
import isAdminOwnsTheElection from "../../../utils/isAdminOwnsTheElection";

const OverviewPage = ({
  session,
  election,
}: {
  session: { user: adminType; expires: string };
  election: electionType;
}) => {
  const [copied, setCopied] = useState(false);

  const { data: votersData } = useFirestoreCollectionData(
    collection(firestore, "elections", election.uid, "voters")
  );

  return (
    <>
      <Head>
        <title>Overview | eBoto Mo</title>
      </Head>
      <DashboardLayout title="Overview" session={session}>
        <Stack spacing={4} textAlign={["center", "left"]}>
          <Stack
            direction={["column", "row"]}
            spacing={[0, 2]}
            alignItems="center"
          >
            <Text fontWeight={["normal", "bold"]}>Election Name: </Text>
            <Text fontWeight={["bold", "normal"]} fontSize={["xl", "initial"]}>
              {election.name}
            </Text>

            <Text fontSize="sm" display={["initial", "none"]}>
              Created{" "}
              <Moment fromNow>{election.createdAt.seconds * 1000}</Moment>
            </Text>
          </Stack>

          <Stack direction="row" display={["none", "inherit"]}>
            <Text fontWeight="bold">Created At:</Text>
            <Text>
              <Moment format="MMMM DD, YYYY, h:mmA">
                {election.createdAt.seconds * 1000}
              </Moment>{" "}
              (<Moment fromNow>{election.createdAt.seconds * 1000}</Moment>)
            </Text>
          </Stack>

          <HStack display={["none", "none", "inherit"]}>
            <Link href={`/${election.electionIdName}`} target="_blank">
              <Box display={["none", "none", "none", "initial"]}>
                <Button
                  rightIcon={<ArrowTopRightOnSquareIcon width={18} />}
                  variant="outline"
                >
                  Go to {election.name}
                </Button>
              </Box>
              <Box display={["none", "none", "initial", "none"]}>
                <IconButton
                  aria-label={"Go to" + election.name}
                  icon={<ArrowTopRightOnSquareIcon width={18} />}
                />
              </Box>
            </Link>
            <InputGroup>
              <InputLeftAddon>eboto-mo.com/</InputLeftAddon>
              <Input
                type="text"
                placeholder="Election ID Name"
                value={election.electionIdName}
                readOnly
              />
              <InputRightAddon
                cursor="pointer"
                onClick={() => {
                  if (copied) return;
                  navigator.clipboard.writeText(
                    `eboto-mo.com/${election.electionIdName}`
                  );
                  setCopied(true);

                  setTimeout(() => {
                    setCopied(false);
                  }, 3000);
                }}
              >
                {copied ? (
                  <Text>Copied!</Text>
                ) : (
                  <>
                    <DocumentDuplicateIcon width={18} />
                    <Text>Copy</Text>
                  </>
                )}
              </InputRightAddon>
            </InputGroup>
          </HStack>

          <Stack direction="column" display={["inherit", "inherit", "none"]}>
            <InputGroup>
              <InputLeftAddon>/</InputLeftAddon>
              <Input
                type="text"
                placeholder="Election ID Name"
                value={election.electionIdName}
                readOnly
              />
              <InputRightAddon
                cursor="pointer"
                onClick={() => {
                  if (copied) return;
                  navigator.clipboard.writeText(
                    `eboto-mo.com/${election.electionIdName}`
                  );
                  setCopied(true);

                  setTimeout(() => {
                    setCopied(false);
                  }, 3000);
                }}
              >
                {copied ? (
                  <CheckIcon width={18} />
                ) : (
                  <>
                    <DocumentDuplicateIcon width={18} />
                  </>
                )}
              </InputRightAddon>
            </InputGroup>
            <Link href={`/${election.electionIdName}`} target="_blank">
              <Button
                rightIcon={<ArrowTopRightOnSquareIcon width={18} />}
                variant="outline"
                width="full"
              >
                Go to {election.name}
              </Button>
            </Link>
          </Stack>

          <Stack spacing={[2, 0]}>
            <Stack direction={["column", "row"]} spacing={[0, 2]}>
              <Text fontWeight={["normal", "bold"]}>Election start date:</Text>
              <Text fontWeight={["bold", "normal"]}>
                <Moment format="MMMM DD, YYYY, hA">
                  {election.electionStartDate.seconds * 1000}
                </Moment>{" "}
                (
                <Moment fromNow>
                  {election.electionStartDate.seconds * 1000}
                </Moment>
                )
              </Text>
            </Stack>
            <Stack direction={["column", "row"]} spacing={[0, 2]}>
              <Text fontWeight={["normal", "bold"]}>Election end date:</Text>
              <Text fontWeight={["bold", "normal"]}>
                <Moment format="MMMM DD, YYYY, hA">
                  {election.electionEndDate.seconds * 1000}
                </Moment>{" "}
                (
                <Moment fromNow>
                  {election.electionEndDate.seconds * 1000}
                </Moment>
                )
              </Text>
            </Stack>
            <Stack direction={["column", "row"]} spacing={[0, 2]}>
              <Text fontWeight={["normal", "bold"]}>Voting hours:</Text>
              <Text>
                {getHourByNumber(election.votingStartHour)} -{" "}
                {getHourByNumber(election.votingEndHour)} (
                {election.votingEndHour - election.votingStartHour < 0
                  ? election.votingStartHour - election.votingEndHour
                  : election.votingEndHour - election.votingStartHour}{" "}
                {election.votingEndHour - election.votingStartHour > 1
                  ? "hours"
                  : "hour"}
                )
              </Text>
            </Stack>
          </Stack>

          <Center
            backgroundColor="gray.500"
            padding={4}
            borderRadius="lg"
            width="fit-content"
            alignSelf={["center", "start"]}
          >
            {!votersData ? (
              <Spinner />
            ) : votersData.filter((voter) => voter.hasVoted).length === 0 &&
              votersData.length === 0 ? (
              <Text fontSize="2xl" fontWeight="bold" color="white">
                No voters yet
              </Text>
            ) : (
              <Text fontSize="2xl" fontWeight="bold" color="white">
                {votersData.filter((voter) => voter.hasVoted).length +
                  "/" +
                  votersData.length +
                  " " +
                  "voted (" +
                  (
                    (votersData.filter((voter) => voter.hasVoted).length /
                      votersData.length) *
                    100
                  ).toFixed(0) +
                  "%)"}
              </Text>
            )}
          </Center>

          <Button alignSelf={["center", "start"]}>
            <PDFDownloadLink
              document={<GenerateResult election={election} />}
              fileName="result.pdf"
            >
              {({ loading }) =>
                loading ? "Loading document..." : "Generate Result"
              }
            </PDFDownloadLink>
          </Button>
        </Stack>
      </DashboardLayout>
    </>
  );
};

export default OverviewPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const session = await getSession(context);
  const electionSnapshot = await getDocs(
    query(
      collection(firestore, "elections"),
      where("electionIdName", "==", context.query.electionIdName)
    )
  );
  if (electionSnapshot.empty || !session) {
    return {
      notFound: true,
    };
  }

  if (!isAdminOwnsTheElection(session, electionSnapshot.docs[0].id)) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  return {
    props: {
      election: JSON.parse(JSON.stringify(electionSnapshot.docs[0].data())),
      session: await getSession(context),
    },
  };
};
