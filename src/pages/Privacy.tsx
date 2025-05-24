import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Privacy: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <p className="text-stake-muted">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-stake-muted">
                <li>Wallet addresses when you connect your wallet</li>
                <li>Twitter account handles you choose to monitor</li>
                <li>Phone numbers for SMS notifications (optional)</li>
                <li>Trading parameters and preferences</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <p className="text-stake-muted">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-stake-muted">
                <li>Create and manage your AI trading agents</li>
                <li>Monitor Twitter accounts for trading signals</li>
                <li>Execute trades based on your parameters</li>
                <li>Send SMS notifications about trading activities (if opted in)</li>
                <li>Improve our services and develop new features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. SMS Communications</h2>
              <p className="text-stake-muted">
                If you opt-in to SMS notifications:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-stake-muted">
                <li>We will send you alerts about your agent's trading activities</li>
                <li>Message and data rates may apply</li>
                <li>You can opt-out at any time by texting STOP</li>
                <li>For help, text HELP</li>
                <li>We follow 10DLC compliance standards</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
              <p className="text-stake-muted">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Data Sharing</h2>
              <p className="text-stake-muted">
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as required by law or to protect our rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
              <p className="text-stake-muted">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-stake-muted">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt-out of SMS communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Blockchain Data</h2>
              <p className="text-stake-muted">
                Please note that transactions on the blockchain are public and immutable. We cannot delete or modify blockchain data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Changes to This Policy</h2>
              <p className="text-stake-muted">
                We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Contact Us</h2>
              <p className="text-stake-muted">
                If you have any questions about this privacy policy or our practices, please contact us at privacy@smart.ai
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-stake-card">
              <p className="text-sm text-stake-muted text-center">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Privacy;