import {
  Button,
  Container,
  Center,
  Loader,
  Text,
  Box,
  Group,
  Stack,
  rem,
} from "@mantine/core";
import { useRouter } from "next/router";
import { api } from "../utils/api";
import Balancer from "react-wrap-balancer";

const Invitation = () => {
  const router = useRouter();
  const tokenQuery = api.token.getById.useQuery(router.query.token as string, {
    enabled: router.isReady && !!router.query.token,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
  const invitationMutation = api.user.invitation.useMutation({
    onSuccess: async () => await router.push("/dashboard"),
  });

  if (tokenQuery.isLoading)
    return (
      <Center h="100%">
        <Loader size="lg" />
      </Center>
    );

  if (tokenQuery.isError)
    return <Container>{tokenQuery.error.message}</Container>;

  if (!router.query.token || !tokenQuery.data)
    return <Container>No token</Container>;

  return (
    <Container>
      <Stack>
        <Box mt={rem(80)}>
          <Text
            sx={{
              fontSize: rem(24),
            }}
            weight="bold"
            align="center"
          >
            <Balancer>
              You have been invited to join {tokenQuery.data.election.name}.
            </Balancer>
          </Text>
          <Text color="dimmed" align="center">
            If you don&apos;t have an account, you will be asked to create one.
          </Text>
        </Box>

        <Group spacing="sm" position="center">
          <Button
            onClick={() => {
              invitationMutation.mutate({
                tokenId: router.query.token as string,
                isAccepted: true,
              });
            }}
            loading={invitationMutation.isLoading}
            size="md"
          >
            Accept
          </Button>
          <Button
            onClick={() => {
              invitationMutation.mutate({
                tokenId: router.query.token as string,
                isAccepted: false,
              });
            }}
            loading={invitationMutation.isLoading}
            variant="light"
            size="md"
          >
            Decline
          </Button>
        </Group>
      </Stack>
    </Container>
  );
};

export default Invitation;
