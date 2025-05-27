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
      /* static purple glow positioned on the right */
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 w-1/2 h-full rounded-[inherit]
                   bg-[radial-gradient(circle_at_70%_50%,rgba(153,69,255,.35),transparent_50%)]"
      />
    )}

    {/* Edge highlight effect */}
    <div className="absolute inset-0 rounded-[inherit] opacity-60 pointer-events-none">
      <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-solPurple to-solGreen opacity-20 blur" />
    </div>

    <div className="relative z-10">{children}</div>
  </div>
);