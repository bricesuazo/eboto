create type "public"."publicity" as enum ('PRIVATE', 'VOTER', 'PUBLIC');

create table "public"."achievements" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "year" date not null,
    "updated_at" timestamp with time zone not null default now(),
    "credential_id" uuid not null,
    "deleted_at" timestamp with time zone
);


alter table "public"."achievements" enable row level security;

create table "public"."admin_commissioners_messages" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "message" text not null,
    "user_id" uuid not null,
    "room_id" uuid not null,
    "deleted_at" timestamp with time zone
);


alter table "public"."admin_commissioners_messages" enable row level security;

create table "public"."admin_commissioners_rooms" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "election_id" uuid not null,
    "deleted_at" timestamp with time zone
);


alter table "public"."admin_commissioners_rooms" enable row level security;

create table "public"."affiliations" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "org_name" text not null,
    "org_position" text not null,
    "start_year" date not null,
    "end_year" date not null,
    "updated_at" timestamp with time zone not null default now(),
    "credential_id" uuid not null,
    "deleted_at" timestamp with time zone
);


alter table "public"."affiliations" enable row level security;

create table "public"."candidates" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "slug" text not null,
    "first_name" text not null,
    "middle_name" text,
    "last_name" text not null,
    "image_path" text,
    "updated_at" timestamp with time zone not null default now(),
    "election_id" uuid not null,
    "credential_id" uuid not null,
    "position_id" uuid not null,
    "partylist_id" uuid not null,
    "deleted_at" timestamp with time zone
);


alter table "public"."candidates" enable row level security;

create table "public"."commissioners" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid not null,
    "election_id" uuid not null,
    "deleted_at" timestamp with time zone
);


alter table "public"."commissioners" enable row level security;

create table "public"."commissioners_voters_messages" (
    "created_at" timestamp with time zone not null default now(),
    "message" text not null,
    "deleted_at" timestamp with time zone,
    "user_id" uuid not null,
    "id" uuid not null default gen_random_uuid(),
    "room_id" uuid not null
);


alter table "public"."commissioners_voters_messages" enable row level security;

create table "public"."commissioners_voters_rooms" (
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "deleted_at" timestamp with time zone,
    "election_id" uuid not null,
    "id" uuid not null default gen_random_uuid()
);


alter table "public"."commissioners_voters_rooms" enable row level security;

create table "public"."credentials" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone
);


alter table "public"."credentials" enable row level security;

create table "public"."elections" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "slug" text not null,
    "name" text not null,
    "description" text,
    "start_date" timestamp with time zone not null,
    "end_date" timestamp with time zone not null,
    "voting_hour_start" smallint not null default '7'::smallint,
    "voting_hour_end" smallint not null default '19'::smallint,
    "publicity" publicity not null default 'PRIVATE'::publicity,
    "logo_path" text,
    "voter_domain" text,
    "is_candidates_visible_in_realtime_when_ongoing" boolean not null default false,
    "name_arrangement" smallint not null default '0'::smallint,
    "variant_id" smallint not null,
    "deleted_at" timestamp with time zone,
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."elections" enable row level security;

create table "public"."elections_plus" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid not null,
    "redeemed_at" timestamp with time zone,
    "deleted_at" timestamp with time zone
);


alter table "public"."elections_plus" enable row level security;

create table "public"."events_attended" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "year" date not null,
    "updated_at" timestamp with time zone not null default now(),
    "credential_id" uuid not null,
    "deleted_at" timestamp with time zone
);


alter table "public"."events_attended" enable row level security;

create table "public"."generated_election_results" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "election_id" uuid not null,
    "result" json not null,
    "deleted_at" timestamp with time zone
);


alter table "public"."generated_election_results" enable row level security;

create table "public"."partylists" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "acronym" text not null,
    "description" text,
    "logo_path" text,
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone,
    "election_id" uuid not null
);


alter table "public"."partylists" enable row level security;

create table "public"."platforms" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "title" text not null,
    "description" text,
    "updated_at" timestamp with time zone not null default now(),
    "candidate_id" uuid not null,
    "deleted_at" timestamp with time zone
);


alter table "public"."platforms" enable row level security;

create table "public"."positions" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "description" text,
    "order" smallint not null,
    "min" smallint not null default '0'::smallint,
    "max" smallint not null default '1'::smallint,
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone,
    "election_id" uuid not null
);


alter table "public"."positions" enable row level security;

create table "public"."products" (
    "id" integer generated by default as identity not null,
    "name" text not null
);


alter table "public"."products" enable row level security;

create table "public"."reported_problems" (
    "created_at" timestamp with time zone not null default now(),
    "subject" text not null,
    "description" text not null,
    "election_id" uuid not null,
    "user_id" uuid not null,
    "deleted_at" timestamp with time zone,
    "id" uuid not null default gen_random_uuid()
);


alter table "public"."reported_problems" enable row level security;

create table "public"."users" (
    "id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "name" text,
    "email" character varying not null,
    "image_path" text,
    "deleted_at" timestamp with time zone
);


alter table "public"."users" enable row level security;

create table "public"."variants" (
    "id" integer generated by default as identity not null,
    "name" text not null,
    "price" smallint not null,
    "product_id" integer not null
);


alter table "public"."variants" enable row level security;

create table "public"."voter_fields" (
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "election_id" uuid not null,
    "deleted_at" timestamp with time zone,
    "id" uuid not null default gen_random_uuid()
);


