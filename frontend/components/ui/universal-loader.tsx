'use client';

import { cn } from '@/lib/utils';

interface UniversalLoaderProps {
  message?: string;
  subtitle?: string;
  fullScreen?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  hideText?: boolean;
}

const sizeClasses: Record<NonNullable<UniversalLoaderProps['size']>, string> = {
  sm: 'h-8 w-8 border-2',
  md: 'h-12 w-12 border-[3px]',
  lg: 'h-16 w-16 border-4',
};

export const UniversalLoader = ({
  message = 'Loading...',
  subtitle,
  fullScreen = false,
  className,
  size = 'md',
  hideText = false,
}: UniversalLoaderProps) => {
  return (
    <div
      className={cn(
        fullScreen
          ? 'theme-page-bg min-h-screen flex items-center justify-center text-foreground'
          : 'flex items-center justify-center text-foreground',
        className
      )}
    >
      {fullScreen && <div className="absolute inset-0 theme-grid-overlay pointer-events-none" />}
      <div className="relative z-10 text-center">
        <div
          className={cn(
            'mx-auto rounded-full border-border border-t-primary animate-spin',
            sizeClasses[size]
          )}
        />
        {!hideText && message ? <p className="mt-4 font-semibold text-foreground">{message}</p> : null}
        {!hideText && subtitle ? <p className="mt-1 text-sm theme-muted">{subtitle}</p> : null}
      </div>
    </div>
  );
};

export default UniversalLoader;
