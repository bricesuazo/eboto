alter table "public"."elections" drop constraint "public_elections_variant_id_fkey";

alter table "public"."elections" alter column "variant_id" set data type integer using "variant_id"::integer;

alter table "public"."elections" add constraint "public_elections_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES variants(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."elections" validate constraint "public_elections_variant_id_fkey";


