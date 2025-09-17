import { createClient } from '@supabase/supabase-js';
import moment from 'moment';
import { z } from 'zod/v4';

import { filterVotes } from '@eboto/constants';
import { sendElectionResult } from '@eboto/email/emails/election-result';
import { env } from '@eboto/env';

import { BCC_LIMIT, inngest } from '..';
import { Database } from '../../../supabase/types';

export default inngest.createFunction(
  {
    id: 'election-end',
    retries: 0,
    cancelOn: [
      {
        event: 'election',
        match: 'data.election_id',
      },
    ],
  },
  { event: 'election-end' },
  async ({ event, step }) => {
    const { election_id } = z
      .object({
        election_id: z.uuid(),
      })
      .parse(event.data);

    const supabase = createClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const { data: election, error: election_error } = await supabase
      .from('elections')
      .select(
        `name, slug, voting_hour_end, logo_path, start_date, end_date, 
        positions(id, name, 
          votes(voters(deleted_at)), 
          candidates(id, first_name, middle_name, last_name, 
            votes(voters(deleted_at))
          )
        ),
        commissioners(user: users(email)), voters(email)`,
      )
      .eq('id', election_id)
      .is('deleted_at', null)
      .is('positions.deleted_at', null)
      .is('positions.candidates.deleted_at', null)
      .is('commissioners.deleted_at', null)
      .is('voters.deleted_at', null)
      .single();

    if (election_error)
      throw new Error('Failed to fetch election: ' + election_error.message);

    const end_date = moment
      .utc(election.end_date)
      .add(election.voting_hour_end, 'hours')
      .subtract(8, 'hours');

    await step.sleepUntil('election-end', end_date.toISOString());

    await step.run('send-election-end', async () => {
      let logo_url: string | null = null;

      if (election.logo_path) {
        const { data: image } = supabase.storage
          .from('elections')
          .getPublicUrl(election.logo_path);

        logo_url = image.publicUrl;
      }

      const result = {
        name: election.name,
        slug: election.slug,
        start_date: election.start_date,
        end_date: election.end_date,
        logo_url,
        positions: election.positions.map((position) => ({
          id: position.id,
          name: position.name,
          abstain_count: filterVotes(position.votes).length,
          candidates: position.candidates.map((candidate) => ({
            id: candidate.id,
            first_name: candidate.first_name,
            middle_name: candidate.middle_name,
            last_name: candidate.last_name,
            vote_count: filterVotes(candidate.votes).length,
          })),
        })),
      };

      const emails = [
        ...new Set([
          ...election.voters.map((voter) => voter.email),
          ...election.commissioners
            .filter((commissioner) => commissioner.user)
            .map((commissioner) =>
              commissioner.user ? commissioner.user.email : '',
            ),
        ]),
      ];

      const { error: insert_error } = await supabase
        .from('generated_election_results')
        .insert({ election_id, result });

      if (insert_error)
        throw new Error(
          'Failed to insert election results: ' + insert_error.message,
        );

      if (emails.length > 0)
        await Promise.all(
          Array.from({ length: Math.ceil(emails.length / BCC_LIMIT) }).map(
            (_, index) =>
              sendElectionResult({
                emails: emails.slice(
                  index * BCC_LIMIT,
                  (index + 1) * BCC_LIMIT,
                ),
                election: result,
              }),
          ),
        );
    });

    return { success: true };
  },
);