alter table "public"."voter_fields" enable row level security;

create table "public"."voters" (
    "created_at" timestamp with time zone not null default now(),
    "email" text not null,
    "field" json,
    "deleted_at" timestamp with time zone,
    "election_id" uuid not null,
    "id" uuid not null default gen_random_uuid()
);


alter table "public"."voters" enable row level security;

create table "public"."votes" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "voter_id" uuid not null,
    "candidate_id" uuid,
    "position_id" uuid,
    "election_id" uuid not null
);


alter table "public"."votes" enable row level security;

CREATE UNIQUE INDEX achievements_pkey ON public.achievements USING btree (id);

CREATE UNIQUE INDEX admin_commissioners_messages_pkey ON public.admin_commissioners_messages USING btree (id);

CREATE UNIQUE INDEX admin_commissioners_rooms_pkey ON public.admin_commissioners_rooms USING btree (id);

CREATE UNIQUE INDEX affiliations_pkey ON public.affiliations USING btree (id);

CREATE UNIQUE INDEX candidates_pkey ON public.candidates USING btree (id);

CREATE UNIQUE INDEX commissioners_pkey ON public.commissioners USING btree (id);

CREATE UNIQUE INDEX commissioners_voters_messages_pkey ON public.commissioners_voters_messages USING btree (id);

CREATE UNIQUE INDEX commissioners_voters_rooms_pkey ON public.commissioners_voters_rooms USING btree (id);

CREATE UNIQUE INDEX credentials_pkey ON public.credentials USING btree (id);

CREATE UNIQUE INDEX elections_pkey ON public.elections USING btree (id);

CREATE UNIQUE INDEX elections_plus_pkey ON public.elections_plus USING btree (id);

CREATE UNIQUE INDEX elections_slug_key ON public.elections USING btree (slug);

CREATE UNIQUE INDEX events_attended_pkey ON public.events_attended USING btree (id);

CREATE UNIQUE INDEX generated_election_results_pkey ON public.generated_election_results USING btree (id);

CREATE UNIQUE INDEX partylists_pkey ON public.partylists USING btree (id);

CREATE UNIQUE INDEX platforms_pkey ON public.platforms USING btree (id);

CREATE UNIQUE INDEX positions_pkey ON public.positions USING btree (id);

CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);

CREATE UNIQUE INDEX reported_problems_pkey ON public.reported_problems USING btree (id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_id_key ON public.users USING btree (id);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id, email);

CREATE UNIQUE INDEX variants_pkey ON public.variants USING btree (id);

CREATE UNIQUE INDEX voter_fields_pkey ON public.voter_fields USING btree (id);

CREATE UNIQUE INDEX voters_pkey ON public.voters USING btree (id);

CREATE UNIQUE INDEX votes_pkey ON public.votes USING btree (id);

alter table "public"."achievements" add constraint "achievements_pkey" PRIMARY KEY using index "achievements_pkey";

alter table "public"."admin_commissioners_messages" add constraint "admin_commissioners_messages_pkey" PRIMARY KEY using index "admin_commissioners_messages_pkey";

alter table "public"."admin_commissioners_rooms" add constraint "admin_commissioners_rooms_pkey" PRIMARY KEY using index "admin_commissioners_rooms_pkey";

alter table "public"."affiliations" add constraint "affiliations_pkey" PRIMARY KEY using index "affiliations_pkey";

alter table "public"."candidates" add constraint "candidates_pkey" PRIMARY KEY using index "candidates_pkey";

alter table "public"."commissioners" add constraint "commissioners_pkey" PRIMARY KEY using index "commissioners_pkey";

alter table "public"."commissioners_voters_messages" add constraint "commissioners_voters_messages_pkey" PRIMARY KEY using index "commissioners_voters_messages_pkey";

alter table "public"."commissioners_voters_rooms" add constraint "commissioners_voters_rooms_pkey" PRIMARY KEY using index "commissioners_voters_rooms_pkey";

alter table "public"."credentials" add constraint "credentials_pkey" PRIMARY KEY using index "credentials_pkey";

alter table "public"."elections" add constraint "elections_pkey" PRIMARY KEY using index "elections_pkey";

alter table "public"."elections_plus" add constraint "elections_plus_pkey" PRIMARY KEY using index "elections_plus_pkey";

alter table "public"."events_attended" add constraint "events_attended_pkey" PRIMARY KEY using index "events_attended_pkey";

alter table "public"."generated_election_results" add constraint "generated_election_results_pkey" PRIMARY KEY using index "generated_election_results_pkey";

alter table "public"."partylists" add constraint "partylists_pkey" PRIMARY KEY using index "partylists_pkey";

alter table "public"."platforms" add constraint "platforms_pkey" PRIMARY KEY using index "platforms_pkey";

alter table "public"."positions" add constraint "positions_pkey" PRIMARY KEY using index "positions_pkey";

alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "public"."reported_problems" add constraint "reported_problems_pkey" PRIMARY KEY using index "reported_problems_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."variants" add constraint "variants_pkey" PRIMARY KEY using index "variants_pkey";

alter table "public"."voter_fields" add constraint "voter_fields_pkey" PRIMARY KEY using index "voter_fields_pkey";

alter table "public"."voters" add constraint "voters_pkey" PRIMARY KEY using index "voters_pkey";

