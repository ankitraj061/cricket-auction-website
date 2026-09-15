'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowUp, ArrowDown, IndianRupee } from 'lucide-react';

interface BidTickerProps {
  currentBid: number;
  basePrice: number;
  nextIncrement: number;
  direction: 'up' | 'down' | null;
}

const formatInr = (value: number) => value.toLocaleString('en-IN');

const BidTicker = ({ currentBid, basePrice, nextIncrement, direction }: BidTickerProps) => {
  const reduceMotion = useReducedMotion();
  const raise = currentBid - basePrice;
  const isBidding = raise > 0;

  return (
    <section
      aria-label="Current bid"
      className="theme-card-strong stadium-glow relative overflow-hidden rounded-3xl px-6 py-7 sm:px-10 sm:py-9"
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 transition-colors duration-500 ${
          isBidding ? 'bg-primary' : 'bg-border'
        }`}
      />

      <div className="flex items-center justify-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-sm">
          Current Bid
        </span>
        <AnimatePresence>
          {isBidding && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1"
            >
              <motion.span
                animate={reduceMotion ? undefined : { opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-primary"
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary sm:text-xs">
                Live
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div
        aria-live="polite"
        aria-atomic="true"
        className="mt-3 flex items-center justify-center gap-2 sm:gap-4"
      >
        <span className="sr-only">Current bid is {formatInr(currentBid)} rupees</span>

        <AnimatePresence mode="popLayout">
          {direction && (
            <motion.span
              key={direction}
              initial={{ opacity: 0, y: direction === 'up' ? 24 : -24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              aria-hidden
              className="shrink-0"
            >
              {direction === 'up' ? (
                <ArrowUp className="h-8 w-8 text-primary sm:h-12 sm:w-12" />
              ) : (
                <ArrowDown className="h-8 w-8 text-destructive sm:h-12 sm:w-12" />
              )}
            </motion.span>
          )}
        </AnimatePresence>

        <IndianRupee
          aria-hidden
          className="h-9 w-9 shrink-0 text-primary sm:h-14 sm:w-14 lg:h-16 lg:w-16"
        />

        <motion.span
          key={currentBid}
          initial={reduceMotion ? false : { scale: 1.18, opacity: 0.4 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          aria-hidden
          className="text-6xl font-black leading-none tracking-tight text-primary tabular-nums sm:text-8xl lg:text-9xl"
        >
          {formatInr(currentBid)}
        </motion.span>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm sm:text-base">
        <span className="text-muted-foreground">
          Base <span className="font-bold text-foreground">₹{formatInr(basePrice)}</span>
        </span>
        {isBidding && (
          <span className="text-muted-foreground">
            Raise <span className="font-bold text-chart-3">+₹{formatInr(raise)}</span>
          </span>
        )}
        <span className="text-muted-foreground">
          Next bid <span className="font-bold text-foreground">+₹{formatInr(nextIncrement)}</span>
        </span>
      </div>
    </section>
  );
};

export default BidTicker;
