import React from 'react';
import { cn } from '@/lib/utils';

type GlassProps = React.HTMLAttributes<HTMLDivElement> & {
  glow?: boolean;
  delay?: number;
};

export const GlassCard: React.FC<GlassProps> = ({
  glow = false,
  delay = 0,
  className = '',
  children,
  ...rest
}) => (
  <div
    className={cn(
      'glass p-6 relative transition-all duration-300 hover:-translate-y-1',
      'animate-fade-in',
      glow && 'overflow-hidden',
      className
    )}
    style={{
      animationDelay: `${delay}ms`
    }}
    {...rest}
  >
    {glow && (
      /* halo highlight that slowly moves */
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] animate-spin-slow
                   bg-[radial-gradient(circle_at_30%_30%,rgba(153,69,255,.55),transparent_60%)]"
        style={{
          animationDuration: '14s'
        }}
      />
    )}

    {/* Edge highlight effect */}
    <div className="absolute inset-0 rounded-[inherit] opacity-60 pointer-events-none">
      <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-solPurple to-solGreen opacity-20 blur" />
    </div>

    <div className="relative z-10">{children}</div>
  </div>
);