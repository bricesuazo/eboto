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
  console.log(
    "🚀 ~ file: [electionSlug].tsx:22 ~ ElectionPage ~ election.data:",
    election.data
  );

  return <div>{election.data.name}ddd</div>;
};

export default ElectionPage;
