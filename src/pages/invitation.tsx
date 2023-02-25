import { Button, Container } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { api } from "../utils/api";

const Invitation = () => {
  const router = useRouter();
  const { token } = router.query;
  const tokenQuery = api.token.getById.useQuery(token as string, {
    enabled: !!token,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
  const invitationMutation = api.user.invitation.useMutation({
    onSuccess: async () => await router.push("/dashboard"),
  });

  if (tokenQuery.isLoading) return <Container>Loading...</Container>;
  if (tokenQuery.isError)
    return <Container>{tokenQuery.error.message}</Container>;

  if (typeof token !== "string" || !tokenQuery.data)
    return <Container>No token</Container>;

  return (
    <Container>
      accept invitation
      <Button
        onClick={() => {
          invitationMutation.mutate({
            tokenId: token,
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
            tokenId: token,
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
