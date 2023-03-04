import { Button, Container } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { api } from "../utils/api";

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

  if (
    !router.query.token ||
    typeof router.query.token !== "string" ||
    !tokenQuery.data
  )
    return <Container>No token</Container>;

  if (tokenQuery.isLoading) return <Container>Loading...</Container>;
  if (tokenQuery.isError)
    return <Container>{tokenQuery.error.message}</Container>;

  return (
    <Container>
      accept invitation
      <Button
        onClick={() => {
          invitationMutation.mutate({
            tokenId: router.query.token as string,
            isAccepted: true,
          });
        }}
        isLoading={invitationMutation.isLoading}
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
        isLoading={invitationMutation.isLoading}
      >
        Decline
      </Button>
    </Container>
  );
};

export default Invitation;
