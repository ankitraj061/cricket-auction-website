'use client';

import { motion } from 'framer-motion';
import { Minus, Plus, Gavel, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BidControlsProps {
  currentBid: number;
  increment: number;
  canDecrease: boolean;
  isBusy: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  onSell: () => void;
  onUnsold: () => void;
}

const ShortcutHint = ({ children }: { children: string }) => (
  <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
    {children}
  </kbd>
);

const BidControls = ({
  currentBid,
  increment,
  canDecrease,
  isBusy,
  onIncrease,
  onDecrease,
  onSell,
  onUnsold,
}: BidControlsProps) => (
  <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
    <div className="theme-card flex items-center justify-center gap-3 rounded-2xl p-3">
      <motion.div whileTap={{ scale: 0.94 }} className="flex-1 lg:flex-none">
        <Button
          type="button"
          onClick={onDecrease}
          disabled={!canDecrease || isBusy}
          aria-label={`Lower bid by ${increment.toLocaleString('en-IN')} rupees`}
          className="h-16 w-full rounded-xl border border-border bg-secondary text-foreground hover:opacity-90 disabled:opacity-40 lg:w-24"
        >
          <Minus className="h-7 w-7" />
        </Button>
      </motion.div>

      <motion.div whileTap={{ scale: 0.94 }} className="flex-1 lg:flex-none">
        <Button
          type="button"
          onClick={onIncrease}
          disabled={isBusy}
          aria-label={`Raise bid by ${increment.toLocaleString('en-IN')} rupees`}
          className="h-16 w-full rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 lg:w-24"
        >
          <Plus className="h-7 w-7" />
        </Button>
      </motion.div>

      <div className="hidden shrink-0 flex-col gap-1 pl-1 sm:flex">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ShortcutHint>←</ShortcutHint> lower
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ShortcutHint>→</ShortcutHint> raise
        </span>
      </div>
    </div>

    <div className="grid gap-4 sm:grid-cols-2">
      <motion.div whileHover={isBusy ? undefined : { y: -2 }} whileTap={{ scale: 0.98 }}>
        <Button
          type="button"
          onClick={onSell}
          disabled={isBusy}
          className="h-16 w-full rounded-xl bg-primary text-lg font-black text-primary-foreground shadow-xl hover:opacity-90 disabled:opacity-50 sm:text-xl"
        >
          {isBusy ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Gavel className="h-6 w-6" />
          )}
          <span className="ml-2">Sell at ₹{currentBid.toLocaleString('en-IN')}</span>
        </Button>
      </motion.div>

      <motion.div whileHover={isBusy ? undefined : { y: -2 }} whileTap={{ scale: 0.98 }}>
        <Button
          type="button"
          onClick={onUnsold}
          disabled={isBusy}
          className="h-16 w-full rounded-xl bg-destructive text-lg font-black text-destructive-foreground shadow-xl hover:opacity-90 disabled:opacity-50 sm:text-xl"
        >
          <XCircle className="h-6 w-6" />
          <span className="ml-2">Mark Unsold</span>
        </Button>
      </motion.div>
    </div>
  </div>
);

export default BidControls;
