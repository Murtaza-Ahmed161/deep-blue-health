-- Allow doctors to insert consultations (for doctor notes)
CREATE POLICY "Doctors can create consultations" 
ON public.consultations 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'doctor'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);
