-- Run daily (Neon scheduled query, cron, or by hand). Clears photo bytes older than 14 days.
update photos set jpeg = null where jpeg is not null and created_at < now() - interval '14 days';
