
import React from 'react';
import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-stake-background text-stake-text">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="container mx-auto px-4 py-6 mt-12 border-t border-stake-card text-center text-sm text-stake-muted">
        © {new Date().getFullYear()} INDEX.FUN — Discover and create memecoin INDEXES on Solana
      </footer>
    </div>
  );
};

export default Layout;