alter table "public"."votes" add constraint "votes_pkey" PRIMARY KEY using index "votes_pkey";

alter table "public"."achievements" add constraint "public_achievements_credential_id_fkey" FOREIGN KEY (credential_id) REFERENCES credentials(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."achievements" validate constraint "public_achievements_credential_id_fkey";

alter table "public"."admin_commissioners_messages" add constraint "public_admin_commissioners_messages_room_id_fkey" FOREIGN KEY (room_id) REFERENCES admin_commissioners_rooms(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."admin_commissioners_messages" validate constraint "public_admin_commissioners_messages_room_id_fkey";

alter table "public"."admin_commissioners_messages" add constraint "public_admin_commissioners_messages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."admin_commissioners_messages" validate constraint "public_admin_commissioners_messages_user_id_fkey";

alter table "public"."admin_commissioners_rooms" add constraint "public_admin_commissioners_rooms_election_id_fkey" FOREIGN KEY (election_id) REFERENCES elections(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."admin_commissioners_rooms" validate constraint "public_admin_commissioners_rooms_election_id_fkey";

alter table "public"."affiliations" add constraint "public_affiliations_credential_id_fkey" FOREIGN KEY (credential_id) REFERENCES credentials(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."affiliations" validate constraint "public_affiliations_credential_id_fkey";

alter table "public"."candidates" add constraint "public_candidates_credential_id_fkey" FOREIGN KEY (credential_id) REFERENCES credentials(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."candidates" validate constraint "public_candidates_credential_id_fkey";

alter table "public"."candidates" add constraint "public_candidates_election_id_fkey" FOREIGN KEY (election_id) REFERENCES elections(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."candidates" validate constraint "public_candidates_election_id_fkey";

alter table "public"."candidates" add constraint "public_candidates_partylist_id_fkey" FOREIGN KEY (partylist_id) REFERENCES partylists(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."candidates" validate constraint "public_candidates_partylist_id_fkey";

alter table "public"."candidates" add constraint "public_candidates_position_id_fkey" FOREIGN KEY (position_id) REFERENCES positions(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."candidates" validate constraint "public_candidates_position_id_fkey";

alter table "public"."commissioners" add constraint "public_commissioners_election_id_fkey" FOREIGN KEY (election_id) REFERENCES elections(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."commissioners" validate constraint "public_commissioners_election_id_fkey";

alter table "public"."commissioners" add constraint "public_commissioners_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."commissioners" validate constraint "public_commissioners_user_id_fkey";

alter table "public"."commissioners_voters_messages" add constraint "public_commissioners_voters_messages_room_id_fkey" FOREIGN KEY (room_id) REFERENCES commissioners_voters_rooms(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."commissioners_voters_messages" validate constraint "public_commissioners_voters_messages_room_id_fkey";

alter table "public"."commissioners_voters_messages" add constraint "public_commissioners_voters_messages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."commissioners_voters_messages" validate constraint "public_commissioners_voters_messages_user_id_fkey";

alter table "public"."commissioners_voters_rooms" add constraint "public_commissioners_voters_rooms_election_id_fkey" FOREIGN KEY (election_id) REFERENCES elections(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."commissioners_voters_rooms" validate constraint "public_commissioners_voters_rooms_election_id_fkey";

alter table "public"."elections" add constraint "elections_slug_key" UNIQUE using index "elections_slug_key";

alter table "public"."elections" add constraint "public_elections_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES variants(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."elections" validate constraint "public_elections_variant_id_fkey";

alter table "public"."elections_plus" add constraint "public_elections_plus_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."elections_plus" validate constraint "public_elections_plus_user_id_fkey";

alter table "public"."events_attended" add constraint "public_events_attended_credential_id_fkey" FOREIGN KEY (credential_id) REFERENCES credentials(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."events_attended" validate constraint "public_events_attended_credential_id_fkey";

alter table "public"."generated_election_results" add constraint "public_generated_election_results_election_id_fkey" FOREIGN KEY (election_id) REFERENCES elections(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."generated_election_results" validate constraint "public_generated_election_results_election_id_fkey";

alter table "public"."partylists" add constraint "public_partylists_election_id_fkey" FOREIGN KEY (election_id) REFERENCES elections(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."partylists" validate constraint "public_partylists_election_id_fkey";

alter table "public"."platforms" add constraint "public_platforms_candidate_id_fkey" FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."platforms" validate constraint "public_platforms_candidate_id_fkey";

alter table "public"."positions" add constraint "public_positions_election_id_fkey" FOREIGN KEY (election_id) REFERENCES elections(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."positions" validate constraint "public_positions_election_id_fkey";

alter table "public"."reported_problems" add constraint "public_reported_problems_election_id_fkey" FOREIGN KEY (election_id) REFERENCES elections(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."reported_problems" validate constraint "public_reported_problems_election_id_fkey";

alter table "public"."reported_problems" add constraint "public_reported_problems_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."reported_problems" validate constraint "public_reported_problems_user_id_fkey";

alter table "public"."users" add constraint "public_users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."users" validate constraint "public_users_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "users_id_key" UNIQUE using index "users_id_key";

alter table "public"."variants" add constraint "public_variants_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."variants" validate constraint "public_variants_product_id_fkey";

alter table "public"."voter_fields" add constraint "public_voter_fields_election_id_fkey" FOREIGN KEY (election_id) REFERENCES elections(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."voter_fields" validate constraint "public_voter_fields_election_id_fkey";

alter table "public"."voters" add constraint "public_voters_election_id_fkey" FOREIGN KEY (election_id) REFERENCES elections(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."voters" validate constraint "public_voters_election_id_fkey";

alter table "public"."votes" add constraint "public_votes_candidate_id_fkey" FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."votes" validate constraint "public_votes_candidate_id_fkey";

alter table "public"."votes" add constraint "public_votes_election_id_fkey" FOREIGN KEY (election_id) REFERENCES elections(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."votes" validate constraint "public_votes_election_id_fkey";

alter table "public"."votes" add constraint "public_votes_position_id_fkey" FOREIGN KEY (position_id) REFERENCES positions(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."votes" validate constraint "public_votes_position_id_fkey";

alter table "public"."votes" add constraint "public_votes_voter_id_fkey" FOREIGN KEY (voter_id) REFERENCES voters(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."votes" validate constraint "public_votes_voter_id_fkey";

grant delete on table "public"."achievements" to "anon";

grant insert on table "public"."achievements" to "anon";

grant references on table "public"."achievements" to "anon";

grant select on table "public"."achievements" to "anon";

grant trigger on table "public"."achievements" to "anon";

grant truncate on table "public"."achievements" to "anon";

grant update on table "public"."achievements" to "anon";

grant delete on table "public"."achievements" to "authenticated";

grant insert on table "public"."achievements" to "authenticated";

grant references on table "public"."achievements" to "authenticated";

grant select on table "public"."achievements" to "authenticated";

grant trigger on table "public"."achievements" to "authenticated";

grant truncate on table "public"."achievements" to "authenticated";

grant update on table "public"."achievements" to "authenticated";

grant delete on table "public"."achievements" to "service_role";

grant insert on table "public"."achievements" to "service_role";

grant references on table "public"."achievements" to "service_role";

grant select on table "public"."achievements" to "service_role";

grant trigger on table "public"."achievements" to "service_role";

grant truncate on table "public"."achievements" to "service_role";

grant update on table "public"."achievements" to "service_role";

grant delete on table "public"."admin_commissioners_messages" to "anon";

grant insert on table "public"."admin_commissioners_messages" to "anon";

grant references on table "public"."admin_commissioners_messages" to "anon";

grant select on table "public"."admin_commissioners_messages" to "anon";

grant trigger on table "public"."admin_commissioners_messages" to "anon";

grant truncate on table "public"."admin_commissioners_messages" to "anon";

grant update on table "public"."admin_commissioners_messages" to "anon";

grant delete on table "public"."admin_commissioners_messages" to "authenticated";

grant insert on table "public"."admin_commissioners_messages" to "authenticated";

grant references on table "public"."admin_commissioners_messages" to "authenticated";

grant select on table "public"."admin_commissioners_messages" to "authenticated";

grant trigger on table "public"."admin_commissioners_messages" to "authenticated";

grant truncate on table "public"."admin_commissioners_messages" to "authenticated";

grant update on table "public"."admin_commissioners_messages" to "authenticated";

grant delete on table "public"."admin_commissioners_messages" to "service_role";

grant insert on table "public"."admin_commissioners_messages" to "service_role";

grant references on table "public"."admin_commissioners_messages" to "service_role";

grant select on table "public"."admin_commissioners_messages" to "service_role";

grant trigger on table "public"."admin_commissioners_messages" to "service_role";

grant truncate on table "public"."admin_commissioners_messages" to "service_role";

grant update on table "public"."admin_commissioners_messages" to "service_role";

grant delete on table "public"."admin_commissioners_rooms" to "anon";

grant insert on table "public"."admin_commissioners_rooms" to "anon";

grant references on table "public"."admin_commissioners_rooms" to "anon";

grant select on table "public"."admin_commissioners_rooms" to "anon";

grant trigger on table "public"."admin_commissioners_rooms" to "anon";

grant truncate on table "public"."admin_commissioners_rooms" to "anon";

grant update on table "public"."admin_commissioners_rooms" to "anon";

grant delete on table "public"."admin_commissioners_rooms" to "authenticated";

grant insert on table "public"."admin_commissioners_rooms" to "authenticated";

grant references on table "public"."admin_commissioners_rooms" to "authenticated";

grant select on table "public"."admin_commissioners_rooms" to "authenticated";

grant trigger on table "public"."admin_commissioners_rooms" to "authenticated";

grant truncate on table "public"."admin_commissioners_rooms" to "authenticated";

grant update on table "public"."admin_commissioners_rooms" to "authenticated";

grant delete on table "public"."admin_commissioners_rooms" to "service_role";

grant insert on table "public"."admin_commissioners_rooms" to "service_role";

grant references on table "public"."admin_commissioners_rooms" to "service_role";

grant select on table "public"."admin_commissioners_rooms" to "service_role";

grant trigger on table "public"."admin_commissioners_rooms" to "service_role";

grant truncate on table "public"."admin_commissioners_rooms" to "service_role";

grant update on table "public"."admin_commissioners_rooms" to "service_role";

grant delete on table "public"."affiliations" to "anon";

grant insert on table "public"."affiliations" to "anon";

grant references on table "public"."affiliations" to "anon";

grant select on table "public"."affiliations" to "anon";

grant trigger on table "public"."affiliations" to "anon";

grant truncate on table "public"."affiliations" to "anon";

grant update on table "public"."affiliations" to "anon";

grant delete on table "public"."affiliations" to "authenticated";

grant insert on table "public"."affiliations" to "authenticated";

grant references on table "public"."affiliations" to "authenticated";

grant select on table "public"."affiliations" to "authenticated";

grant trigger on table "public"."affiliations" to "authenticated";

grant truncate on table "public"."affiliations" to "authenticated";

grant update on table "public"."affiliations" to "authenticated";

grant delete on table "public"."affiliations" to "service_role";

grant insert on table "public"."affiliations" to "service_role";

grant references on table "public"."affiliations" to "service_role";

grant select on table "public"."affiliations" to "service_role";

grant trigger on table "public"."affiliations" to "service_role";

grant truncate on table "public"."affiliations" to "service_role";

grant update on table "public"."affiliations" to "service_role";

grant delete on table "public"."candidates" to "anon";

grant insert on table "public"."candidates" to "anon";

grant references on table "public"."candidates" to "anon";

grant select on table "public"."candidates" to "anon";

grant trigger on table "public"."candidates" to "anon";

grant truncate on table "public"."candidates" to "anon";

grant update on table "public"."candidates" to "anon";

grant delete on table "public"."candidates" to "authenticated";

grant insert on table "public"."candidates" to "authenticated";

grant references on table "public"."candidates" to "authenticated";

grant select on table "public"."candidates" to "authenticated";

grant trigger on table "public"."candidates" to "authenticated";

grant truncate on table "public"."candidates" to "authenticated";

grant update on table "public"."candidates" to "authenticated";

grant delete on table "public"."candidates" to "service_role";

grant insert on table "public"."candidates" to "service_role";

grant references on table "public"."candidates" to "service_role";

grant select on table "public"."candidates" to "service_role";

grant trigger on table "public"."candidates" to "service_role";

grant truncate on table "public"."candidates" to "service_role";

grant update on table "public"."candidates" to "service_role";

grant delete on table "public"."commissioners" to "anon";

grant insert on table "public"."commissioners" to "anon";

grant references on table "public"."commissioners" to "anon";

grant select on table "public"."commissioners" to "anon";

grant trigger on table "public"."commissioners" to "anon";

grant truncate on table "public"."commissioners" to "anon";

grant update on table "public"."commissioners" to "anon";

grant delete on table "public"."commissioners" to "authenticated";

grant insert on table "public"."commissioners" to "authenticated";

grant references on table "public"."commissioners" to "authenticated";

grant select on table "public"."commissioners" to "authenticated";

grant trigger on table "public"."commissioners" to "authenticated";

grant truncate on table "public"."commissioners" to "authenticated";

grant update on table "public"."commissioners" to "authenticated";

grant delete on table "public"."commissioners" to "service_role";

grant insert on table "public"."commissioners" to "service_role";

grant references on table "public"."commissioners" to "service_role";

grant select on table "public"."commissioners" to "service_role";

grant trigger on table "public"."commissioners" to "service_role";

grant truncate on table "public"."commissioners" to "service_role";

grant update on table "public"."commissioners" to "service_role";

grant delete on table "public"."commissioners_voters_messages" to "anon";

grant insert on table "public"."commissioners_voters_messages" to "anon";

grant references on table "public"."commissioners_voters_messages" to "anon";

grant select on table "public"."commissioners_voters_messages" to "anon";

grant trigger on table "public"."commissioners_voters_messages" to "anon";

grant truncate on table "public"."commissioners_voters_messages" to "anon";

grant update on table "public"."commissioners_voters_messages" to "anon";

grant delete on table "public"."commissioners_voters_messages" to "authenticated";

grant insert on table "public"."commissioners_voters_messages" to "authenticated";

grant references on table "public"."commissioners_voters_messages" to "authenticated";

grant select on table "public"."commissioners_voters_messages" to "authenticated";

grant trigger on table "public"."commissioners_voters_messages" to "authenticated";

grant truncate on table "public"."commissioners_voters_messages" to "authenticated";

grant update on table "public"."commissioners_voters_messages" to "authenticated";

grant delete on table "public"."commissioners_voters_messages" to "service_role";

grant insert on table "public"."commissioners_voters_messages" to "service_role";

grant references on table "public"."commissioners_voters_messages" to "service_role";

grant select on table "public"."commissioners_voters_messages" to "service_role";

grant trigger on table "public"."commissioners_voters_messages" to "service_role";

grant truncate on table "public"."commissioners_voters_messages" to "service_role";

grant update on table "public"."commissioners_voters_messages" to "service_role";

grant delete on table "public"."commissioners_voters_rooms" to "anon";

grant insert on table "public"."commissioners_voters_rooms" to "anon";

grant references on table "public"."commissioners_voters_rooms" to "anon";

grant select on table "public"."commissioners_voters_rooms" to "anon";

grant trigger on table "public"."commissioners_voters_rooms" to "anon";

grant truncate on table "public"."commissioners_voters_rooms" to "anon";

grant update on table "public"."commissioners_voters_rooms" to "anon";

grant delete on table "public"."commissioners_voters_rooms" to "authenticated";

grant insert on table "public"."commissioners_voters_rooms" to "authenticated";

grant references on table "public"."commissioners_voters_rooms" to "authenticated";

grant select on table "public"."commissioners_voters_rooms" to "authenticated";

grant trigger on table "public"."commissioners_voters_rooms" to "authenticated";

grant truncate on table "public"."commissioners_voters_rooms" to "authenticated";

grant update on table "public"."commissioners_voters_rooms" to "authenticated";

grant delete on table "public"."commissioners_voters_rooms" to "service_role";

grant insert on table "public"."commissioners_voters_rooms" to "service_role";

grant references on table "public"."commissioners_voters_rooms" to "service_role";

grant select on table "public"."commissioners_voters_rooms" to "service_role";

grant trigger on table "public"."commissioners_voters_rooms" to "service_role";

grant truncate on table "public"."commissioners_voters_rooms" to "service_role";

grant update on table "public"."commissioners_voters_rooms" to "service_role";

grant delete on table "public"."credentials" to "anon";

grant insert on table "public"."credentials" to "anon";

grant references on table "public"."credentials" to "anon";

grant select on table "public"."credentials" to "anon";

grant trigger on table "public"."credentials" to "anon";

grant truncate on table "public"."credentials" to "anon";

grant update on table "public"."credentials" to "anon";

grant delete on table "public"."credentials" to "authenticated";

grant insert on table "public"."credentials" to "authenticated";

grant references on table "public"."credentials" to "authenticated";

grant select on table "public"."credentials" to "authenticated";

grant trigger on table "public"."credentials" to "authenticated";

grant truncate on table "public"."credentials" to "authenticated";

grant update on table "public"."credentials" to "authenticated";

grant delete on table "public"."credentials" to "service_role";

grant insert on table "public"."credentials" to "service_role";

grant references on table "public"."credentials" to "service_role";

grant select on table "public"."credentials" to "service_role";

grant trigger on table "public"."credentials" to "service_role";

grant truncate on table "public"."credentials" to "service_role";

grant update on table "public"."credentials" to "service_role";

grant delete on table "public"."elections" to "anon";

grant insert on table "public"."elections" to "anon";

grant references on table "public"."elections" to "anon";

grant select on table "public"."elections" to "anon";

grant trigger on table "public"."elections" to "anon";

grant truncate on table "public"."elections" to "anon";

grant update on table "public"."elections" to "anon";

grant delete on table "public"."elections" to "authenticated";

grant insert on table "public"."elections" to "authenticated";

grant references on table "public"."elections" to "authenticated";

grant select on table "public"."elections" to "authenticated";

grant trigger on table "public"."elections" to "authenticated";

grant truncate on table "public"."elections" to "authenticated";

grant update on table "public"."elections" to "authenticated";

grant delete on table "public"."elections" to "service_role";

grant insert on table "public"."elections" to "service_role";

grant references on table "public"."elections" to "service_role";

grant select on table "public"."elections" to "service_role";

grant trigger on table "public"."elections" to "service_role";

grant truncate on table "public"."elections" to "service_role";

grant update on table "public"."elections" to "service_role";

grant delete on table "public"."elections_plus" to "anon";

grant insert on table "public"."elections_plus" to "anon";

grant references on table "public"."elections_plus" to "anon";

grant select on table "public"."elections_plus" to "anon";

grant trigger on table "public"."elections_plus" to "anon";

grant truncate on table "public"."elections_plus" to "anon";

grant update on table "public"."elections_plus" to "anon";

grant delete on table "public"."elections_plus" to "authenticated";

grant insert on table "public"."elections_plus" to "authenticated";

grant references on table "public"."elections_plus" to "authenticated";

grant select on table "public"."elections_plus" to "authenticated";

grant trigger on table "public"."elections_plus" to "authenticated";

grant truncate on table "public"."elections_plus" to "authenticated";

grant update on table "public"."elections_plus" to "authenticated";

grant delete on table "public"."elections_plus" to "service_role";

grant insert on table "public"."elections_plus" to "service_role";

grant references on table "public"."elections_plus" to "service_role";

grant select on table "public"."elections_plus" to "service_role";

grant trigger on table "public"."elections_plus" to "service_role";

grant truncate on table "public"."elections_plus" to "service_role";

grant update on table "public"."elections_plus" to "service_role";

grant delete on table "public"."events_attended" to "anon";

grant insert on table "public"."events_attended" to "anon";

grant references on table "public"."events_attended" to "anon";

grant select on table "public"."events_attended" to "anon";

grant trigger on table "public"."events_attended" to "anon";

grant truncate on table "public"."events_attended" to "anon";

grant update on table "public"."events_attended" to "anon";

grant delete on table "public"."events_attended" to "authenticated";

grant insert on table "public"."events_attended" to "authenticated";

grant references on table "public"."events_attended" to "authenticated";

grant select on table "public"."events_attended" to "authenticated";

grant trigger on table "public"."events_attended" to "authenticated";

grant truncate on table "public"."events_attended" to "authenticated";

grant update on table "public"."events_attended" to "authenticated";

grant delete on table "public"."events_attended" to "service_role";

grant insert on table "public"."events_attended" to "service_role";

grant references on table "public"."events_attended" to "service_role";

grant select on table "public"."events_attended" to "service_role";

grant trigger on table "public"."events_attended" to "service_role";

grant truncate on table "public"."events_attended" to "service_role";

grant update on table "public"."events_attended" to "service_role";

grant delete on table "public"."generated_election_results" to "anon";

grant insert on table "public"."generated_election_results" to "anon";

grant references on table "public"."generated_election_results" to "anon";

grant select on table "public"."generated_election_results" to "anon";

grant trigger on table "public"."generated_election_results" to "anon";

grant truncate on table "public"."generated_election_results" to "anon";

grant update on table "public"."generated_election_results" to "anon";

grant delete on table "public"."generated_election_results" to "authenticated";

grant insert on table "public"."generated_election_results" to "authenticated";

grant references on table "public"."generated_election_results" to "authenticated";

grant select on table "public"."generated_election_results" to "authenticated";

grant trigger on table "public"."generated_election_results" to "authenticated";

grant truncate on table "public"."generated_election_results" to "authenticated";

grant update on table "public"."generated_election_results" to "authenticated";

grant delete on table "public"."generated_election_results" to "service_role";

grant insert on table "public"."generated_election_results" to "service_role";

grant references on table "public"."generated_election_results" to "service_role";

grant select on table "public"."generated_election_results" to "service_role";

grant trigger on table "public"."generated_election_results" to "service_role";

grant truncate on table "public"."generated_election_results" to "service_role";

grant update on table "public"."generated_election_results" to "service_role";

grant delete on table "public"."partylists" to "anon";

grant insert on table "public"."partylists" to "anon";

grant references on table "public"."partylists" to "anon";

grant select on table "public"."partylists" to "anon";

grant trigger on table "public"."partylists" to "anon";

grant truncate on table "public"."partylists" to "anon";

grant update on table "public"."partylists" to "anon";

grant delete on table "public"."partylists" to "authenticated";

grant insert on table "public"."partylists" to "authenticated";

grant references on table "public"."partylists" to "authenticated";

grant select on table "public"."partylists" to "authenticated";

grant trigger on table "public"."partylists" to "authenticated";

grant truncate on table "public"."partylists" to "authenticated";

grant update on table "public"."partylists" to "authenticated";

grant delete on table "public"."partylists" to "service_role";

grant insert on table "public"."partylists" to "service_role";

grant references on table "public"."partylists" to "service_role";

grant select on table "public"."partylists" to "service_role";

grant trigger on table "public"."partylists" to "service_role";

grant truncate on table "public"."partylists" to "service_role";

grant update on table "public"."partylists" to "service_role";

grant delete on table "public"."platforms" to "anon";

grant insert on table "public"."platforms" to "anon";

grant references on table "public"."platforms" to "anon";

grant select on table "public"."platforms" to "anon";

grant trigger on table "public"."platforms" to "anon";

grant truncate on table "public"."platforms" to "anon";

grant update on table "public"."platforms" to "anon";

grant delete on table "public"."platforms" to "authenticated";

grant insert on table "public"."platforms" to "authenticated";

grant references on table "public"."platforms" to "authenticated";

grant select on table "public"."platforms" to "authenticated";

grant trigger on table "public"."platforms" to "authenticated";

grant truncate on table "public"."platforms" to "authenticated";

grant update on table "public"."platforms" to "authenticated";

grant delete on table "public"."platforms" to "service_role";

grant insert on table "public"."platforms" to "service_role";

grant references on table "public"."platforms" to "service_role";

grant select on table "public"."platforms" to "service_role";

grant trigger on table "public"."platforms" to "service_role";

grant truncate on table "public"."platforms" to "service_role";

grant update on table "public"."platforms" to "service_role";

grant delete on table "public"."positions" to "anon";

grant insert on table "public"."positions" to "anon";

grant references on table "public"."positions" to "anon";

grant select on table "public"."positions" to "anon";

grant trigger on table "public"."positions" to "anon";

grant truncate on table "public"."positions" to "anon";

grant update on table "public"."positions" to "anon";

grant delete on table "public"."positions" to "authenticated";

grant insert on table "public"."positions" to "authenticated";

grant references on table "public"."positions" to "authenticated";

grant select on table "public"."positions" to "authenticated";

grant trigger on table "public"."positions" to "authenticated";

grant truncate on table "public"."positions" to "authenticated";

grant update on table "public"."positions" to "authenticated";

grant delete on table "public"."positions" to "service_role";

grant insert on table "public"."positions" to "service_role";

grant references on table "public"."positions" to "service_role";

grant select on table "public"."positions" to "service_role";

grant trigger on table "public"."positions" to "service_role";

grant truncate on table "public"."positions" to "service_role";

grant update on table "public"."positions" to "service_role";

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant references on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant trigger on table "public"."products" to "anon";

grant truncate on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."products" to "authenticated";

grant insert on table "public"."products" to "authenticated";

grant references on table "public"."products" to "authenticated";

grant select on table "public"."products" to "authenticated";

grant trigger on table "public"."products" to "authenticated";

grant truncate on table "public"."products" to "authenticated";

grant update on table "public"."products" to "authenticated";

grant delete on table "public"."products" to "service_role";

grant insert on table "public"."products" to "service_role";

grant references on table "public"."products" to "service_role";

grant select on table "public"."products" to "service_role";

grant trigger on table "public"."products" to "service_role";

grant truncate on table "public"."products" to "service_role";

grant update on table "public"."products" to "service_role";

grant delete on table "public"."reported_problems" to "anon";

grant insert on table "public"."reported_problems" to "anon";

grant references on table "public"."reported_problems" to "anon";

grant select on table "public"."reported_problems" to "anon";

grant trigger on table "public"."reported_problems" to "anon";

grant truncate on table "public"."reported_problems" to "anon";

grant update on table "public"."reported_problems" to "anon";

grant delete on table "public"."reported_problems" to "authenticated";

grant insert on table "public"."reported_problems" to "authenticated";

grant references on table "public"."reported_problems" to "authenticated";

grant select on table "public"."reported_problems" to "authenticated";

grant trigger on table "public"."reported_problems" to "authenticated";

grant truncate on table "public"."reported_problems" to "authenticated";

grant update on table "public"."reported_problems" to "authenticated";

grant delete on table "public"."reported_problems" to "service_role";

grant insert on table "public"."reported_problems" to "service_role";

grant references on table "public"."reported_problems" to "service_role";

grant select on table "public"."reported_problems" to "service_role";

grant trigger on table "public"."reported_problems" to "service_role";

grant truncate on table "public"."reported_problems" to "service_role";

grant update on table "public"."reported_problems" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."variants" to "anon";

grant insert on table "public"."variants" to "anon";

grant references on table "public"."variants" to "anon";

grant select on table "public"."variants" to "anon";

grant trigger on table "public"."variants" to "anon";

grant truncate on table "public"."variants" to "anon";

grant update on table "public"."variants" to "anon";

grant delete on table "public"."variants" to "authenticated";

grant insert on table "public"."variants" to "authenticated";

grant references on table "public"."variants" to "authenticated";

grant select on table "public"."variants" to "authenticated";

grant trigger on table "public"."variants" to "authenticated";

grant truncate on table "public"."variants" to "authenticated";

grant update on table "public"."variants" to "authenticated";

grant delete on table "public"."variants" to "service_role";

grant insert on table "public"."variants" to "service_role";

grant references on table "public"."variants" to "service_role";

grant select on table "public"."variants" to "service_role";

grant trigger on table "public"."variants" to "service_role";

grant truncate on table "public"."variants" to "service_role";

grant update on table "public"."variants" to "service_role";

grant delete on table "public"."voter_fields" to "anon";

grant insert on table "public"."voter_fields" to "anon";

grant references on table "public"."voter_fields" to "anon";

grant select on table "public"."voter_fields" to "anon";

grant trigger on table "public"."voter_fields" to "anon";

grant truncate on table "public"."voter_fields" to "anon";

grant update on table "public"."voter_fields" to "anon";

grant delete on table "public"."voter_fields" to "authenticated";

grant insert on table "public"."voter_fields" to "authenticated";

grant references on table "public"."voter_fields" to "authenticated";

grant select on table "public"."voter_fields" to "authenticated";

grant trigger on table "public"."voter_fields" to "authenticated";

grant truncate on table "public"."voter_fields" to "authenticated";

grant update on table "public"."voter_fields" to "authenticated";

grant delete on table "public"."voter_fields" to "service_role";

grant insert on table "public"."voter_fields" to "service_role";

grant references on table "public"."voter_fields" to "service_role";

grant select on table "public"."voter_fields" to "service_role";

grant trigger on table "public"."voter_fields" to "service_role";

grant truncate on table "public"."voter_fields" to "service_role";

grant update on table "public"."voter_fields" to "service_role";

grant delete on table "public"."voters" to "anon";

grant insert on table "public"."voters" to "anon";

grant references on table "public"."voters" to "anon";

grant select on table "public"."voters" to "anon";

grant trigger on table "public"."voters" to "anon";

grant truncate on table "public"."voters" to "anon";

grant update on table "public"."voters" to "anon";

grant delete on table "public"."voters" to "authenticated";

grant insert on table "public"."voters" to "authenticated";

grant references on table "public"."voters" to "authenticated";

grant select on table "public"."voters" to "authenticated";

grant trigger on table "public"."voters" to "authenticated";

grant truncate on table "public"."voters" to "authenticated";

grant update on table "public"."voters" to "authenticated";

grant delete on table "public"."voters" to "service_role";

grant insert on table "public"."voters" to "service_role";

grant references on table "public"."voters" to "service_role";

grant select on table "public"."voters" to "service_role";

grant trigger on table "public"."voters" to "service_role";

grant truncate on table "public"."voters" to "service_role";

grant update on table "public"."voters" to "service_role";

grant delete on table "public"."votes" to "anon";

grant insert on table "public"."votes" to "anon";

grant references on table "public"."votes" to "anon";

grant select on table "public"."votes" to "anon";

grant trigger on table "public"."votes" to "anon";

grant truncate on table "public"."votes" to "anon";

grant update on table "public"."votes" to "anon";

grant delete on table "public"."votes" to "authenticated";

grant insert on table "public"."votes" to "authenticated";

grant references on table "public"."votes" to "authenticated";

grant select on table "public"."votes" to "authenticated";

grant trigger on table "public"."votes" to "authenticated";

grant truncate on table "public"."votes" to "authenticated";

grant update on table "public"."votes" to "authenticated";

grant delete on table "public"."votes" to "service_role";

grant insert on table "public"."votes" to "service_role";

grant references on table "public"."votes" to "service_role";

grant select on table "public"."votes" to "service_role";

grant trigger on table "public"."votes" to "service_role";

grant truncate on table "public"."votes" to "service_role";

grant update on table "public"."votes" to "service_role";


