# Twitter OAuth 1.0a Setup Guide

This guide explains how to set up Twitter OAuth 1.0a credentials for fetching user timelines using the Twitter API v1.1.

## Why OAuth 1.0a?

- Twitter API v2 with Bearer tokens (App-only auth) has limitations
- OAuth 1.0a (User auth) provides access to more endpoints including user timelines
- Better rate limits and more reliable data access

## Prerequisites

1. Twitter Developer Account (Basic tier or higher)
2. A Twitter App with OAuth 1.0a enabled

## Step 1: Create Twitter App

1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Navigate to Projects & Apps
3. Create a new App (or use existing)
4. **Important**: Make sure your app has **Read** permissions

## Step 2: Get OAuth 1.0a Credentials

In your Twitter App settings, you need 4 credentials:

1. **API Key** (also called Consumer Key)
2. **API Secret** (also called Consumer Secret)  
3. **Access Token**
4. **Access Token Secret**

### To generate Access Token & Secret:

1. In your App settings, go to "Keys and tokens" tab
2. Under "Authentication Tokens", click "Generate" for Access Token and Secret
3. **Important**: Save these immediately - you won't see them again!

## Step 3: Set Supabase Environment Variables

Add these to your Supabase Edge Functions environment:

### Using Supabase CLI:
```bash
supabase secrets set TWITTER_API_KEY="your_api_key_here"
supabase secrets set TWITTER_API_SECRET="your_api_secret_here"
supabase secrets set TWITTER_ACCESS_TOKEN="your_access_token_here"
supabase secrets set TWITTER_ACCESS_TOKEN_SECRET="your_access_token_secret_here"
```

### Using Supabase Dashboard:
1. Go to your project dashboard
2. Navigate to Settings → Edge Functions
3. Add these secrets:
   - `TWITTER_API_KEY`
   - `TWITTER_API_SECRET`
   - `TWITTER_ACCESS_TOKEN`
   - `TWITTER_ACCESS_TOKEN_SECRET`

## Step 4: Test the Setup

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-twitter-timeline \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "usernames": ["@elonmusk", "@naval"],
    "agentId": "test-agent",
    "count": 5
  }'
```

## OAuth 1.0a vs Bearer Token

| Feature | OAuth 1.0a (v1.1 API) | Bearer Token (v2 API) |
|---------|----------------------|----------------------|
| **Auth Type** | User authentication | App-only authentication |
| **Endpoints** | Full access including timelines | Limited endpoints |
| **Rate Limits** | Per-user limits (better) | Per-app limits |
| **Setup** | More complex (4 tokens) | Simple (1 token) |
| **Best For** | Reading user data | Public data only |

## Rate Limits (v1.1 API)

- User timeline: 900 requests per 15-minute window
- Per user, not per app - much better for multi-user apps

## Troubleshooting

### Error: 401 Unauthorized
- Check all 4 credentials are correct
- Ensure tokens haven't been revoked
- Verify app has Read permissions

### Error: 403 Forbidden  
- Account may be suspended or protected
- App may lack proper permissions

### Error: 429 Too Many Requests
- Rate limit exceeded
- Implement caching (our function caches for 2 hours)

### No tweets returned
- User may have no tweets
- Username might be incorrect (don't include @)
- Account might be private

## Security Notes

1. **Never expose these credentials** in client-side code
2. **Rotate tokens periodically** for security
3. **Use environment variables** - never commit credentials
4. **Monitor usage** in Twitter Developer Portal

## Migration from Bearer Token

If you're currently using the Bearer token approach:

1. Keep both functions during transition
2. The new function will try v1.1 first, then fall back to v2
3. Once confirmed working, you can remove the v2 function

## Additional Resources

- [Twitter API v1.1 Documentation](https://developer.twitter.com/en/docs/twitter-api/v1)
- [OAuth 1.0a Guide](https://developer.twitter.com/en/docs/authentication/oauth-1-0a)
- [User Timeline Endpoint](https://developer.twitter.com/en/docs/twitter-api/v1/tweets/timelines/api-reference/get-statuses-user_timeline)