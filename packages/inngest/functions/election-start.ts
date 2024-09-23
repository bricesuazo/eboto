import { createClient } from "@supabase/supabase-js";
import moment from "moment";
import { z } from "zod";

import { sendElectionStart } from "@eboto/email/emails/election-start";

import { BCC_LIMIT, inngest } from "..";
import { Database } from "../../../supabase/types";
import { env } from "../env.mjs";

export default inngest.createFunction(
  {
    id: "election-start",
    retries: 0,
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
        "name, slug, voting_hour_start, start_date, end_date, publicity, commissioners(user: users!inner(email)), voters(*)",
      )
      .eq("id", election_id)
      .is("deleted_at", null)
      .is("commissioners.deleted_at", null)
      .is("voters.deleted_at", null)
      .single();

    if (!election) throw new Error("Election not found");

    const start_date = moment(election.start_date).add(
      election.voting_hour_start,
      "hours",
    );

    await step.sleepUntil("election-start", start_date.toDate());

    const voters = [...new Set(election.voters.map((voter) => voter.email))];
    const commissioners = [
      ...new Set(
        election.commissioners
          .filter((commissioner) => commissioner.user)
          .map((commissioner) => commissioner.user.email),
      ),
    ];

    await step.run("send-election-start", async () => {
      await Promise.all([
        voters.length > 0 &&
          Array.from({ length: Math.ceil(voters.length / BCC_LIMIT) }).map(
            (_, index) =>
              sendElectionStart({
                isForCommissioner: false,
                election: {
                  name: election.name,
                  slug: election.slug,
                  start_date: new Date(election.start_date),
                  end_date: new Date(election.end_date),
                },
                emails: voters.slice(
                  index * BCC_LIMIT,
                  (index + 1) * BCC_LIMIT,
                ),
              }),
          ),
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
