"use client";

import React, { useMemo } from "react";

import { Marquee } from "@/components/ui/marquee";
import Image from "next/image";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Users } from "lucide-react";

interface Player {
  id: number;
  name: string;
  mobile: string;
  role: "BATSMAN" | "BOWLER" | "ALLROUNDER" | "WICKETKEEPER";
  basePrice: number;
  soldPrice: number | null;
  description: string;
  stats: string | null;
  playerImageUrl: string;
  teamId: number | null;
  isSold: boolean;
  isUnsold: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Team {
  id: number;
  name: string;
  captainName: string;
  captainImage: string;
  currentPurse: number;
  createdAt: string;
  updatedAt: string;
  players: Player[];
}

interface SoldPlayersMarqueeProps {
  teams: Team[];
}

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "BATSMAN":
      return "bg-chart-3/15 border-border text-chart-3";
    case "BOWLER":
      return "bg-accent/15 border-border text-accent";
    case "ALLROUNDER":
      return "bg-chart-2/15 border-border text-chart-2";
    case "WICKETKEEPER":
      return "bg-primary/15 border-border text-primary";
    default:
      return "bg-secondary/60 border-border text-foreground/80";
  }
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
};

const PlayerCard = ({
  player,
  teamName,
  teamColor,
}: {
  player: Player;
  teamName: string;
  teamColor: string;
}) => {
  const profitPercentage = Math.round(
    ((player.soldPrice! - player.basePrice) / player.basePrice) * 100
  );

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="h-full group"
    >
      <figure className="relative h-full w-80 cursor-pointer overflow-hidden rounded-2xl border-2 border-border theme-card p-5 transition-all duration-500 hover:border-border hover:shadow-2xl">
        {/* Animated Gradient Border Glow */}
        <div
          className="absolute -inset-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm rounded-2xl"
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, ${teamColor}80 50%, transparent 100%)`,
          }}
        />

        {/* Shimmer Effect */}
        <div className="absolute inset-0 bg-border/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

        {/* Radial Glow on Hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${teamColor}, transparent 70%)`,
          }}
        />

        <div className="relative z-10">
          {/* Team Badge with Glow */}
          <div className="absolute -top-2 -right-2">
            <div
              className="absolute inset-0 blur-lg opacity-50 rounded-full"
              style={{ backgroundColor: teamColor }}
            />
            <div
              className="relative px-4 py-1.5 rounded-full text-xs font-bold text-foreground shadow-lg border border-border/70"
              style={{ backgroundColor: teamColor }}
            >
              {teamName}
            </div>
          </div>

          {/* Player Image with Enhanced Border */}
          <div className="flex items-center gap-4 mb-4 mt-2">
            <div className="relative">
              <div
                className="absolute -inset-1 blur-md opacity-50 rounded-full group-hover:opacity-75 transition-opacity"
                style={{ backgroundColor: teamColor }}
              />
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-border/70 shadow-xl">
                <Image
                  src={player.playerImageUrl}
                  alt={player.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground truncate mb-2 group-hover:text-primary transition-all">
                {player.name}
              </h3>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(
                  player.role
                )}`}
              >
                {player.role}
              </span>
            </div>
          </div>

          {/* Price Section with Glassmorphism */}
          <div className="theme-card rounded-xl p-4 mb-3 border border-border shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Base Price</p>
                <p className="text-sm font-semibold text-foreground/80">
                  {formatPrice(player.basePrice)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Sold For</p>
                <p className="text-xl font-bold text-accent">
                  {formatPrice(player.soldPrice!)}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <p className="text-xs text-muted-foreground">Profit</p>
                </div>
                <p className="text-sm font-bold text-accent">
                  +{formatPrice(player.soldPrice! - player.basePrice)} (
                  {profitPercentage}% ↑)
                </p>
              </div>
            </div>
          </div>

          {/* Particle Effect Background */}
          <div className="absolute bottom-4 right-4 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none">
            <div className="absolute top-4 right-4 w-2 h-2 bg-accent rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute top-12 right-8 w-1 h-1 bg-accent rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
            <div className="absolute top-8 right-12 w-1.5 h-1.5 bg-accent rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />
          </div>
        </div>
      </figure>
    </motion.div>
  );
};

export function SoldPlayersMarquee({ teams }: SoldPlayersMarqueeProps) {
  const soldPlayersWithTeam = useMemo(() => {
    const teamColors = [
      "var(--chart-3)",
      "var(--destructive)",
      "var(--accent)",
      "var(--chart-2)",
      "var(--primary)",
      "var(--sidebar-ring)",
      "var(--chart-1)",
      "var(--chart-5)",
    ];

    return teams.flatMap((team, index) =>
      team.players
        .filter((player) => player.isSold && player.soldPrice !== null)
        .map((player) => ({
          player,
          teamName: team.name,
          teamColor: teamColors[index % teamColors.length],
        }))
    );
  }, [teams]);

  const firstRow = soldPlayersWithTeam.slice(
    0,
    Math.ceil(soldPlayersWithTeam.length / 2)
  );
  const secondRow = soldPlayersWithTeam.slice(
    Math.ceil(soldPlayersWithTeam.length / 2)
  );

  if (soldPlayersWithTeam.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full py-20 text-center"
      >
        <div className="inline-block px-6 py-3 bg-card/70 backdrop-blur-sm rounded-2xl border border-border">
          <p className="text-muted-foreground text-lg">🏏 No players sold yet</p>
        </div>
      </motion.div>
    );
  }

  const totalSpent = soldPlayersWithTeam.reduce(
    (sum, { player }) => sum + (player.soldPrice || 0),
    0
  );
  const avgPrice = totalSpent / soldPlayersWithTeam.length;

  return (
    <div className="w-full py-16 relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-chart-3/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header with Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 relative z-10"
      >
        <div className="inline-block px-4 py-1 mb-4 bg-accent/10 rounded-full border border-border">
          <span className="text-accent text-sm font-medium tracking-wide">
            SOLD PLAYERS
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-3">
          <span className="text-foreground">
            🏆 Championship Roster
          </span>
        </h2>
        <p className="text-muted-foreground text-lg">
          {soldPlayersWithTeam.length} elite players across {teams.length} teams
        </p>
      </motion.div>

      {/* Full-Width Marquee Container */}
      <div className="relative w-full overflow-hidden rounded-2xl theme-card py-12 border-y border-border/50">
        {/* First Row - Left to Right */}
        <Marquee pauseOnHover className="[--duration:45s] mb-6">
          {firstRow.map(({ player, teamName, teamColor }) => (
            <PlayerCard
              key={player.id}
              player={player}
              teamName={teamName}
              teamColor={teamColor}
            />
          ))}
        </Marquee>

        {/* Second Row - Right to Left */}
        {secondRow.length > 0 && (
          <Marquee reverse pauseOnHover className="[--duration:45s]">
            {secondRow.map(({ player, teamName, teamColor }) => (
              <PlayerCard
                key={player.id}
                player={player}
                teamName={teamName}
                teamColor={teamColor}
              />
            ))}
          </Marquee>
        )}

        {/* Edge Gradient Overlays for Seamless Effect */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-card via-card/70 to-transparent z-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-card via-card/70 to-transparent z-20" />
      </div>

      {/* Enhanced Stats Summary with Glow Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto relative z-10"
      >
        {[
          {
            icon: Users,
            label: "Total Sold",
            value: soldPlayersWithTeam.length,
            color: "text-chart-3",
            borderColor: "border-border",
            glowColor: "rgba(59, 130, 246, 0.4)",
          },
          {
            icon: DollarSign,
            label: "Total Spent",
            value: formatPrice(totalSpent),
            color: "text-accent",
            borderColor: "border-border",
            glowColor: "rgba(16, 185, 129, 0.4)",
          },
          {
            icon: TrendingUp,
            label: "Avg Price",
            value: formatPrice(avgPrice),
            color: "text-primary",
            borderColor: "border-border",
            glowColor: "rgba(245, 158, 11, 0.4)",
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="group relative"
            >
              {/* Outer Glow */}
              <div
                className="absolute -inset-4 opacity-0 group-hover:opacity-60 transition-opacity duration-500 blur-2xl rounded-2xl"
                style={{ background: `radial-gradient(circle, ${stat.glowColor} 0%, transparent 70%)` }}
              />

              <div className={`relative theme-card rounded-2xl p-6 border-2 ${stat.borderColor} group-hover:border-border transition-all duration-500 overflow-hidden`}>
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-border/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

                <div className="relative z-10 flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  <div className={`w-10 h-10 rounded-lg bg-secondary border ${stat.borderColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <p className={`text-3xl md:text-4xl font-black ${stat.color} group-hover:scale-105 transition-transform duration-300`}>
                  {stat.value}
                </p>

                {/* Particle Effects */}
                <div className="absolute bottom-2 right-2 w-20 h-20 opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none">
                  <div className={`absolute w-1.5 h-1.5 ${stat.color} rounded-full animate-ping`} style={{ animationDuration: '2s' }} />
                  <div className={`absolute top-4 left-4 w-1 h-1 ${stat.color} rounded-full animate-ping`} style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

export default SoldPlayersMarquee;
