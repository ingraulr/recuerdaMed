-- Crear bucket público (MVP)
insert into storage.buckets (id, name, public)
values ('meds-images', 'meds-images', true);

-- Crear bucket privado (alternativa)
-- insert into storage.buckets (id, name, public)
-- values ('meds-images', 'meds-images', false);
-- Permitir a usuarios autenticados subir imágenes
create policy "auth puede subir meds-images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'meds-images');

-- Permitir lectura pública (solo si el bucket es public=true)
create policy "public puede leer meds-images"
on storage.objects
for select
to public
using (bucket_id = 'meds-images');

-- Permitir al dueño actualizar sus archivos
create policy "dueno actualiza meds-images"
on storage.objects
for update
to authenticated
using (bucket_id = 'meds-images' and owner = auth.uid())
with check (bucket_id = 'meds-images' and owner = auth.uid());

-- Permitir al dueño borrar sus archivos
create policy "dueno borra meds-images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'meds-images' and owner = auth.uid());