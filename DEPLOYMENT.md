# NeuralTrace Deployment Guide

This guide covers deploying NeuralTrace with a self-managed Supabase instance.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- External Supabase project created
- Node.js 18+ installed

## Step 1: Database Migration

1. Open your external Supabase project's SQL Editor
2. Run the contents of `MIGRATION_EXPORT.sql` to create all tables, policies, and functions

## Step 2: Deploy Edge Functions

```bash
# Login to Supabase CLI
supabase login

# Link to your external project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy edge functions
supabase functions deploy ai-screen-vitals
supabase functions deploy process-report
```

## Step 3: Configure Secrets (Optional)

```bash
# Optional: Set AI API key for enhanced AI features
# If not set, Edge Functions will use basic rule-based analysis
supabase secrets set LOVABLE_API_KEY=your_api_key_here

# Verify secrets are set
supabase secrets list
```

**Note:** The AI API key is optional. If not provided, Edge Functions will use basic rule-based analysis instead of AI-powered analysis.

## Step 4: Enable Realtime

Run in SQL Editor:

```sql
-- Enable realtime for vitals and consultations
ALTER PUBLICATION supabase_realtime ADD TABLE public.vitals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;
```

## Step 5: Configure Authentication

In Supabase Dashboard → Authentication → Settings:
- Disable email confirmation (for development) or configure SMTP for production
- Configure OAuth providers if needed (Google, GitHub, etc.)

## Step 6: Update Environment Variables

Create/update `.env` in your project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_REF
```

## Step 7: Build & Deploy Frontend

```bash
# Install dependencies
npm install

# Build for production
npm run build

# The dist/ folder contains your deployable frontend
```

### Deployment Options

- **Vercel**: Connect your repo, set env vars, deploy
- **Netlify**: Similar to Vercel
- **Static hosting**: Upload `dist/` to any static host

## Step 8: Wearable API Integration (Optional)

The current Bluetooth service is simulated. For real wearable data:

### Google Fit API
1. Create project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Fitness API
3. Configure OAuth consent screen
4. Create OAuth 2.0 credentials
5. Update `bluetoothService.ts` to use Google Fit REST API

### Apple HealthKit
- Requires native iOS app (React Native or similar)
- Cannot be accessed from web browsers

### Fitbit Web API
1. Register app at [dev.fitbit.com](https://dev.fitbit.com)
2. Use OAuth 2.0 for authorization
3. Poll or use webhooks for data sync

### Garmin Connect API
1. Apply for API access at Garmin Developer Portal
2. Implement OAuth flow
3. Use Health API endpoints

## Verification Checklist

- [ ] Database tables created with RLS policies
- [ ] Edge functions deployed and responding
- [ ] Realtime enabled for vitals/consultations
- [ ] Authentication working (signup/login)
- [ ] Environment variables configured
- [ ] Frontend builds without errors
- [ ] AI screening returns results

## Troubleshooting

### Edge functions not working
- Check `supabase functions list` shows deployed functions
- Verify secrets with `supabase secrets list`
- Check function logs: `supabase functions logs ai-screen-vitals`

### Realtime not updating
- Confirm tables added to `supabase_realtime` publication
- Check RLS policies allow SELECT for the user

### Authentication issues
- Verify anon key matches your project
- Check email confirmation settings
- Review auth logs in Supabase dashboard

## Support

For issues specific to:
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **NeuralTrace**: Check project issues or contact maintainers
