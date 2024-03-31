
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";

CREATE SCHEMA IF NOT EXISTS "public";

ALTER SCHEMA "public" OWNER TO "pg_database_owner";

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE TYPE "public"."publicity" AS ENUM (
    'PRIVATE',
    'VOTER',
    'PUBLIC'
);

ALTER TYPE "public"."publicity" OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "year" "date" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "credential_id" "uuid" NOT NULL,
    "deleted_at" timestamp with time zone
);

ALTER TABLE "public"."achievements" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."admin_commissioners_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "message" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "room_id" "uuid" NOT NULL,
    "deleted_at" timestamp with time zone
);

ALTER TABLE "public"."admin_commissioners_messages" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."admin_commissioners_rooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "election_id" "uuid" NOT NULL,
    "deleted_at" timestamp with time zone
);

ALTER TABLE "public"."admin_commissioners_rooms" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."affiliations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_name" "text" NOT NULL,
    "org_position" "text" NOT NULL,
    "start_year" "date" NOT NULL,
    "end_year" "date" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "credential_id" "uuid" NOT NULL,
    "deleted_at" timestamp with time zone
);

ALTER TABLE "public"."affiliations" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."candidates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "slug" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "middle_name" "text",
    "last_name" "text" NOT NULL,
    "image_path" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "election_id" "uuid" NOT NULL,
    "credential_id" "uuid" NOT NULL,
    "position_id" "uuid" NOT NULL,
    "partylist_id" "uuid" NOT NULL,
    "deleted_at" timestamp with time zone
);

ALTER TABLE "public"."candidates" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."commissioners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "election_id" "uuid" NOT NULL,
    "deleted_at" timestamp with time zone
);

ALTER TABLE "public"."commissioners" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."commissioners_voters_messages" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "message" "text" NOT NULL,
    "deleted_at" timestamp with time zone,
    "user_id" "uuid" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_id" "uuid" NOT NULL
);

ALTER TABLE "public"."commissioners_voters_messages" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."commissioners_voters_rooms" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "deleted_at" timestamp with time zone,
    "election_id" "uuid" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);

ALTER TABLE "public"."commissioners_voters_rooms" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."credentials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);

ALTER TABLE "public"."credentials" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."elections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "voting_hour_start" smallint DEFAULT '7'::smallint NOT NULL,
    "voting_hour_end" smallint DEFAULT '19'::smallint NOT NULL,
    "publicity" "public"."publicity" DEFAULT 'PRIVATE'::"public"."publicity" NOT NULL,
    "logo_path" "text",
    "voter_domain" "text",
    "is_candidates_visible_in_realtime_when_ongoing" boolean DEFAULT false NOT NULL,
    "name_arrangement" smallint DEFAULT '0'::smallint NOT NULL,
    "variant_id" smallint NOT NULL,
    "deleted_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."elections" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."elections_plus" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "redeemed_at" timestamp with time zone,
    "deleted_at" timestamp with time zone
);

ALTER TABLE "public"."elections_plus" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."events_attended" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "year" "date" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "credential_id" "uuid" NOT NULL,
    "deleted_at" timestamp with time zone
);

ALTER TABLE "public"."events_attended" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."generated_election_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "election_id" "uuid" NOT NULL,
    "result" "json" NOT NULL,
    "deleted_at" timestamp with time zone
);

ALTER TABLE "public"."generated_election_results" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."partylists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "acronym" "text" NOT NULL,
    "description" "text",
    "logo_path" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "election_id" "uuid" NOT NULL
);

ALTER TABLE "public"."partylists" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."platforms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "candidate_id" "uuid" NOT NULL,
    "deleted_at" timestamp with time zone
);

ALTER TABLE "public"."platforms" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "order" smallint NOT NULL,
    "min" smallint DEFAULT '0'::smallint NOT NULL,
    "max" smallint DEFAULT '1'::smallint NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "election_id" "uuid" NOT NULL
);

ALTER TABLE "public"."positions" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL
);

ALTER TABLE "public"."products" OWNER TO "postgres";

ALTER TABLE "public"."products" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."reported_problems" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "subject" "text" NOT NULL,
    "description" "text" NOT NULL,
    "election_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "deleted_at" timestamp with time zone,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);

ALTER TABLE "public"."reported_problems" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "email" character varying NOT NULL,
    "image_path" "text",
    "deleted_at" timestamp with time zone
);

ALTER TABLE "public"."users" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."variants" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "price" smallint NOT NULL,
    "product_id" integer NOT NULL
);

ALTER TABLE "public"."variants" OWNER TO "postgres";

