alter table "public"."elections" alter column "description" set default ''::text;

alter table "public"."elections" alter column "description" set not null;


