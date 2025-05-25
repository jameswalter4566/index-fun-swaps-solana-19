import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

interface VapiWebCallRequest {
  assistantId?: string;
  assistantOverrides?: {
    firstMessage?: string;
    model?: {
      provider: string;
      model: string;
      temperature?: number;
    };
    voice?: {
      provider: string;
      voiceId: string;
    };
    recordingEnabled?: boolean;
    endCallFunctionEnabled?: boolean;
    clientMessages?: string[];
    firstMessageMode?: string;
  };
  metadata?: Record<string, any>;
}

interface VapiWebCallResponse {
  callId: string;
  webCallUrl: string;
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    
    // Get Vapi API key from environment
    const vapiApiKey = Deno.env.get("VAPI_API_KEY");
    
    if (!vapiApiKey) {
      console.error("VAPI_API_KEY not configured");
      throw new Error("Vapi API key not configured. Please set VAPI_API_KEY environment variable.");
    }

    switch (action) {
      case "create-web-call": {
        // Create a web call for browser-based conversation
        const requestData: VapiWebCallRequest = {
          assistantId: data.assistantId || Deno.env.get("VAPI_ASSISTANT_ID"),
          assistantOverrides: {
            firstMessage: data.firstMessage || `Hi! I'm your SMART trading agent. I can help you analyze market trends, monitor Twitter accounts, and find trading opportunities. What would you like to know?`,
            model: {
              provider: "openai",
              model: "gpt-4-turbo",
              temperature: 0.7,
            },
            voice: {
              provider: "11labs",
              voiceId: data.voiceId || "21m00Tcm4TlvDq8ikWAM", // Default to Rachel voice
            },
            recordingEnabled: false,
            endCallFunctionEnabled: true,
            clientMessages: ["assistant_response", "transcript", "function_call", "hang", "speech_start", "speech_end"],
            firstMessageMode: "assistant-speaks-first",
          },
          metadata: {
            agentId: data.agentId,
            agentName: data.agentName,
            userId: data.userId,
            ...data.metadata,
          },
        };

        console.log("Creating Vapi web call:", requestData);

        const response = await fetch("https://api.vapi.ai/call/web", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${vapiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Vapi API Error:", response.status, errorText);
          throw new Error(`Vapi API returned ${response.status}: ${errorText}`);
        }

        const vapiResponse: VapiWebCallResponse = await response.json();
        
        return new Response(
          JSON.stringify({
            success: true,
            data: vapiResponse,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      case "end-call": {
        // End an active call
        const { callId } = data;
        
        if (!callId) {
          throw new Error("callId is required to end a call");
        }

        const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${vapiApiKey}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Vapi API Error:", response.status, errorText);
          throw new Error(`Failed to end call: ${errorText}`);
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "Call ended successfully",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      case "get-call-status": {
        // Get status of a call
        const { callId } = data;
        
        if (!callId) {
          throw new Error("callId is required to get call status");
        }

        const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${vapiApiKey}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Vapi API Error:", response.status, errorText);
          throw new Error(`Failed to get call status: ${errorText}`);
        }

        const callData = await response.json();
        
        return new Response(
          JSON.stringify({
            success: true,
            data: callData,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("Error in smart-agent-speak function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});