ALTER TABLE "public"."variants" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."variants_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."voter_fields" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "election_id" "uuid" NOT NULL,
    "deleted_at" timestamp with time zone,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);

ALTER TABLE "public"."voter_fields" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."voters" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text" NOT NULL,
    "field" "json",
    "deleted_at" timestamp with time zone,
    "election_id" "uuid" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);

ALTER TABLE "public"."voters" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "voter_id" "uuid" NOT NULL,
    "candidate_id" "uuid",
    "position_id" "uuid",
    "election_id" "uuid" NOT NULL
);

ALTER TABLE "public"."votes" OWNER TO "postgres";

ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."admin_commissioners_messages"
    ADD CONSTRAINT "admin_commissioners_messages_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."admin_commissioners_rooms"
    ADD CONSTRAINT "admin_commissioners_rooms_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."affiliations"
    ADD CONSTRAINT "affiliations_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."candidates"
    ADD CONSTRAINT "candidates_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."commissioners"
    ADD CONSTRAINT "commissioners_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."commissioners_voters_messages"
    ADD CONSTRAINT "commissioners_voters_messages_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."commissioners_voters_rooms"
    ADD CONSTRAINT "commissioners_voters_rooms_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."credentials"
    ADD CONSTRAINT "credentials_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."elections"
    ADD CONSTRAINT "elections_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."elections_plus"
    ADD CONSTRAINT "elections_plus_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."elections"
    ADD CONSTRAINT "elections_slug_key" UNIQUE ("slug");

ALTER TABLE ONLY "public"."events_attended"
    ADD CONSTRAINT "events_attended_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."generated_election_results"
    ADD CONSTRAINT "generated_election_results_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."partylists"
    ADD CONSTRAINT "partylists_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."platforms"
    ADD CONSTRAINT "platforms_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."positions"
    ADD CONSTRAINT "positions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."reported_problems"
    ADD CONSTRAINT "reported_problems_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id", "email");

ALTER TABLE ONLY "public"."variants"
    ADD CONSTRAINT "variants_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."voter_fields"
    ADD CONSTRAINT "voter_fields_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."voters"
    ADD CONSTRAINT "voters_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "public_achievements_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "public"."credentials"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."admin_commissioners_messages"
    ADD CONSTRAINT "public_admin_commissioners_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."admin_commissioners_rooms"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."admin_commissioners_messages"
    ADD CONSTRAINT "public_admin_commissioners_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."admin_commissioners_rooms"
    ADD CONSTRAINT "public_admin_commissioners_rooms_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."affiliations"
    ADD CONSTRAINT "public_affiliations_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "public"."credentials"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."candidates"
    ADD CONSTRAINT "public_candidates_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "public"."credentials"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."candidates"
    ADD CONSTRAINT "public_candidates_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."candidates"
    ADD CONSTRAINT "public_candidates_partylist_id_fkey" FOREIGN KEY ("partylist_id") REFERENCES "public"."partylists"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."candidates"
    ADD CONSTRAINT "public_candidates_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."commissioners"
    ADD CONSTRAINT "public_commissioners_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."commissioners"
    ADD CONSTRAINT "public_commissioners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."commissioners_voters_messages"
    ADD CONSTRAINT "public_commissioners_voters_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."commissioners_voters_rooms"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."commissioners_voters_messages"
    ADD CONSTRAINT "public_commissioners_voters_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."commissioners_voters_rooms"
    ADD CONSTRAINT "public_commissioners_voters_rooms_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."elections_plus"
    ADD CONSTRAINT "public_elections_plus_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."elections"
    ADD CONSTRAINT "public_elections_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."events_attended"
    ADD CONSTRAINT "public_events_attended_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "public"."credentials"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."generated_election_results"
    ADD CONSTRAINT "public_generated_election_results_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."partylists"
    ADD CONSTRAINT "public_partylists_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."platforms"
    ADD CONSTRAINT "public_platforms_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."positions"
    ADD CONSTRAINT "public_positions_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."reported_problems"
    ADD CONSTRAINT "public_reported_problems_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."reported_problems"
    ADD CONSTRAINT "public_reported_problems_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "public_users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."variants"
    ADD CONSTRAINT "public_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."voter_fields"
    ADD CONSTRAINT "public_voter_fields_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."voters"
    ADD CONSTRAINT "public_voters_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "public_votes_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "public_votes_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "public_votes_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "public_votes_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "public"."voters"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE "public"."achievements" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."admin_commissioners_messages" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."admin_commissioners_rooms" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."affiliations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."candidates" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."commissioners" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."commissioners_voters_messages" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."commissioners_voters_rooms" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."credentials" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."elections" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."elections_plus" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."events_attended" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."generated_election_results" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."partylists" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."platforms" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."positions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."reported_problems" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."variants" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."voter_fields" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."voters" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."votes" ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

