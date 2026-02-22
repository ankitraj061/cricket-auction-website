'use client';

import React from 'react';
import Image from 'next/image';
import { Player, Team } from '@/app/types/type';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, Phone, Trophy, Sparkles, MoreVertical, Pencil, Trash2, Gavel, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { uiTokens } from '@/lib/uiTokens';

interface PlayerCardProps {
  player: Player;
  teams?: Team[];
  isAdmin?: boolean;
  onEdit?: (player: Player) => void;
  onDelete?: (player: Player) => void;
  onManageSale?: (player: Player) => void;
  onMarkUnsold?: (player: Player) => void;
}

const PlayerCard = ({
  player,
  teams,
  isAdmin = false,
  onEdit,
  onDelete,
  onManageSale,
  onMarkUnsold,
}: PlayerCardProps) => {
  const getPlayerIcon = () => {
    const role = player.role.toLowerCase();
    const iconClass = "h-6 w-6";

    if (role.includes('batsman') || role === 'batsmen') {
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor">
          <path d="M12 3v14M12 3l-3 5M12 3l3 5" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="19" r="2" fill="currentColor" />
        </svg>
      );
    }

    if (role.includes('bowler')) {
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor">
          <path d="M2 12h20M6 8l6 8 4-10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }

    if (role.includes('allrounder')) {
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }

    if (role.includes('keeper') || role.includes('wicket')) {
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor">
          <path d="M12 3v3m0 12v3M4 12h3m10 0h3M7 7l5 5 5-5M7 17l5-5 5 5" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor">
        <circle cx="12" cy="12" r="9" opacity="0.8" />
        <path
          d="M12 3a9 9 0 0 0-7 14.2 9.5 9.5 0 0 0 14 0A9 9 0 0 0 12 3z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  const getTeamById = (id: number) => teams?.find((team) => team.id === id) ?? null;

  const team = player.teamId ? getTeamById(player.teamId) : null;
  const isSold = player.isSold && player.soldPrice != null;
  const teamName = team ? `Team ${team.name}` : 'Unsold';

  // Enhanced role-based styling
  const roleConfig = {
    batsman: {
      label: 'Batsman',
      color: 'bg-primary/20 text-primary border-primary/40',
      gradient: 'from-primary/20 to-primary/10',
      glowColor: 'color-mix(in srgb, var(--primary) 35%, transparent)',
      iconBg: 'bg-primary/30',
    },
    bowler: {
      label: 'Bowler',
      color: 'bg-chart-2/20 text-chart-2 border-chart-2/40',
      gradient: 'from-chart-2/20 to-chart-3/20',
      glowColor: 'color-mix(in srgb, var(--chart-2) 35%, transparent)',
      iconBg: 'bg-chart-2/30',
    },
    allrounder: {
      label: 'All-Rounder',
      color: 'bg-chart-5/20 text-chart-5 border-chart-5/40',
      gradient: 'from-chart-5/20 to-accent/20',
      glowColor: 'color-mix(in srgb, var(--chart-5) 35%, transparent)',
      iconBg: 'bg-chart-5/30',
    },
    wicketkeeper: {
      label: 'WK',
      color: 'bg-chart-2/20 text-chart-2 border-chart-2/40',
      gradient: 'from-chart-2/20 to-chart-2/30',
      glowColor: 'color-mix(in srgb, var(--chart-2) 35%, transparent)',
      iconBg: 'bg-chart-2/30',
    },
    default: {
      label: player.role,
      color: 'bg-muted text-muted-foreground border-border',
      gradient: 'from-muted to-secondary',
      glowColor: 'color-mix(in srgb, var(--muted-foreground) 35%, transparent)',
      iconBg: 'bg-muted',
    },
  };

  const roleKey = player.role.toLowerCase() as keyof typeof roleConfig;
  const role = roleConfig[roleKey] || roleConfig.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="h-full group"
    >
      {/* Outer Glow Container */}
      <div className="relative h-full">
        {/* Hover Glow Effect */}
        <div
          className="absolute -inset-2 opacity-0 group-hover:opacity-60 transition-opacity duration-500 blur-2xl rounded-2xl"
          style={{ background: `radial-gradient(circle, ${role.glowColor} 0%, transparent 70%)` }}
        />

        {/* Main Card */}
        <Card className="theme-card-strong relative overflow-hidden transition-all duration-500 rounded-2xl flex flex-col h-full shadow-xl group-hover:shadow-2xl">

          {/* Top Radial Glow */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none"
            style={{ background: `radial-gradient(circle at 50% 0%, ${role.glowColor}, transparent 60%)` }}
          />

          {/* Sold Badge (Top Right) */}
          {isSold && (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="absolute top-3 right-3 z-20"
            >
              <Badge className="bg-accent text-accent-foreground border-0 px-2 py-0.5 text-xs font-bold shadow-lg flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                SOLD
              </Badge>
            </motion.div>
          )}

          {isAdmin && (
            <div className="absolute top-3 left-3 z-20">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={uiTokens.actionMenuTrigger}
                    aria-label={`Open actions for ${player.name}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className={uiTokens.actionMenuContent}>
                  <DropdownMenuLabel>Player Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => onEdit?.(player)}>
                    <Pencil className="h-4 w-4" />
                    Edit player
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onManageSale?.(player)}>
                    <Gavel className="h-4 w-4" />
                    {isSold ? 'Edit sold details' : 'Set sold details'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!isSold}
                    onSelect={() => onMarkUnsold?.(player)}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Mark unsold
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => onDelete?.(player)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete player
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Content */}
          <div className="relative z-10 p-5 flex flex-col h-full">
            {/* Player Header */}
            <div className="flex items-start gap-3 mb-4">
              {/* Player Image/Avatar */}
              {player.playerImageUrl ? (
                <div className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 border-border/60 shadow-lg group-hover:border-border transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Image
                    src={player.playerImageUrl}
                    alt={player.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                  <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ) : (
                <div className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 border-border/60 shadow-lg group-hover:border-border transition-all duration-300 group-hover:scale-110">
                  <div className={`w-full h-full flex items-center justify-center ${role.iconBg} backdrop-blur-sm`}>
                    <div className="text-foreground group-hover:scale-110 transition-transform duration-300">
                      {getPlayerIcon()}
                    </div>
                  </div>
                </div>
              )}

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-foreground text-base md:text-lg line-clamp-1 transition-colors duration-300 group-hover:text-primary">
                  {player.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs theme-muted group-hover:text-foreground/80 transition-colors duration-300">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="line-clamp-1">{player.mobile || 'No contact'}</span>
                </div>
              </div>
            </div>

            {/* Role Badge */}
            <Badge className={`text-xs font-semibold border-2 ${role.color} backdrop-blur-md self-start px-3 py-1 shadow-md group-hover:scale-105 transition-transform duration-300`}>
              <Sparkles className="h-3 w-3 mr-1" />
              {role.label}
            </Badge>

            {/* Description */}
            {player.description && (
              <p className="text-xs theme-muted line-clamp-2 mt-3 leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
                {player.description}
              </p>
            )}

            {/* Stats */}
            {player.stats && (
              <div className="mt-2 px-3 py-2 bg-card/70 rounded-lg border border-border/70">
                <p className="text-xs italic theme-muted line-clamp-1">{player.stats}</p>
              </div>
            )}

            {/* Spacer */}
            <div className="flex-grow" />

            {/* Bottom Section */}
            <div className="mt-4 pt-4 border-t border-border/70 space-y-3">
              {/* Price Info */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-medium">Price</span>
                {isSold ? (
                  <div className="flex items-center gap-1.5 text-primary font-black text-base">
                    <IndianRupee className="h-4 w-4" />
                    <span>{player.soldPrice!.toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 text-foreground/80 font-bold text-sm">
                      <IndianRupee className="h-3.5 w-3.5" />
                      <span>{player.basePrice.toLocaleString()}</span>
                    </div>
                    <Badge variant="outline" className="h-5 px-2 text-[10px] border-chart-3/40 text-chart-3 bg-chart-3/10 font-semibold">
                      Available
                    </Badge>
                  </div>
                )}
              </div>

              {/* Team Info (if sold) */}
              {isSold && team && (
                <div className="flex items-center justify-between px-3 py-2 bg-secondary/70 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-accent" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Team</p>
                      <p className="text-sm font-bold text-accent line-clamp-1">{teamName}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-1 bg-border opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </Card>
      </div>
    </motion.div>
  );
};

export default PlayerCard;
