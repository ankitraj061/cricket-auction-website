'use client';

import { motion } from 'framer-motion';
import { PartyPopper, ArrowRight, Undo2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SaleResult {
  playerId: number;
  playerName: string;
  teamName: string;
  price: number;
}

interface SaleResultBannerProps {
  result: SaleResult;
  isAdvancing: boolean;
  onNextPlayer: () => void;
  onCorrect: () => void;
}

const SaleResultBanner = ({
  result,
  isAdvancing,
  onNextPlayer,
  onCorrect,
}: SaleResultBannerProps) => (
  <motion.section
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    aria-live="assertive"
    className="theme-card-strong stadium-glow relative overflow-hidden rounded-3xl border-2 border-primary/50 px-6 py-8 text-center sm:px-10"
  >
    <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

    <p className="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-primary sm:text-base">
      <PartyPopper className="h-5 w-5" aria-hidden />
      Sold
    </p>

    <h2 className="mt-3 text-4xl leading-tight text-foreground sm:text-6xl">{result.playerName}</h2>

    <p className="mt-2 text-lg text-muted-foreground sm:text-2xl">
      to <span className="font-bold text-chart-3">{result.teamName}</span> for{' '}
      <span className="font-black tabular-nums text-primary">
        ₹{result.price.toLocaleString('en-IN')}
      </span>
    </p>

    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
      <Button
        type="button"
        onClick={onNextPlayer}
        disabled={isAdvancing}
        autoFocus
        className="h-14 rounded-xl bg-primary px-10 text-lg font-black text-primary-foreground shadow-xl hover:opacity-90 disabled:opacity-60"
      >
        {isAdvancing ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
        ) : null}
        Next Player
        {!isAdvancing && <ArrowRight className="ml-2 h-5 w-5" aria-hidden />}
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={onCorrect}
        disabled={isAdvancing}
        className="h-14 rounded-xl border border-border bg-secondary px-6 text-base font-semibold text-foreground hover:opacity-90"
      >
        <Undo2 className="mr-2 h-4 w-4" aria-hidden />
        Correct this sale
      </Button>
    </div>
  </motion.section>
);

export default SaleResultBanner;