GRANT ALL ON TABLE "public"."achievements" TO "anon";
GRANT ALL ON TABLE "public"."achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."achievements" TO "service_role";

GRANT ALL ON TABLE "public"."admin_commissioners_messages" TO "anon";
GRANT ALL ON TABLE "public"."admin_commissioners_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_commissioners_messages" TO "service_role";

GRANT ALL ON TABLE "public"."admin_commissioners_rooms" TO "anon";
GRANT ALL ON TABLE "public"."admin_commissioners_rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_commissioners_rooms" TO "service_role";

GRANT ALL ON TABLE "public"."affiliations" TO "anon";
GRANT ALL ON TABLE "public"."affiliations" TO "authenticated";
GRANT ALL ON TABLE "public"."affiliations" TO "service_role";

GRANT ALL ON TABLE "public"."candidates" TO "anon";
GRANT ALL ON TABLE "public"."candidates" TO "authenticated";
GRANT ALL ON TABLE "public"."candidates" TO "service_role";

GRANT ALL ON TABLE "public"."commissioners" TO "anon";
GRANT ALL ON TABLE "public"."commissioners" TO "authenticated";
GRANT ALL ON TABLE "public"."commissioners" TO "service_role";

GRANT ALL ON TABLE "public"."commissioners_voters_messages" TO "anon";
GRANT ALL ON TABLE "public"."commissioners_voters_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."commissioners_voters_messages" TO "service_role";

GRANT ALL ON TABLE "public"."commissioners_voters_rooms" TO "anon";
GRANT ALL ON TABLE "public"."commissioners_voters_rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."commissioners_voters_rooms" TO "service_role";

GRANT ALL ON TABLE "public"."credentials" TO "anon";
GRANT ALL ON TABLE "public"."credentials" TO "authenticated";
GRANT ALL ON TABLE "public"."credentials" TO "service_role";

GRANT ALL ON TABLE "public"."elections" TO "anon";
GRANT ALL ON TABLE "public"."elections" TO "authenticated";
GRANT ALL ON TABLE "public"."elections" TO "service_role";

GRANT ALL ON TABLE "public"."elections_plus" TO "anon";
GRANT ALL ON TABLE "public"."elections_plus" TO "authenticated";
GRANT ALL ON TABLE "public"."elections_plus" TO "service_role";

GRANT ALL ON TABLE "public"."events_attended" TO "anon";
GRANT ALL ON TABLE "public"."events_attended" TO "authenticated";
GRANT ALL ON TABLE "public"."events_attended" TO "service_role";

GRANT ALL ON TABLE "public"."generated_election_results" TO "anon";
GRANT ALL ON TABLE "public"."generated_election_results" TO "authenticated";
GRANT ALL ON TABLE "public"."generated_election_results" TO "service_role";

GRANT ALL ON TABLE "public"."partylists" TO "anon";
GRANT ALL ON TABLE "public"."partylists" TO "authenticated";
GRANT ALL ON TABLE "public"."partylists" TO "service_role";

GRANT ALL ON TABLE "public"."platforms" TO "anon";
GRANT ALL ON TABLE "public"."platforms" TO "authenticated";
GRANT ALL ON TABLE "public"."platforms" TO "service_role";

GRANT ALL ON TABLE "public"."positions" TO "anon";
GRANT ALL ON TABLE "public"."positions" TO "authenticated";
GRANT ALL ON TABLE "public"."positions" TO "service_role";

GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";

GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."reported_problems" TO "anon";
GRANT ALL ON TABLE "public"."reported_problems" TO "authenticated";
GRANT ALL ON TABLE "public"."reported_problems" TO "service_role";

GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";

GRANT ALL ON TABLE "public"."variants" TO "anon";
GRANT ALL ON TABLE "public"."variants" TO "authenticated";
GRANT ALL ON TABLE "public"."variants" TO "service_role";

GRANT ALL ON SEQUENCE "public"."variants_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."variants_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."variants_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."voter_fields" TO "anon";
GRANT ALL ON TABLE "public"."voter_fields" TO "authenticated";
GRANT ALL ON TABLE "public"."voter_fields" TO "service_role";

GRANT ALL ON TABLE "public"."voters" TO "anon";
GRANT ALL ON TABLE "public"."voters" TO "authenticated";
GRANT ALL ON TABLE "public"."voters" TO "service_role";

GRANT ALL ON TABLE "public"."votes" TO "anon";
GRANT ALL ON TABLE "public"."votes" TO "authenticated";
GRANT ALL ON TABLE "public"."votes" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

RESET ALL;
