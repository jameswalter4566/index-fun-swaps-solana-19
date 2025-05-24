import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AgentChat from '@/components/AgentChat';
import NodeVisualizer from '@/components/NodeVisualizer';

const Index: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center animate-fade-in">
          <h1 className="text-4xl font-bold mb-4 text-stake-text">SMART</h1>
          <p className="text-stake-muted text-lg">personalize your own ai trading agent</p>
        </div>

        <div className="flex gap-6">
          {/* Agent Chat - Left Side (40% width) */}
          <div className="w-[40%]">
            <Card className="h-[calc(100vh-12rem)] sticky top-4 bg-stake-card border-stake-border">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg">AI Trading Assistant</CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-4rem)]">
                <AgentChat 
                  agentName="Smart Agent" 
                  agentId="default" 
                  isPersistent={true}
                />
              </CardContent>
            </Card>
          </div>

          {/* Agent Configuration - Right Side (60% width) */}
          <div className="flex-1">
            <Card className="bg-stake-card border-stake-border">
              <CardHeader>
                <CardTitle className="text-2xl">Agent Configuration</CardTitle>
                <p className="text-sm text-stake-muted">
                  Configure your trading agent's parameters and filters
                </p>
              </CardHeader>
              <CardContent>
                <NodeVisualizer agentId="default" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;