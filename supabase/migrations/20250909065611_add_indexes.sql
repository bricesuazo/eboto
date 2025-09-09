CREATE INDEX candidates_election_id_idx1 ON public.candidates USING btree (election_id) WHERE (deleted_at IS NULL);

CREATE INDEX elections_slug_idx ON public.elections USING btree (slug) WHERE (deleted_at IS NULL);

CREATE INDEX generated_election_results_election_id_idx ON public.generated_election_results USING btree (election_id);

CREATE INDEX partylists_election_id_idx1 ON public.partylists USING btree (election_id) WHERE (deleted_at IS NULL);

CREATE INDEX voters_election_id_idx ON public.voters USING btree (election_id) WHERE (deleted_at IS NULL);

CREATE INDEX votes_voter_id_idx ON public.votes USING btree (voter_id);


