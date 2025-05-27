
import React from 'react';
import Layout from '@/components/Layout';
import CreateSwapForm from '@/components/CreateSwapForm';

const CreateSwap: React.FC = () => {
  return (
    <Layout>
      <div className="mb-8 max-w-2xl mx-auto text-center animate-fade-in">
        <h1 className="text-4xl font-bold mb-4">create a new guardian</h1>
        <p className="text-gray-600 text-lg">
          define your trading guardian that monitors tokens based on your parameters
        </p>
      </div>
      
      <CreateSwapForm />
    </Layout>
  );
};

export default CreateSwap;
