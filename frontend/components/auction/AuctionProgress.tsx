'use client';

export interface AuctionStats {
  total: number;
  sold: number;
  unsold: number;
  remaining: number;
}

interface AuctionProgressProps {
  stats: AuctionStats;
  round: number;
}

const AuctionProgress = ({ stats, round }: AuctionProgressProps) => {
  const decided = stats.sold + stats.unsold;
  const position = Math.min(decided + 1, stats.total);
  const percent = stats.total > 0 ? (decided / stats.total) * 100 : 0;

  return (
    <div className="theme-card flex flex-col gap-3 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex items-center gap-3">
        {round > 1 && (
          <span className="rounded-full bg-chart-5/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-chart-5">
            Round {round}
          </span>
        )}
        <span className="whitespace-nowrap text-sm font-semibold text-foreground">
          Player <span className="tabular-nums">{position}</span> of{' '}
          <span className="tabular-nums">{stats.total}</span>
        </span>
      </div>

      <div className="flex-1">
        <div
          className="h-2 overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-valuenow={decided}
          aria-valuemin={0}
          aria-valuemax={stats.total}
          aria-label="Players decided"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <dl className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <dt className="uppercase tracking-wide text-muted-foreground">Sold</dt>
          <dd className="font-black tabular-nums text-primary">{stats.sold}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="uppercase tracking-wide text-muted-foreground">Unsold</dt>
          <dd className="font-black tabular-nums text-destructive">{stats.unsold}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="uppercase tracking-wide text-muted-foreground">Left</dt>
          <dd className="font-black tabular-nums text-foreground">{stats.remaining}</dd>
        </div>
      </dl>
    </div>
  );
};

export default AuctionProgress;
