import { useRouter } from "next/router";
import { api } from "../utils/api";

const Invitation = () => {
  const router = useRouter();
  console.log(router);
  const { token } = router.query;

  //   const invitationMutation = api.election.invitation.useMutation();
  //   const electionQuery = api.election.getBySlug;

  return <div>Invitation</div>;
};

export default Invitation;
