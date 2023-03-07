import { Text } from "@mantine/core";
import { useRouter } from "next/router";
import Moment from "react-moment";
import { convertNumberToHour } from "../../../utils/convertNumberToHour";
import { api } from "../../../utils/api";

const DashboardOverview = () => {
  const router = useRouter();

  const electionOverview = api.election.getElectionOverview.useQuery(
    router.query.electionSlug as string,
    {
      enabled: router.isReady,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
    }
  );

  return (
    <>
      {electionOverview.isLoading ? (
        <Text>Loading...</Text>
      ) : electionOverview.isError ? (
        <Text>Error: {electionOverview.error.message}</Text>
      ) : !electionOverview.data ? (
        <Text>No election found</Text>
      ) : (
        <>
          <Text>{electionOverview.data.election.name}</Text>
          <Text>{electionOverview.data.election.slug}</Text>

          <Text>
            {electionOverview.data.voted._count._all}/
            {electionOverview.data.voters._count._all} voted (
            {isNaN(
              (electionOverview.data.voted._count._all /
                electionOverview.data.voters._count._all) *
                100
            )
              ? 0
              : (
                  (electionOverview.data.voted._count._all /
                    electionOverview.data.voters._count._all) *
                  100
                ).toFixed(2)}
            %)
          </Text>
          <Text>
            Created:{" "}
            <Moment
              format="MMMM DD, YYYY hh:mm A"
              date={electionOverview.data.election.createdAt}
            />{" "}
            (
            <Moment
              fromNow
              interval={1000}
              date={electionOverview.data.election.createdAt}
            />
            )
          </Text>
          <Text>
            {electionOverview.data.election.publicity.charAt(0) +
              electionOverview.data.election.publicity.slice(1).toLowerCase()}
          </Text>
          <Text>{electionOverview.data.positions._count._all} position/s</Text>
          <Text>
            {electionOverview.data.candidates._count._all} candidate/s
          </Text>
          <Text>
            {electionOverview.data.invitedVoters._count._all} invited voter/s
          </Text>
          <Text>
            {electionOverview.data.declinedVoters._count._all} declined voter/s
          </Text>
          <Text>
            Open from{" "}
            {convertNumberToHour(electionOverview.data.election.voting_start)}{" "}
            to {convertNumberToHour(electionOverview.data.election.voting_end)}
          </Text>
        </>
      )}
    </>
  );
};

export default DashboardOverview;
