'use client';

import { motion } from 'framer-motion';
import { Users, IndianRupee, Trophy, Ban } from 'lucide-react';
import type { TeamSummary } from '@/app/types/type';

interface TeamStatusPanelProps {
  teams: TeamSummary[];
  currentBid: number;
  maxPlayersPerTeam: number;
}

const TeamStatusPanel = ({ teams, currentBid, maxPlayersPerTeam }: TeamStatusPanelProps) => (
  <section aria-label="Team status">
    <div className="theme-card-strong mb-4 flex items-center gap-3 rounded-2xl p-4">
      <span className="rounded-xl bg-chart-3/15 p-2">
        <Users className="h-5 w-5 text-chart-3" aria-hidden />
      </span>
      <h2 className="text-xl text-foreground">Team Status</h2>
      <span className="ml-auto rounded-full bg-chart-3/20 px-3 py-1 text-xs font-bold text-chart-3">
        {teams.length} {teams.length === 1 ? 'Team' : 'Teams'}
      </span>
    </div>

    {teams.length === 0 ? (
      <p className="theme-card rounded-2xl p-6 text-center text-sm text-muted-foreground">
        No teams found. Create teams before running the auction.
      </p>
    ) : (
      <ul className="space-y-3 lg:max-h-[46vh] lg:overflow-y-auto lg:pr-1">
        {teams.map((team, index) => {
          const isFull = team.totalPlayers >= maxPlayersPerTeam;
          const cannotAfford = team.remainingPurse < currentBid;
          const isOut = isFull || cannotAfford;

          return (
            <motion.li
              key={team.teamId}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.3) }}
            >
              <div
                className={`theme-card rounded-xl border p-4 transition-colors duration-300 ${
                  isOut ? 'border-border/50 opacity-55' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="shrink-0 rounded-lg bg-accent/15 p-2">
                      <Trophy className="h-4 w-4 text-accent" aria-hidden />
                    </span>
                    <h3 className="truncate text-base text-foreground">{team.name}</h3>
                  </div>

                  <div className="flex shrink-0 items-center gap-4">
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Players
                      </p>
                      <p className="text-base font-black text-accent tabular-nums">
                        {team.totalPlayers}
                        <span className="text-xs font-semibold text-muted-foreground">
                          /{maxPlayersPerTeam}
                        </span>
                      </p>
                    </div>

                    <div className="h-8 w-px bg-border" aria-hidden />

                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Purse
                      </p>
                      <p
                        className={`flex items-center justify-end gap-0.5 text-base font-black tabular-nums ${
                          cannotAfford ? 'text-destructive' : 'text-primary'
                        }`}
                      >
                        <IndianRupee className="h-3.5 w-3.5" aria-hidden />
                        {team.remainingPurse.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>

                {isOut && (
                  <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-2 text-xs font-semibold text-destructive">
                    <Ban className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {isFull ? 'Squad full' : `Cannot afford ₹${currentBid.toLocaleString('en-IN')}`}
                  </p>
                )}
              </div>
            </motion.li>
          );
        })}
      </ul>
    )}
  </section>
);

export default TeamStatusPanel;
