# Cron Job Setup for Coin Recommendations

This document explains how to set up a cron job to automatically fetch and process coin recommendations every 2 hours.

## Using Supabase Cron Jobs (Recommended)

Supabase supports scheduled functions using pg_cron. Here's how to set it up:

1. Enable the pg_cron extension in your Supabase dashboard:
   - Go to Database → Extensions
   - Search for "pg_cron"
   - Enable it

2. Create a cron job in SQL Editor:
```sql
-- Create a cron job that runs every 2 hours
SELECT cron.schedule(
  'coin-recommendations-job',
  '0 */2 * * *', -- Every 2 hours
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/coin-recommendations-cron',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_ANON_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

3. Replace the placeholders:
   - `YOUR_PROJECT_REF`: Your Supabase project reference
   - `YOUR_ANON_KEY`: Your Supabase anon key

4. To check scheduled jobs:
```sql
SELECT * FROM cron.job;
```

5. To remove a job:
```sql
SELECT cron.unschedule('coin-recommendations-job');
```

## Alternative: Using External Cron Services

If you prefer to use an external cron service:

### Option 1: Cron-job.org (Free)
1. Sign up at https://cron-job.org
2. Create a new cron job with:
   - URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/coin-recommendations-cron`
   - Schedule: Every 2 hours
   - Headers: 
     - `Authorization: Bearer YOUR_ANON_KEY`
     - `Content-Type: application/json`

### Option 2: GitHub Actions
Create `.github/workflows/coin-recommendations.yml`:
```yaml
name: Coin Recommendations Cron

on:
  schedule:
    - cron: '0 */2 * * *' # Every 2 hours
  workflow_dispatch: # Allow manual trigger

jobs:
  fetch-recommendations:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Function
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{}' \
            https://${{ secrets.SUPABASE_PROJECT_REF }}.supabase.co/functions/v1/coin-recommendations-cron
```

Add secrets to your GitHub repository:
- `SUPABASE_PROJECT_REF`
- `SUPABASE_ANON_KEY`

## Testing the Cron Job

To test the cron job manually:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}' \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/coin-recommendations-cron
```

## Monitoring

Monitor the cron job execution:

1. Check Supabase Functions logs in the dashboard
2. Query the coin_recommendations table to see new entries:
```sql
SELECT * FROM coin_recommendations 
ORDER BY created_at DESC 
LIMIT 10;
```

3. Set up alerts for failures (optional):
   - Use Supabase's webhook functionality
   - Integrate with monitoring services like Datadog or New Relic