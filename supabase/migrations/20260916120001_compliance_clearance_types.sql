-- Normalize clearance types and enforce allowed values

UPDATE public.compliance_records
SET clearance_type = 'municipal'
WHERE clearance_type ILIKE '%municipal%';

ALTER TABLE public.compliance_records
  ADD CONSTRAINT compliance_clearance_type CHECK (
    clearance_type IN (
      'municipal',
      'traffic',
      'structural',
      'electrical',
      'landowner',
      'highway',
      'fire',
      'other'
    )
  );
