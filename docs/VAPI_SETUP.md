# Vapi Voice Assistant Setup Guide

This guide explains how to set up Vapi for browser-based voice conversations with your SMART trading agents.

## Prerequisites

1. **Vapi Account**: Sign up at [vapi.ai](https://vapi.ai)
2. **Vapi API Key**: Available in your Vapi dashboard
3. **Assistant ID** (optional): Pre-configured assistant or use overrides

## Step 1: Create Vapi Account

1. Go to [vapi.ai](https://vapi.ai)
2. Sign up for an account
3. Choose a plan that supports web calls

## Step 2: Get Your API Key

1. Navigate to your Vapi Dashboard
2. Go to Settings → API Keys
3. Create a new API key or copy existing one
4. Save it securely

## Step 3: Create an Assistant (Optional)

You can either:
- Create a pre-configured assistant in Vapi Dashboard
- Use assistant overrides in the API call (recommended for flexibility)

### Creating an Assistant in Dashboard:
1. Go to Assistants → Create New
2. Configure:
   - **Name**: SMART Trading Agent
   - **Model**: GPT-4 Turbo
   - **Voice**: 11Labs Rachel (or your preference)
   - **System Prompt**: 
   ```
   You are a SMART trading agent that helps users analyze cryptocurrency markets and Twitter signals.
   You monitor Twitter accounts for trading opportunities and provide real-time market analysis.
   Be concise, professional, and focus on actionable trading insights.
   ```

## Step 4: Set Environment Variables

```bash
# Required
supabase secrets set VAPI_API_KEY="your-vapi-api-key"

# Optional (if using pre-configured assistant)
supabase secrets set VAPI_ASSISTANT_ID="your-assistant-id"
```

## Step 5: Deploy the Edge Function

```bash
supabase functions deploy smart-agent-speak
```

## Web SDK Setup (Recommended)

### Install the SDK

```bash
npm install @vapi-ai/web
```

### Configure Environment Variables

Create a `.env.local` file with:

```bash
# Required for SDK usage
VITE_VAPI_PUBLIC_KEY="your-vapi-public-key"

# Optional if using pre-configured assistant
VITE_VAPI_ASSISTANT_ID="your-assistant-id"
```

### Using the SDK in React

```javascript
import Vapi from '@vapi-ai/web';

// Initialize with public key
const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY);

// Start a call with assistant ID
const call = await vapi.start(assistantId, {
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en-US",
  },
  model: {
    provider: "openai",
    model: "gpt-4-turbo",
    temperature: 0.7,
  },
  voice: {
    provider: "11labs",
    voiceId: "21m00Tcm4TlvDq8ikWAM",
  },
  firstMessage: "Hello! How can I help you today?",
  clientMessages: ["transcript", "function-call", "hang", "speech-start", "speech-end"],
});

// Set up event listeners
vapi.on('message', (message) => {
  console.log('Message:', message);
});

vapi.on('error', (error) => {
  console.error('Error:', error);
});

vapi.on('call-end', () => {
  console.log('Call ended');
});

// Stop the call
vapi.stop();
```

## API Usage (Alternative - Web Call URL)

### Create a Web Call

```javascript
const response = await supabase.functions.invoke('smart-agent-speak', {
  body: {
    action: 'create-web-call',
    data: {
      agentId: 'agent-123',
      agentName: 'My Trading Agent',
      firstMessage: 'Hello! I am your trading assistant.',
      metadata: {
        userId: 'user-123',
        twitterAccounts: ['@elonmusk', '@naval']
      }
    }
  }
});

// Response contains webCallUrl to embed in iframe or open
const { webCallUrl, callId } = response.data.data;
```

### End a Call

```javascript
await supabase.functions.invoke('smart-agent-speak', {
  body: {
    action: 'end-call',
    data: {
      callId: 'call-id-here'
    }
  }
});
```

## Integration with AgentChat Component

The AgentChat component will use Vapi's web SDK to:
1. Request microphone permissions
2. Establish WebRTC connection
3. Handle real-time voice conversation
4. Display transcripts in the chat interface

## Voice Options

Vapi supports multiple voice providers:

### 11Labs Voices
- **Rachel** (21m00Tcm4TlvDq8ikWAM) - Professional female
- **Josh** (TxGEqnHWrfWFTfGW9XjX) - Professional male
- **Bella** (EXAVITQu4vr4xnSDxMaL) - Friendly female

### OpenAI Voices
- **alloy** - Neutral
- **echo** - Male
- **fable** - British
- **onyx** - Deep male
- **nova** - Female
- **shimmer** - Soft female

## Pricing Considerations

- **Web Calls**: Charged per minute of conversation
- **Model Costs**: GPT-4 usage is billed separately
- **Voice Costs**: 11Labs voices cost more than OpenAI voices
- Check [Vapi pricing](https://vapi.ai/pricing) for current rates

## Security Best Practices

1. **Never expose API keys in frontend code**
2. **Use edge functions for all Vapi API calls**
3. **Implement user authentication before allowing calls**
4. **Set call duration limits to control costs**
5. **Monitor usage in Vapi dashboard**

## Troubleshooting

### Microphone Permission Denied
- Ensure site is served over HTTPS
- Guide users to allow microphone access

### Call Quality Issues
- Check internet connection
- Try different voice providers
- Reduce model temperature for more consistent responses

### High Latency
- Use closer Vapi regions if available
- Consider using faster models (GPT-3.5 vs GPT-4)
- Optimize assistant prompts for quicker responses

## Additional Resources

- [Vapi Documentation](https://docs.vapi.ai)
- [Vapi Web SDK](https://docs.vapi.ai/sdk/web)
- [Voice Providers](https://docs.vapi.ai/voices)
- [Pricing Calculator](https://vapi.ai/pricing)