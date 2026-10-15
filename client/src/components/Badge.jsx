import React from 'react';
import { clsx } from 'clsx';

/**
 * Badge — environment / status / type pill badges
 *
 * Props:
 *  - variant: 'dev' | 'test' | 'prod' | 'success' | 'error' | 'warning' | 'info' | 'secret' | 'public' | 'neutral'
 *  - size: 'xs' | 'sm' (default 'xs')
 *  - dot: boolean — show pulsing dot
 *  - children: ReactNode
 *  - className: string
 */
const VARIANTS = {
  dev: 'bg-blue-950 text-blue-300 border-blue-800/50',
  test: 'bg-purple-950 text-purple-300 border-purple-800/50',
  prod: 'bg-emerald-950 text-emerald-300 border-emerald-800/50',
  success: 'bg-emerald-950 text-emerald-400 border-emerald-500/30',
  error: 'bg-red-950 text-red-400 border-red-500/30',
  warning: 'bg-amber-950 text-amber-400 border-amber-500/30',
  info: 'bg-blue-950 text-blue-400 border-blue-500/30',
  secret: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  public: 'bg-slate-800 text-slate-400 border-slate-700',
  neutral: 'bg-slate-800 text-slate-300 border-slate-700',
  number: 'bg-indigo-950 text-indigo-300 border-indigo-800/40',
  boolean: 'bg-cyan-950 text-cyan-300 border-cyan-800/40',
  string: 'bg-slate-800 text-slate-400 border-slate-700',
  json: 'bg-fuchsia-950 text-fuchsia-300 border-fuchsia-800/40',
};

const DOT_COLORS = {
  dev: 'bg-blue-400',
  test: 'bg-purple-400',
  prod: 'bg-emerald-400',
  success: 'bg-emerald-400',
  error: 'bg-red-400',
  warning: 'bg-amber-400',
  info: 'bg-blue-400',
  secret: 'bg-amber-400',
  public: 'bg-slate-400',
  neutral: 'bg-slate-400',
};

export default function Badge({ variant = 'neutral', size = 'xs', dot = false, children, className }) {
  const variantClasses = VARIANTS[variant] ?? VARIANTS.neutral;
  const dotColor = DOT_COLORS[variant] ?? 'bg-slate-400';

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2.5 py-0.5'
    : 'text-[10px] px-2 py-0.5';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded font-mono font-medium border whitespace-nowrap',
        variantClasses,
        sizeClasses,
        className,
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotColor,
            variant === 'prod' || variant === 'success' ? 'animate-pulse' : ''
          )}
        />
      )}
      {children}
    </span>
  );
}
