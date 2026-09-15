'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, CheckCircle2, XCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { AuctionPlayer } from '@/app/types/type';

interface AuctionCardProps {
  player: AuctionPlayer;
  eyebrow?: string;
}

const roleConfig: Record<string, { label: string; color: string }> = {
  batsman: { label: 'Batsman', color: 'bg-accent/20 text-accent border-accent/50' },
  bowler: { label: 'Bowler', color: 'bg-chart-3/20 text-chart-3 border-chart-3/50' },
  allrounder: { label: 'All-Rounder', color: 'bg-primary/20 text-primary border-primary/50' },
  wicketkeeper: { label: 'Wicketkeeper', color: 'bg-chart-2/20 text-chart-2 border-chart-2/50' },
};

/** `stats` arrives as free text like "Inning : 8, Runs : 30, Strike Rate : 120". */
const parseStats = (raw: string) =>
  raw
    .split(',')
    .map((chunk) => {
      const [label, ...rest] = chunk.split(':');
      const value = rest.join(':').trim();
      return { label: label.trim(), value };
    })
    .filter((stat) => stat.label && stat.value);

const AuctionCard = ({ player, eyebrow = 'Now Bidding' }: AuctionCardProps) => {
  const reduceMotion = useReducedMotion();
  const roleKey = player.role.toLowerCase().replace(/[^a-z]/g, '');
  const role = roleConfig[roleKey] ?? {
    label: player.role,
    color: 'bg-secondary text-foreground/80 border-border',
  };

  const stats = player.stats ? parseStats(player.stats) : [];

  return (
    <motion.div
      key={player.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="theme-card-strong stadium-glow relative overflow-hidden rounded-3xl border-2 border-border p-0">
        <div className="pointer-events-none absolute left-0 top-0 h-32 w-32 rounded-br-full bg-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-tl-full bg-chart-2/10 blur-2xl" />

        <div className="relative grid gap-6 p-5 sm:p-7 md:grid-cols-[auto_1fr] md:gap-8">
          <div className="relative mx-auto shrink-0 md:mx-0">
            <motion.div
              animate={reduceMotion ? undefined : { rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-2 rounded-full bg-primary/30 blur-md"
              aria-hidden
            />
            <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-border bg-card shadow-xl sm:h-52 sm:w-52">
              {player.playerImageUrl ? (
                <Image
                  src={player.playerImageUrl}
                  alt={player.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 160px, 208px"
                  priority
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-5xl font-black text-muted-foreground">
                  {player.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <div className="min-w-0 space-y-4 text-center md:text-left">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {eyebrow}
              </p>
              <h2 className="mt-1 break-words text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
                {player.name}
              </h2>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <Badge variant="outline" className={`border-2 px-4 py-1.5 text-base font-bold ${role.color}`}>
                {role.label}
              </Badge>

              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm font-semibold text-foreground">
                Base
                <IndianRupee className="h-3.5 w-3.5" aria-hidden />
                <span className="tabular-nums">{player.basePrice.toLocaleString('en-IN')}</span>
              </span>

              {player.isSold && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 bg-primary/15 px-3 py-1.5 text-sm font-bold text-primary">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Already sold
                </span>
              )}
              {player.isUnsold && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/50 bg-destructive/15 px-3 py-1.5 text-sm font-bold text-destructive">
                  <XCircle className="h-4 w-4" aria-hidden />
                  Previously unsold
                </span>
              )}
            </div>

            {stats.length > 0 && (
              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {stats.map((stat) => (
                  <div key={stat.label} className="theme-card rounded-xl px-3 py-2 text-center">
                    <dt className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                      {stat.label}
                    </dt>
                    <dd className="mt-0.5 text-lg font-black tabular-nums text-foreground">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {stats.length === 0 && player.stats && (
              <p className="theme-card rounded-xl p-3 text-sm text-muted-foreground">
                {player.stats}
              </p>
            )}

            {player.description && (
              <p className="text-base leading-relaxed text-foreground/85">{player.description}</p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default AuctionCard;
