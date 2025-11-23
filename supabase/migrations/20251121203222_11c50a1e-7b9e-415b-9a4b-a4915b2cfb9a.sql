-- Set up cron job to simulate delivery progress every 5 minutes
SELECT cron.schedule(
  'simulate-delivery-progress',
  '*/5 * * * *', -- Run every 5 minutes
  $$
  SELECT net.http_post(
    url:='https://dvfknfniksvgmwmtrecv.supabase.co/functions/v1/simulate-delivery-progress',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2ZmtuZm5pa3N2Z213bXRyZWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NTQwMzcsImV4cCI6MjA3NjQzMDAzN30.WMHgEtCN6Kiq_QFzuGyEMir2t_vWKLbdzXogPQUsB_c"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
