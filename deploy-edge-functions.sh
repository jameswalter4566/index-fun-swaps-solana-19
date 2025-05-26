#!/bin/bash

# Deploy coin-recommendations function
echo "Deploying coin-recommendations edge function..."
supabase functions deploy coin-recommendations

# Deploy other edge functions if needed
echo "Deployment complete!"