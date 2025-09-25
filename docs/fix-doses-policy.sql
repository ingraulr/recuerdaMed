-- Agregar política faltante para permitir INSERT en la tabla doses
-- El problema es que los pacientes pueden leer y actualizar dosis, pero no pueden insertarlas

-- Política para permitir que los pacientes inserten sus propias dosis
CREATE POLICY "paciente inserta dosis"
ON public.doses
FOR INSERT 
WITH CHECK (auth.uid() = patient_user_id);

-- También agregar política para que el cuidador pueda insertar dosis para sus pacientes
CREATE POLICY "cuidador inserta dosis para pacientes"
ON public.doses
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.caregiver_links cl
    WHERE cl.patient_user_id = doses.patient_user_id
      AND cl.caregiver_user_id = auth.uid()
  )
);
