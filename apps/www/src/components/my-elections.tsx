"use client";

import { Box, Group, TabsPanel, Text } from "@mantine/core";
import moment from "moment";

import type { RouterOutputs } from "@eboto/api";
import { isElectionEnded, isElectionOngoing } from "@eboto/constants";

import { api } from "~/trpc/client";
import DashboardCard from "./dashboard-card";

function NoElections({ type }: { type: "manage" | "vote" }) {
  return (
    <Box h={72}>
      <Text>No {type === "vote" && "vote "}elections found</Text>
    </Box>
  );
}
export function MyElectionsAsCommissioner({
  initialData,
}: {
  initialData: RouterOutputs["election"]["getMyElectionAsCommissioner"];
}) {
  const getMyElectionAsCommissionerQuery =
    api.election.getMyElectionAsCommissioner.useQuery(undefined, {
      initialData,
    });

  const upcoming_elections = getMyElectionAsCommissionerQuery.data.filter(
    (election) => moment(election.start_date).isAfter(moment()),
  );
  const ongoing_elections = getMyElectionAsCommissionerQuery.data.filter(
    (election) => isElectionOngoing({ election }),
  );
  const ended_elections = getMyElectionAsCommissionerQuery.data.filter(
    (election) => isElectionEnded({ election }),
  );

  return (
    <>
      <TabsPanel value="ongoing" component={Group}>
        {ongoing_elections.length === 0 ? (
          <NoElections type="manage" />
        ) : (
          ongoing_elections.map((election) => (
            <DashboardCard
              key={election.id}
              election={election}
              type="manage"
            />
          ))
        )}
      </TabsPanel>
      <TabsPanel value="upcoming" component={Group}>
        {upcoming_elections.length === 0 ? (
          <NoElections type="manage" />
        ) : (
          upcoming_elections.map((election) => (
            <DashboardCard
              key={election.id}
              election={election}
              type="manage"
            />
          ))
        )}
      </TabsPanel>
      <TabsPanel value="ended" component={Group}>
        {ended_elections.length === 0 ? (
          <NoElections type="manage" />
        ) : (
          ended_elections.map((election) => (
            <DashboardCard
              key={election.id}
              election={election}
              type="manage"
            />
          ))
        )}
      </TabsPanel>
    </>
  );
}

export function MyElectionsAsVoter({
  initialData,
}: {
  initialData: RouterOutputs["election"]["getMyElectionAsVoter"];
}) {
  const getMyElectionAsVoterQuery = api.election.getMyElectionAsVoter.useQuery(
    undefined,
    {
      initialData,
    },
  );

  const upcoming_elections = getMyElectionAsVoterQuery.data.filter((election) =>
    moment(election.start_date).isAfter(moment()),
  );
  const ongoing_elections = getMyElectionAsVoterQuery.data.filter((election) =>
    isElectionOngoing({ election }),
  );
  const ended_elections = getMyElectionAsVoterQuery.data.filter((election) =>
    isElectionEnded({ election }),
  );

  return (
    <>
      <TabsPanel value="ongoing" component={Group}>
        {ongoing_elections.length === 0 ? (
          <NoElections type="vote" />
        ) : (
          ongoing_elections.map((election) => (
            <DashboardCard
              key={election.id}
              election={election}
              type="vote"
              votes={election.votes}
            />
          ))
        )}
      </TabsPanel>
      <TabsPanel value="upcoming" component={Group}>
        {upcoming_elections.length === 0 ? (
          <NoElections type="vote" />
        ) : (
          upcoming_elections.map((election) => (
            <DashboardCard
              key={election.id}
              election={election}
              type="vote"
              votes={election.votes}
            />
          ))
        )}
      </TabsPanel>
      <TabsPanel value="ended" component={Group}>
        {ended_elections.length === 0 ? (
          <NoElections type="vote" />
        ) : (
          ended_elections.map((election) => (
            <DashboardCard
              key={election.id}
              election={election}
              type="vote"
              votes={election.votes}
            />
          ))
        )}
      </TabsPanel>
    </>
  );
}
