create policy "Enable select to their own data"
on "public"."users"
as permissive
for select
to public
using ((auth.uid() = id));



