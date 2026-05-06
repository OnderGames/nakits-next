-- Kullanıcının kendi bildirimini silebilmesi için RLS delete policy.
drop policy if exists "notifications delete own" on public.notifications;
create policy "notifications delete own"
on public.notifications for delete
using (auth.uid() = profile_id);
