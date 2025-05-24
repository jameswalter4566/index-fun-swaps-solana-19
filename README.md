# SMART - AI Trading Agents Platform

AI-powered trading agents that monitor Twitter accounts for trading signals and execute trades automatically.

## Project Info

**URL**: https://lovable.dev/projects/5ed9e9f5-8216-4e27-a85c-eac7fe0e4fc7

## Features

- 🤖 **AI Trading Agents** - Create personalized trading agents that monitor Twitter accounts
- 🐦 **Twitter Integration** - Real-time monitoring of up to 4 Twitter accounts per agent
- 📊 **Smart Filters** - Set market cap, volume, and social media requirements
- 💬 **Voice Chat** - Talk to your agent for trading recommendations
- 📱 **SMS Alerts** - Get notified when your agent finds opportunities
- 🔍 **Multi-Source Data** - Pull data from Twitter, Pump.fun, and Photon

## Setup

### Prerequisites

- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Supabase account
- X (Twitter) Developer account with Basic tier ($200/month)

### Local Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

### X (Twitter) API Setup

To enable real Twitter user data fetching, you need to configure X API credentials:

1. **Get X Developer Account**
   - Sign up at [developer.x.com](https://developer.x.com)
   - Subscribe to Basic tier or higher (required for user lookups)

2. **Get Bearer Token from X Dashboard**
   - Go to your app's "Keys and Tokens" tab in X Developer Portal
   - Find "Bearer Token" section and click "Generate"
   - Copy the token (starts with `AAAA...`)

3. **Set Supabase Environment Variable**
   ```bash
   supabase secrets set X_API_BEARER_TOKEN="YOUR_BEARER_TOKEN_HERE"
   ```

For detailed setup instructions, see [docs/X_API_SETUP.md](docs/X_API_SETUP.md)

### Supabase Edge Functions

Deploy the edge functions:

```bash
# Deploy all functions
supabase functions deploy

# Or deploy specific function
supabase functions deploy get-twitter-users
```

## Architecture

### Frontend
- **Framework**: React with TypeScript
- **UI Library**: shadcn-ui
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Wallet**: Solana Wallet Adapter

### Backend
- **Database**: Supabase (PostgreSQL)
- **Edge Functions**: Deno-based serverless functions
- **Authentication**: Supabase Auth with wallet integration

### External APIs
- **X (Twitter) API v2**: User profile data
- **Solana**: Blockchain interactions
- **AI/ML**: Trading signal analysis

## Key Components

- **NodeVisualizer**: Interactive agent configuration with 4 nodes
- **AgentChat**: Voice-enabled chat interface for trading recommendations
- **CreateSwapForm**: Agent creation with Twitter account selection
- **IndexCard**: Display Twitter accounts with real-time data

## Deployment

### Via Lovable
Simply open [Lovable](https://lovable.dev/projects/5ed9e9f5-8216-4e27-a85c-eac7fe0e4fc7) and click on Share → Publish.

### Custom Domain
To connect a domain:
1. Navigate to Project > Settings > Domains
2. Click Connect Domain
3. Follow the [custom domain guide](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Environment Variables

Required environment variables for Supabase Edge Functions:

| Variable | Description | Required |
|----------|-------------|----------|
| `X_API_BEARER_TOKEN` | X API Bearer Token with users.read scope | Yes (for production) |

## Rate Limits

- **X API Basic Tier**: 900 requests per 15 minutes
- **Supabase Free Tier**: 500K edge function invocations/month

## Security

- Never commit API keys or tokens
- Use environment variables for sensitive data
- Implement rate limiting and caching
- Follow [X Developer Policy](https://developer.x.com/en/developer-terms/agreement-and-policy)

## Contributing

1. Clone the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software. All rights reserved.

## Support

For issues and feature requests, please use the GitHub issues page.