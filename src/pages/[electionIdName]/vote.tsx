import {
  Box,
  Button,
  Center,
  Container,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { FingerPrintIcon } from "@heroicons/react/24/outline";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import Card from "../../components/Card";
import ConfirmVoteModal from "../../components/ConfirmVoteModal";
import { firestore } from "../../firebase/firebase";
import {
  candidateType,
  electionType,
  partylistType,
  positionType,
} from "../../types/typings";
import isElectionOngoing from "../../utils/isElectionOngoing";

interface VotePageProps {
  election: electionType;
  partylists: partylistType[];
  positions: positionType[];
  candidates: candidateType[];
  voterUid: string;
}
const VotePage = ({
  election,
  partylists,
  positions,
  candidates,
  voterUid,
}: VotePageProps) => {
  const pageTitle = `${election.name} - Vote | eBoto Mo`;
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();

  if (
    !isElectionOngoing(election.electionStartDate, election.electionEndDate)
  ) {
    return (
      <>
        <Head>
          <title>{pageTitle}</title>
        </Head>
        <Center height="80vh">
          <Stack alignItems="center">
            <Text fontSize="2xl" fontWeight="bold" textAlign="center">
              Voting is not yet open.
            </Text>
            <Link href={`/${election.electionIdName}`}>
              <Button width="fit-content">Go to {election.name}</Button>
            </Link>
          </Stack>
        </Center>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <ConfirmVoteModal
        isOpen={isOpen}
        onClose={onClose}
        election={election}
        partylists={partylists}
        positions={positions}
        candidates={candidates}
        selectedCandidates={selectedCandidates}
        voterUid={voterUid}
      />
      <Container maxW="8xl" paddingY={16} gap={4} alignItems="center">
        <Box width="full">
          <Box marginBottom={8}>
            <Text fontSize="3xl" textAlign="center" fontWeight="bold">
              {election.name}
            </Text>
            <Text textAlign="center">Voting Page</Text>
          </Box>

          <Stack spacing={4}>
            {positions.map((position) => (
              <Card
                key={position.id}
                position={position}
                setSelectedCandidates={setSelectedCandidates}
                candidates={candidates}
                partylists={partylists}
              />
            ))}
          </Stack>
        </Box>

        <Center
          paddingX={[4, 0]}
          position="sticky"
          bottom={12}
          zIndex="sticky"
          marginTop={16}
        >
          <Button
            disabled={positions.length !== selectedCandidates.length}
            onClick={onOpen}
            variant="solid"
            leftIcon={<FingerPrintIcon width={22} />}
            paddingY={8}
            borderRadius="full"
          >
            Cast Vote
          </Button>
        </Center>
      </Container>
    </>
  );
};

export default VotePage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session || !session.user) {
    return {
      redirect: {
        destination: `/${context.query.electionIdName}`,
        permanent: false,
      },
    };
  }
  const electionSnapshot = await getDocs(
    query(
      collection(firestore, "elections"),
      where("electionIdName", "==", context.query.electionIdName)
    )
  );
  if (
    electionSnapshot.empty ||
    (session.user.accountType === "admin" &&
      !session.user.elections.includes(electionSnapshot.docs[0].data().uid))
  ) {
    return {
      notFound: true,
    };
  }
  if (
    session.user.accountType === "voter" &&
    electionSnapshot.docs[0].data().publicity === "private"
  ) {
    return {
      redirect: {
        destination: `/${electionSnapshot.docs[0].data().electionIdName}`,
        permanent: false,
      },
    };
  }
  if (session.user.accountType === "voter" && session.user.hasVoted) {
    return {
      redirect: {
        destination: `/${context.query.electionIdName}/realtime`,
        permanent: false,
      },
    };
  }
  const positionsSnapshot = await getDocs(
    query(
      collection(
        firestore,
        "elections",
        electionSnapshot.docs[0].id,
        "positions"
      ),
      orderBy("order")
    )
  );

  const partylistsSnapshot = await getDocs(
    query(
      collection(
        firestore,
        "elections",
        electionSnapshot.docs[0].id,
        "partylists"
      ),
      orderBy("createdAt", "asc")
    )
  );
  const candidatesSnapshot = await getDocs(
    collection(
      firestore,
      "elections",
      electionSnapshot.docs[0].id,
      "candidates"
    )
  );
  return {
    props: {
      election: JSON.parse(JSON.stringify(electionSnapshot.docs[0].data())),
      positions: JSON.parse(
        JSON.stringify(positionsSnapshot.docs.map((doc) => doc.data()))
      ) as positionType[],
      partylists: JSON.parse(
        JSON.stringify(partylistsSnapshot.docs.map((doc) => doc.data()))
      ) as partylistType[],
      candidates: JSON.parse(
        JSON.stringify(candidatesSnapshot.docs.map((doc) => doc.data()))
      ) as candidateType[],
      voterUid: session?.user?.uid,
    },
  };
};
