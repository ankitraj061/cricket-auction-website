'use client';

import { Card } from '@/components/ui/card';
import { Users, IndianRupee, Trophy, Sparkles, ChevronRight, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Team } from '@/app/types/type';
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

interface TeamCardProps {
  team: Team;
  initialPurse?: number;
  isAdmin?: boolean;
  onEdit?: (team: Team) => void;
  onDelete?: (team: Team) => void;
}

const TeamCard = ({
  team,
  initialPurse = 100000,
  isAdmin = false,
  onEdit,
  onDelete,
}: TeamCardProps) => {
  const router = useRouter();
  const pursePercentage = (team.currentPurse / initialPurse) * 100;

  const handleCardClick = () => {
    router.push(`/teams/${team.id}`);
  };

  const getPurseColor = () => {
    if (pursePercentage > 60) return 'bg-accent';
    if (pursePercentage > 30) return 'bg-primary';
    return 'bg-destructive';
  };

  return (
    <motion.div
      onClick={handleCardClick}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="group h-full cursor-pointer"
    >
        <div className="relative h-full">
          <Card className="theme-card-strong relative rounded-2xl h-full overflow-hidden shadow-xl transition-all duration-300 cursor-pointer">
            {isAdmin && (
              <div className="absolute top-3 right-3 z-30" data-team-actions="true" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={uiTokens.actionMenuTrigger}
                      aria-label={`Open actions for ${team.name}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className={uiTokens.actionMenuContent}>
                    <DropdownMenuLabel>Team Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => onEdit?.(team)}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit team
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => onDelete?.(team)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete team
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            
            <div className="absolute top-0 left-0 right-0 h-1 bg-border opacity-80"></div>
            
            <div className="relative p-3 flex flex-col h-full">
              <div className="flex items-start gap-3 mb-3">
             
                <div className="relative shrink-0">
                  {team.captainImage ? (
                    <img
                      src={team.captainImage}
                      alt={team.captainName}
                      className="relative w-20 h-20 rounded-full border-2 border-border object-cover shadow-lg"
                    />
                  ) : (
                    <div className="relative w-20 h-20 rounded-full bg-secondary flex items-center justify-center border-2 border-border shadow-lg">
                      <span className="text-primary font-black text-xl">
                        {team.captainName.charAt(0)}
                      </span>
                    </div>
                  )}
                  
                  <div className="absolute -bottom-1 -right-1 bg-accent p-1.5 rounded-full border border-border">
                    <Trophy className="h-5 w-5 text-accent-foreground" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-lg line-clamp-1 mb-1 mt-2 text-foreground group-hover:text-primary transition-colors">
                     {team.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs theme-muted font-medium">{team.captainName}</span>
                  </div>
                </div>

                <motion.div
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ x: -10 }}
                  whileHover={{ x: 0 }}
                >
                  <div
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-secondary text-foreground"
                    aria-label={`Open ${team.name}`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </motion.div>
              </div>

              <div className="space-y-2 mt-auto">
                <motion.div 
                  className="theme-card border border-border rounded-xl p-4 transition-all duration-300"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/15 rounded-lg border border-border">
                        <IndianRupee className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-0.5">Current Purse</p>
                        <p className="text-lg font-black text-primary">
                          ₹{team.currentPurse.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className={`px-3 py-1 ${getPurseColor()} rounded-full text-xs font-bold text-primary-foreground shadow-lg`}>
                      {pursePercentage.toFixed(0)}%
                    </div>
                  </div>

                  <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pursePercentage}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className={`h-full ${getPurseColor()}`}
                    ></motion.div>
                  </div>
                </motion.div>

                <motion.div 
                  className="theme-card border border-border rounded-xl p-4 transition-all duration-300"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent/15 rounded-lg border border-border">
                        <Users className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-0.5">Squad Size</p>
                        <p className="text-lg font-black text-accent">
                          {(team.totalPlayers ?? team.players?.length ?? 0)} Players
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border opacity-80"></div>
          </Card>
        </div>
    </motion.div>
  );
};

export default TeamCard;
