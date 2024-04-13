alter table "public"."generated_election_results" alter column "result" set data type jsonb using "result"::jsonb;

alter table "public"."voters" alter column "field" set data type jsonb using "field"::jsonb;

CREATE INDEX candidates_election_id_idx ON public.candidates USING btree (election_id);

CREATE INDEX candidates_id_election_id_idx ON public.candidates USING btree (id, election_id);

CREATE INDEX candidates_slug_election_id_idx ON public.candidates USING btree (slug, election_id);

CREATE INDEX candidates_slug_idx ON public.candidates USING btree (slug);

CREATE INDEX commissioners_election_id_idx ON public.commissioners USING btree (election_id);

CREATE INDEX commissioners_user_id_election_id_idx ON public.commissioners USING btree (user_id, election_id);

CREATE INDEX commissioners_user_id_idx ON public.commissioners USING btree (user_id);

CREATE INDEX partylists_election_id_idx ON public.partylists USING btree (election_id);

CREATE INDEX positions_election_id_idx ON public.positions USING btree (election_id);

CREATE INDEX variants_price_product_id_idx ON public.variants USING btree (price, product_id);

CREATE INDEX variants_product_id_idx ON public.variants USING btree (product_id);

CREATE INDEX voter_fields_election_id_idx ON public.voter_fields USING btree (election_id);

CREATE INDEX voter_fields_id_election_id_idx ON public.voter_fields USING btree (id, election_id);

CREATE INDEX voters_email_election_id_idx ON public.voters USING btree (email, election_id);

CREATE INDEX voters_email_idx ON public.voters USING btree (email);

CREATE INDEX voters_id_election_id_idx ON public.voters USING btree (id, election_id);

CREATE INDEX votes_election_id_voter_id_idx ON public.votes USING btree (election_id, voter_id);


