import { useRouter } from "next/router";
import { api } from "../utils/api";

const ElectionPage = () => {
  const { electionSlug } = useRouter().query;
  const election = api.election.getElectionData.useQuery(
    electionSlug as string,
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: false,
    }
  );
  if (election.isLoading) return <div>Loading...</div>;
  if (election.isError) return <div>Error: {election.error.message}</div>;

  if (!election.data) return <div>Not found</div>;

  return <div>{election.data.name}ddd</div>;
};

export default ElectionPage;
