import type { GetServerSidePropsContext } from "next";
import { api } from "../utils/api";

const ElectionPage = ({ slug }: { slug: string }) => {
  const election = api.election.getElectionData.useQuery(slug, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
  console.log(
    "🚀 ~ file: [electionSlug].tsx:7 ~ ElectionPage ~ election",
    election.data
  );
  if (election.isLoading) return <div>Loading...</div>;
  return <div>[electionSlug]</div>;
};

export default ElectionPage;

export const getServerSideProps = (context: GetServerSidePropsContext) => {
  return {
    props: { slug: context.query.electionSlug },
  };
};
