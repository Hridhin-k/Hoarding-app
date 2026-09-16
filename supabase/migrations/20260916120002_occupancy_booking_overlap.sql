-- Enforce booking overlap (occupied + booked_future) at database level.
-- Holds and blocked dates remain protected in application logic.

ALTER TABLE public.occupancy_periods
  DROP CONSTRAINT IF EXISTS occupancy_periods_no_overlap;

ALTER TABLE public.occupancy_periods
  ADD CONSTRAINT occupancy_periods_no_overlap EXCLUDE USING gist (
    face_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  ) WHERE (state IN ('occupied', 'booked_future'));
