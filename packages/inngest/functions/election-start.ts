import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { sendElectionStart } from "@eboto/email/emails/election-start";

import { inngest } from "..";
import { Database } from "../../../supabase/types";
import { env } from "../env.mjs";

export default inngest.createFunction(
  {
    id: "election-start",
    cancelOn: [
      {
        event: "election",
        match: "data.election_id",
      },
    ],
  },
  { event: "election-start" },
  async ({ event, step }) => {
    const { election_id } = z
      .object({
        election_id: z.string(),
      })
      .parse(event.data);

    const supabase = createClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const { data: election } = await supabase
      .from("elections")
      .select(
        "name, slug, voting_hour_start, start_date, end_date, publicity, commissioners(user: users(email)), voters(*)",
      )
      .eq("id", election_id)
      .single();

    if (!election) throw new Error("Election not found");

    const start_date = new Date(election.start_date);
    start_date.setHours(election.voting_hour_start);

    await step.sleepUntil("election-start", start_date);

    const voters = election.voters.map((voter) => voter.email);
    const commissioners = election.commissioners
      .filter((commissioner) => commissioner.user)
      .map((commissioner) => commissioner.user!.email);

    await step.run("send-election-start", async () => {
      await Promise.all([
        voters.length > 0 &&
          sendElectionStart({
            isForCommissioner: false,
            election: {
              name: election.name,
              slug: election.slug,
              start_date: new Date(election.start_date),
              end_date: new Date(election.end_date),
            },
            emails: voters,
          }),
        commissioners.length > 0 &&
          sendElectionStart({
            isForCommissioner: true,
            election: {
              name: election.name,
              slug: election.slug,
              start_date: new Date(election.start_date),
              end_date: new Date(election.end_date),
            },
            emails: commissioners,
          }),
      ]);

      if (election.publicity === "PRIVATE") {
        await supabase
          .from("elections")
          .update({
            publicity: "VOTER",
          })
          .eq("id", election_id);
      }
    });

    return { success: true };
  },
);
