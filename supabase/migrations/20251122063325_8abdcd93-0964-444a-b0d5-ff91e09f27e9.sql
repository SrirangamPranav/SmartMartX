-- Update the cron job schedule from every 5 minutes to every 1 minute
-- First unschedule the existing job
SELECT cron.unschedule('simulate-delivery-progress');

-- Schedule the function to run every 1 minute for demo mode
SELECT cron.schedule(
  'simulate-delivery-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://dvfknfniksvgmwmtrecv.supabase.co/functions/v1/simulate-delivery-progress',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2ZmtuZm5pa3N2Z213bXRyZWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NTQwMzcsImV4cCI6MjA3NjQzMDAzN30.WMHgEtCN6Kiq_QFzuGyEMir2t_vWKLbdzXogPQUsB_c"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);