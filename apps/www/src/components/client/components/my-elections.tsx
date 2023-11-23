"use client";

import { api } from "@/trpc/client";
import { Box, Text } from "@mantine/core";

import type { RouterOutputs } from "@eboto/api";

import DashboardCard from "./dashboard-card";

export function MyElectionsAsCommissioner({
  initialData,
}: {
  initialData: RouterOutputs["election"]["getMyElectionAsCommissioner"];
}) {
  const getMyElectionAsCommissionerQuery =
    api.election.getMyElectionAsCommissioner.useQuery(undefined, {
      initialData,
    });
  return (
    <>
      {getMyElectionAsCommissionerQuery.data.length === 0 ? (
        <Box h={72}>
          <Text>No elections found</Text>
        </Box>
      ) : (
        getMyElectionAsCommissionerQuery.data
          .filter((commissioner) => !commissioner.election.deleted_at)
          .map((commissioner) => (
            <DashboardCard
              key={commissioner.id}
              election={commissioner.election}
              type="manage"
            />
          ))
      )}
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
  return (
    <>
      {getMyElectionAsVoterQuery.data.length === 0 ? (
        <Box h={72}>
          <Text>No vote elections found</Text>
        </Box>
      ) : (
        getMyElectionAsVoterQuery.data
          .filter((voter) => !voter.election.deleted_at)
          .map((voter) => (
            <DashboardCard
              key={voter.id}
              election={voter.election}
              type="vote"
              hasVoted={voter.election.votes.length > 0}
            />
          ))
      )}
    </>
  );
}
