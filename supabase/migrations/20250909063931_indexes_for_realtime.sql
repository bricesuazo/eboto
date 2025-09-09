CREATE INDEX candidates_position_id_idx ON public.candidates USING btree (position_id);

CREATE INDEX positions_election_id_idx1 ON public.positions USING btree (election_id) WHERE (deleted_at IS NULL);

CREATE INDEX votes_candidate_id_idx ON public.votes USING btree (candidate_id);

CREATE INDEX votes_position_id_idx ON public.votes USING btree (position_id);


