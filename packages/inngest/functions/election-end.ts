import { createClient } from '@supabase/supabase-js';
import moment from 'moment';
import { z } from 'zod/v4';

import { sendElectionResult } from '@eboto/email/emails/election-result';

import { BCC_LIMIT, inngest } from '..';
import { Database } from '../../../supabase/types';
import { env } from '../env';

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
        election_id: z.string(),
      })
      .parse(event.data);

    const supabase = createClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const { data: election, error: election_error } = await supabase
      .from('elections')
      .select(
        'name, slug, voting_hour_end, logo_path, start_date, end_date, positions(*, votes(*), candidates(*, votes(*))), commissioners(user: users(email)), voters(*)',
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

    const end_date = moment(election.end_date).add(
      election.voting_hour_end,
      'hours',
    );

    await step.sleepUntil('election-end', end_date.toDate());

    await step.run('send-election-end', async () => {
      let logo_url: string | null = null;

      if (election.logo_path) {
        const { data: image } = supabase.storage
          .from('elections')
          .getPublicUrl(election.logo_path);

        logo_url = image.publicUrl;
      }

      const result = {
        ...election,
        logo_url,
        positions: election.positions.map((position) => ({
          ...position,
          abstain_count: position.votes.length,
          candidates: position.candidates.map((candidate) => ({
            ...candidate,
            vote_count: candidate.votes.length,
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
