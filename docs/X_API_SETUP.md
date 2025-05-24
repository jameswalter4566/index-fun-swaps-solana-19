# X (Twitter) API Setup Guide

This guide explains how to set up X API credentials for the SMART platform to fetch Twitter user data.

## Prerequisites

1. **X Developer Account**: You need at least a **Basic tier** ($200/month) X developer account. The free tier is write-only and cannot fetch user data.
2. **Supabase Project**: Your Supabase project must be set up and running.

## Step 1: Create X Developer Account

1. Go to [developer.x.com](https://developer.x.com)
2. Sign up for a developer account
3. **Important**: Subscribe to the **Basic tier** or higher (free tier won't work for reading user data)

## Step 2: Create a Project and App

1. In the X Developer Portal, create a new Project
2. Create an App within that Project
3. Go to the "Keys and Tokens" tab

## Step 3: Get Bearer Token from X Dashboard

1. In your App's "Keys and Tokens" tab in the X Developer Portal
2. Find the "Bearer Token" section
3. Click "Generate" or "Regenerate"
4. Copy the token (it will start with `AAAA...`)
5. **Important**: Save this token securely - you won't be able to see it again!

## Step 4: Set Supabase Environment Variables

### Using Supabase CLI:
```bash
supabase secrets set X_API_BEARER_TOKEN="YOUR_BEARER_TOKEN_HERE"
```

### Using Supabase Dashboard:
1. Go to your Supabase project dashboard
2. Navigate to Settings → Edge Functions
3. Add a new secret:
   - Name: `X_API_BEARER_TOKEN`
   - Value: Your bearer token from Step 3

## Step 5: Verify Setup

Test your edge function:
```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/get-twitter-users \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"usernames": ["@elonmusk", "@naval", "@balajis", "@cdixon"]}'
```

## X API Credentials Reference

| Credential | Purpose | Where Used |
|------------|---------|------------|
| **API Key & Secret** | Identify your app | Only for generating bearer token |
| **Bearer Token** | Authenticate API calls | Every API request (in Authorization header) |
| **Client ID & Secret** | OAuth 2.0 flows | Not needed for basic user lookups |
| **Access Token & Secret** | User-context auth | Only for user-specific actions |

## Rate Limits

- **Basic Tier**: 900 requests per 15 minutes per user
- **Pro Tier**: Higher limits (custom)
- **Enterprise**: Elevated limits (contract-based)

## Important Notes

1. **Scopes**: The bearer token must have `users.read` scope
2. **Free Tier Won't Work**: The free tier is write-only. You MUST have Basic tier or higher
3. **Rate Limiting**: Implement caching to avoid hitting rate limits
4. **Profile Images**: The API returns `profile_image_url` with `_normal` suffix (48x48px). You can replace with:
   - `_bigger` (73x73px)
   - `_400x400` (400x400px)
   - Remove suffix for original size

## Troubleshooting

### Error: 403 Forbidden
- Check if your token has `users.read` scope
- Verify you're on Basic tier or higher

### Error: 429 Too Many Requests
- You've hit the rate limit
- Check the `x-rate-limit-reset` header for reset time
- Implement exponential backoff

### Error: 401 Unauthorized
- Bearer token is invalid or expired
- Regenerate token in Developer Portal

### No Data Returned
- Username might not exist
- Account might be suspended or deleted
- Check for typos in usernames

## Security Best Practices

1. **Never commit tokens**: Keep them in environment variables
2. **Rotate regularly**: Regenerate tokens periodically
3. **Monitor usage**: Check your API usage in Developer Portal
4. **Use HTTPS**: Always use secure connections

## Additional Resources

- [X API v2 Documentation](https://developer.x.com/en/docs/twitter-api)
- [User Lookup Endpoints](https://developer.x.com/en/docs/twitter-api/users/lookup/api-reference)
- [Authentication Guide](https://developer.x.com/en/docs/authentication/overview)
- [Rate Limits](https://developer.x.com/en/docs/twitter-api/rate-limits)