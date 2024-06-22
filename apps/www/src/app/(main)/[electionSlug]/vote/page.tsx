import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import VoteForm from "@/components/vote-form";
import { api } from "@/trpc/server";
import { createClient as createClientAdmin } from "@/utils/supabase/admin";
import { createClient as createClientServer } from "@/utils/supabase/server";
import { Box, Container, Stack, Text, Title } from "@mantine/core";
import moment from "moment";
import Balancer from "react-wrap-balancer";

import { isElectionOngoing, parseHourTo12HourFormat } from "@eboto/constants";

export async function generateMetadata({
  params: { electionSlug },
}: {
  params: { electionSlug: string };
}): Promise<Metadata> {
  const supabaseAdmin = createClientAdmin();
  const { data: election } = await supabaseAdmin
    .from("elections")
    .select("name")
    .eq("slug", electionSlug)
    .is("deleted_at", null)
    .single();

  if (!election) return notFound();

  return {
    title: `${election.name} – Vote`,
  };
}

export default async function VotePage({
  params: { electionSlug },
}: {
  params: { electionSlug: string };
}) {
  const supabaseServer = createClientServer();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) redirect(`/sign-in?next=/${electionSlug}/vote`);

  const supabaseAdmin = createClientAdmin();
  const { data: election } = await supabaseAdmin
    .from("elections")
    .select()
    .eq("slug", electionSlug)
    .is("deleted_at", null)
    .single();

  if (!election) notFound();

  if (!isElectionOngoing({ election })) redirect(`/${election.slug}`);

  const { data: voter } = await supabaseAdmin
    .from("voters")
    .select("id, field")
    .eq("email", user.email ?? "")
    .eq("election_id", election.id)
    .is("deleted_at", null)
    .single();

  const { data: voter_fields } = await supabaseAdmin
    .from("voter_fields")
    .select()
    .eq("election_id", election.id)
    .is("deleted_at", null);

  // if (
  //   voter === null
  //   // ||
  //   // voter_fields === null ||
  //   // (voter_fields.length > 0 && !voter.field) ||
  //   // (voter.field &&
  //   //   Object.values(voter.field as Record<string, string>).some(
  //   //     (value) => !value || value.trim() === "",
  //   //   ))
  // )
  //   redirect(`/${election.slug}`);

  if (voter) {
    const { data: votes, error: votes_error } = await supabaseAdmin
      .from("votes")
      .select()
      .eq("voter_id", voter.id)
      .eq("election_id", election.id);

    if (votes_error) notFound();

    if (votes.length) redirect(`/${election.slug}/realtime`);
  }

  if (election.publicity === "PRIVATE") {
    const { data: commissioner } = await supabaseAdmin
      .from("commissioners")
      .select()
      .eq("user_id", user.id)
      .eq("election_id", election.id)
      .is("deleted_at", null)
      .single();

    if (!commissioner) notFound();

    if (!voter) redirect(`/${election.slug}/realtime`);
  } else if (
    election.publicity === "VOTER" ||
    election.publicity === "PUBLIC"
  ) {
    const { data: votes } = await supabaseAdmin
      .from("votes")
      .select()
      .eq("voter_id", voter.id)
      .eq("election_id", election.id);

    if (!votes) notFound();

    const { data: commissioner } = await supabaseAdmin
      .from("commissioners")
      .select()
      .eq("user_id", user.id)
      .eq("election_id", election.id)
      .single();

    if (votes.length > 0 && commissioner && !voter && !voter)
      redirect(`/${election.slug}/realtime`);
  }

  const positions = await api.election.getElectionVoting.query(election.id);

  return (
    <Container py="xl" size="md">
      <Stack pos="relative">
        <Box>
          <Title ta="center">
            <Balancer>Cast your vote for {election.name}</Balancer>
          </Title>
          <Text ta="center">
            <Balancer>Select your candidates for each position.</Balancer>
          </Text>
          <Text ta="center">
            <Balancer>
              {moment(election.start_date).local().format("MMMM DD, YYYY")}
              {" - "}
              {moment(election.end_date).local().format("MMMM DD, YYYY")}
            </Balancer>
          </Text>
          <Text ta="center">
            Voting hours:{" "}
            {election.voting_hour_start === 0 && election.voting_hour_end === 24
              ? "Whole day"
              : parseHourTo12HourFormat(election.voting_hour_start) +
                " - " +
                parseHourTo12HourFormat(election.voting_hour_end)}
          </Text>
        </Box>
        <VoteForm election={election} positions={positions} />
      </Stack>
    </Container>
  );
}
