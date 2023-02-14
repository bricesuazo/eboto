import {
  Container,
  Flex,
  Text,
  Box,
  CloseButton,
  Stack,
} from "@chakra-ui/react";
import { collection, query } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useFirestoreCollectionData } from "reactfire";
import { firestore } from "../firebase/firebase";
import { electionType } from "../types/typings";
import isElectionOngoing from "../utils/isElectionOngoing";

const Banner = () => {
  const [elections, setElections] = useState<electionType[]>();
  const [isBannerHide, setIsBannerHide] = useState(true);
  const router = useRouter();
  const { data } = useFirestoreCollectionData(
    query(collection(firestore, "elections"))
  );
  useEffect(() => {
    setElections(data as electionType[]);
  }, [data]);

  if (!(elections && router.pathname === "/" && isBannerHide)) return null;

  return (
    <Box bg="gray.700" color="white">
      <Container maxW="8xl" paddingX={4} paddingY={2}>
        <Flex justifyContent="space-between" alignItems="center">
          <Stack direction="row">
            <Text fontSize="xs" fontWeight="medium">
              Ongoing Elections:
            </Text>
            {elections
              ?.filter((election) => isElectionOngoing(election))
              .map((election) => (
                <Link href={`/${election.electionIdName}`} key={election.uid}>
                  <Text
                    fontSize="xs"
                    _hover={{
                      textDecoration: "underline",
                    }}
                  >
                    {election.name}
                  </Text>
                </Link>
              ))}
          </Stack>
          <CloseButton onClick={() => setIsBannerHide(false)} />
        </Flex>
      </Container>
    </Box>
  );
};

export default Banner;
