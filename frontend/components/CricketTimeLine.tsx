'use client';
import React from "react";
import { Timeline } from "@/components/ui/timeline";

export function CricketTournamentTimeline() {
  const data = [
    {
      title: "11 Jan",
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10 ">
              <span className="text-xl">⏰</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-destructive ">
                Retention Deadline
              </h3>
             
            </div>
          </div>
          
          <p className="text-sm leading-relaxed text-muted-foreground">
            Final day for captains to announce retained players.
          </p>
          
          <div className="border-l-4 border-destructive bg-secondary/60 p-4 ">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-destructive ">
                  Hard Deadline
                </p>
                <p className="mt-1 text-lg font-bold text-destructive">
                  11:59 PM IST
                </p>
              </div>
              <div className="rounded-full bg-destructive/20 px-3 py-1 text-xs font-semibold text-destructive ">
                URGENT
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "18 Jan",
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-chart-3/10 ">
              <span className="text-xl">📝</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-chart-3 ">
                Player Registration
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Open Auction Pool Enrollment
              </p>
            </div>
          </div>
          
          <p className="text-sm leading-relaxed text-muted-foreground">
            Individual players can register for the auction pool. Submit your complete
            profile though the form provided above.
          </p>

          
          <div className="grid gap-3 rounded-lg theme-card p-4 ">
            <div className="flex items-center gap-3 rounded-md bg-card/80 p-3 shadow-sm transition-all hover:shadow-md">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-chart-3 text-primary-foreground">
                <span className="text-sm">🏏</span>
              </div>
              <p className="text-sm font-medium text-foreground">
                Specify role: Batsman / Bowler / All-rounder 
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-md bg-card/80 p-3 shadow-sm transition-all hover:shadow-md">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-primary-foreground">
                <span className="text-sm">💰</span>
              </div>
              <p className="text-sm font-medium text-foreground">
                Set your base price and experience level
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-md bg-card/80 p-3 shadow-sm transition-all hover:shadow-md">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-chart-2 text-primary-foreground">
                <span className="text-sm">📊</span>
              </div>
              <p className="text-sm font-medium text-foreground">
                Upload stats and previous tournament records
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "22 Jan",
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 ">
              <span className="text-xl">🎯</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary ">
                Auction Day
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Live Player Bidding Event
              </p>
            </div>
          </div>
          
          <p className="text-sm leading-relaxed text-muted-foreground">
            The most exciting day! Team captains compete in live bidding to build their
            dream squads. Strategy, excitement, and talent come together.
          </p>
          
          <div className="overflow-hidden rounded-xl border border-border theme-card ">
            <div className="border-b border-border bg-primary px-4 py-2 ">
              <p className="text-sm font-bold uppercase tracking-wide text-primary-foreground">
                💼 Auction Format
              </p>
            </div>
            <div className="space-y-2 p-4">
              <div className="flex items-start gap-2">
                <span className="mt-1 text-primary ">▸</span>
                <p className="text-sm text-muted-foreground">
                  Open bidding for all registered players
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 text-primary ">▸</span>
                <p className="text-sm text-muted-foreground">
                  Highest bidder secures the player
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 text-primary ">▸</span>
                <p className="text-sm text-muted-foreground">
                  Build your championship squad within budget of ₹1 Lacks
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "30 Jan",
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 ">
              <span className="text-xl">🏆</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-accent ">
                Tournament Day 1
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Opening Matches
              </p>
            </div>
          </div>
          
          <p className="text-sm leading-relaxed text-muted-foreground">
            The tournament kicks off! Opening matches begin with all teams ready to
            showcase their talent, strategy, and determination on the field.
          </p>
          
          <div className="relative overflow-hidden rounded-xl bg-accent p-6 text-accent-foreground shadow-lg ">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-foreground/10"></div>
            <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-foreground/10"></div>
            <div className="relative">
              <p className="text-2xl font-bold">🎉 Opening Day</p>
              <p className="mt-2 text-sm text-foreground/90">
                Let the battle for glory begin!
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "31 Jan",
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-chart-3/10 ">
              <span className="text-xl">🏏</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-chart-3 ">
                Tournament Day 2
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Group Stage Continues
              </p>
            </div>
          </div>
          
          <p className="text-sm leading-relaxed text-muted-foreground">
            The action intensifies! Day 2 brings more thrilling matches as teams
            battle for supremacy and crucial qualification spots.
          </p>
          
          <div className="space-y-2 rounded-lg theme-card p-4 ">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-chart-3 text-primary-foreground">
                <span className="text-xs">✓</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Group stage matches in full swing
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-chart-3 text-primary-foreground">
                <span className="text-xs">✓</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Points table and rankings taking shape
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-chart-3 text-primary-foreground">
                <span className="text-xs">✓</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Qualification scenarios become clearer
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "1 Feb",
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-chart-2/10 ">
              <span className="text-xl">🏅</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-chart-2 ">
                Tournament Day 3
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Finals & Championship
              </p>
            </div>
          </div>
          
          <p className="text-sm leading-relaxed text-muted-foreground">
            The grand finale! The best teams face off in knockout stages and finals.
            Witness champions being crowned in an unforgettable showdown.
          </p>
          
          <div className="relative overflow-hidden rounded-xl border-2 border-border theme-card p-6 shadow-xl ">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/20"></div>
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-chart-2/20"></div>
            <div className="relative space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-3xl">🏆</span>
                <p className="text-2xl font-black text-chart-2 ">
                  Championship Day
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-chart-2 px-3 py-1 text-xs font-bold text-primary-foreground shadow-md">
                  Semi-Finals
                </span>
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-md">
                  Final Match
                </span>
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-primary-foreground shadow-md">
                  Trophy Ceremony
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="relative w-full overflow-clip bg-secondary">
      <Timeline data={data} />
    </div>
  );
}
