-- Configuración de Storage para imágenes de medicamentos
-- Ejecutar en Supabase SQL Editor

-- 1. Crear bucket para imágenes de medicamentos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'medication-images',
  'medication-images', 
  true,  -- Público para mostrar imágenes fácilmente
  5242880,  -- 5MB límite
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- 2. Políticas RLS para el bucket medication-images

-- Política: Los usuarios pueden subir sus propias imágenes
create policy "Users can upload medication images"
on storage.objects for insert
with check (
  bucket_id = 'medication-images' 
  and auth.role() = 'authenticated'
);

-- Política: Los usuarios pueden ver todas las imágenes (públicas)
create policy "Anyone can view medication images" 
on storage.objects for select
using (
  bucket_id = 'medication-images'
);

-- Política: Los usuarios pueden actualizar sus propias imágenes
create policy "Users can update own medication images"
on storage.objects for update
using (
  bucket_id = 'medication-images' 
  and auth.role() = 'authenticated'
);

-- Política: Los usuarios pueden eliminar sus propias imágenes  
create policy "Users can delete own medication images"
on storage.objects for delete
using (
  bucket_id = 'medication-images' 
  and auth.role() = 'authenticated'
);

-- 3. Función helper para obtener URL pública
create or replace function get_medication_image_url(image_path text)
returns text
language plpgsql
security definer
as $$
declare
  signed_url text;
begin
  -- Para bucket público, devolver URL pública
  select into signed_url
    case 
      when image_path is null or image_path = '' then null
      else concat(
        current_setting('app.supabase_url', true),
        '/storage/v1/object/public/medication-images/',
        image_path
      )
    end;
    
  return signed_url;
end;
$$;

-- 4. Índice para mejorar consultas con imágenes
create index if not exists idx_medications_image_url 
on public.medications (image_url) 
where image_url is not null;

-- 5. Verificar configuración
select 
  'Bucket configurado correctamente' as status,
  id, name, public, file_size_limit, allowed_mime_types
from storage.buckets 
where id = 'medication-images';