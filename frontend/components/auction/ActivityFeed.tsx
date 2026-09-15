'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, History, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface AuctionEvent {
  id: string;
  type: 'sold' | 'unsold';
  playerId: number;
  playerName: string;
  teamName?: string;
  price?: number;
}

interface ActivityFeedProps {
  events: AuctionEvent[];
  canCorrectLastSale: boolean;
  onCorrectLastSale: () => void;
}

const ActivityFeed = ({ events, canCorrectLastSale, onCorrectLastSale }: ActivityFeedProps) => (
  <section aria-label="Recent auction activity" className="mt-6">
    <div className="theme-card-strong mb-3 flex items-center gap-3 rounded-2xl p-4">
      <span className="rounded-xl bg-accent/15 p-2">
        <History className="h-5 w-5 text-accent" aria-hidden />
      </span>
      <h2 className="text-xl text-foreground">Recent</h2>
      <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
        This session
      </span>
    </div>

    {events.length === 0 ? (
      <p className="theme-card rounded-2xl p-5 text-center text-sm text-muted-foreground">
        Sales and unsold calls will appear here.
      </p>
    ) : (
      <>
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {events.map((event) => (
              <motion.li
                key={event.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="theme-card flex items-center gap-3 rounded-xl p-3"
              >
                {event.type === 'sold' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {event.playerName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {event.type === 'sold' ? `→ ${event.teamName}` : 'Unsold'}
                  </p>
                </div>

                {event.type === 'sold' && event.price !== undefined && (
                  <span className="shrink-0 text-sm font-black tabular-nums text-primary">
                    ₹{event.price.toLocaleString('en-IN')}
                  </span>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        {canCorrectLastSale && (
          <Button
            type="button"
            variant="outline"
            onClick={onCorrectLastSale}
            className="mt-3 h-10 w-full rounded-xl border border-border bg-secondary text-sm font-semibold text-foreground hover:opacity-90"
          >
            <Undo2 className="mr-2 h-4 w-4" aria-hidden />
            Correct last sale
          </Button>
        )}
      </>
    )}
  </section>
);

export default ActivityFeed;
