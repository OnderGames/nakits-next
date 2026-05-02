-- Üye numarası boş kalan satırları doldurur (önce migration_profiles_public_code.sql çalışmış olmalı).

update profiles
set public_code = public.generate_profile_public_code()
where public_code is null;
