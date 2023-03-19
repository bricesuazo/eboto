import {
  Button,
  Text,
  Table,
  TextInput,
  Flex,
  Box,
  Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSearch, IconUpload, IconUserPlus } from "@tabler/icons-react";
import { useRouter } from "next/router";
import CreateVoterModal from "../../../components/modals/CreateVoter";
import Voter from "../../../components/Voter";
import { api } from "../../../utils/api";
import Balancer from "react-wrap-balancer";

const DashboardVoter = () => {
  const router = useRouter();
  const [opened, { open, close }] = useDisclosure(false);

  const voters = api.election.getElectionVoter.useQuery(
    router.query.electionSlug as string,
    {
      enabled: router.isReady,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    }
  );

  if (voters.isLoading) return <Text>Loading...</Text>;

  if (voters.isError) return <Text>Error: {voters.error.message}</Text>;

  if (!voters.data) return <Text>No election found</Text>;

  return (
    <>
      <CreateVoterModal
        isOpen={opened}
        electionId={voters.data.election.id}
        onClose={close}
        refetch={voters.refetch}
      />

      <Stack>
        <Flex
          sx={(theme) => ({
            gap: theme.spacing.xs,

            [theme.fn.smallerThan("xs")]: {
              gap: theme.spacing.sm,
              flexDirection: "column",
            },
          })}
        >
          <Flex gap="xs">
            <Button
              leftIcon={<IconUserPlus size="1rem" />}
              onClick={open}
              sx={(theme) => ({
                [theme.fn.smallerThan("xs")]: {
                  width: "100%",
                },
              })}
            >
              Add voter
            </Button>
            <Button
              leftIcon={<IconUpload size="1rem" />}
              variant="light"
              sx={(theme) => ({
                [theme.fn.smallerThan("xs")]: {
                  width: "100%",
                },
              })}
            >
              Import
            </Button>
          </Flex>
          <TextInput
            placeholder="Search by any field"
            icon={<IconSearch size="1rem" />}
            // value={search}
            // onChange={handleSearchChange}
            sx={{
              flex: 1,
            }}
          />
        </Flex>

        {!voters.data.voters.length ? (
          <Box>
            <Text align="center">
              <Balancer>
                No voters found. Add one by clicking the button above.
              </Balancer>
            </Text>
          </Box>
        ) : (
          <Table striped highlightOnHover withBorder>
            <thead>
              <tr>
                <th>Email</th>
                <th>
                  <Text align="center">Status</Text>
                </th>
                <th />
              </tr>
            </thead>

            <tbody>
              {voters.data.voters.map((voter) => (
                <Voter
                  key={voter.id}
                  electionId={voters.data.election.id}
                  voter={voter}
                  refetch={voters.refetch}
                />
              ))}
            </tbody>
          </Table>
        )}
      </Stack>
    </>
  );
};

export default DashboardVoter;
