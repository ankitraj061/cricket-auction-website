'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, Target, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ Local Player type matching your API response exactly
interface Player {
  id: number;
  name: string;
  mobile: string | null;
  role: 'BATSMAN' | 'BOWLER' | 'ALLROUNDER' | 'WICKETKEEPER';
  basePrice: number;
  soldPrice: number | null;
  description: string | null;
  stats: string | null;
  playerImageUrl: string | null;
  teamId: number | null;
  isSold: boolean;
  isUnsold: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuctionCardProps {
  player: Player;
  defaultPrice?: number;
}

const AuctionCard = ({ player, defaultPrice }: AuctionCardProps) => {
  const displayPrice = defaultPrice || player.basePrice;
  const isBidding = defaultPrice && defaultPrice > player.basePrice;

  const roleConfig = {
    batsman: { 
      label: 'Batsman', 
      color: 'bg-accent/20 text-accent border-accent/50',
      glow: 'shadow-accent/40'
    },
    bowler: { 
      label: 'Bowler', 
      color: 'bg-chart-3/20 text-chart-3 border-chart-3/50',
      glow: 'shadow-chart-3/40'
    },
    allrounder: { 
      label: 'All-Rounder', 
      color: 'bg-primary/20 text-primary border-primary/50',
      glow: 'shadow-primary/40'
    },
    wicketkeeper: { 
      label: 'Wicketkeeper', 
      color: 'bg-chart-2/20 text-chart-2 border-chart-2/50',
      glow: 'shadow-chart-2/40'
    },
    default: { 
      label: player.role, 
      color: 'bg-secondary/60 text-foreground/80 border-border',
      glow: 'shadow-border/40'
    },
  };

  // ✅ Convert role to lowercase for roleConfig lookup
  const roleKey = player.role.toLowerCase() as keyof typeof roleConfig;
  const role = roleConfig[roleKey] || roleConfig.default;

  const getPlayerIcon = () => {
    const r = player.role.toLowerCase();
    const cls = "h-16 w-16 text-muted-foreground";
    if (r.includes('bat')) return <BatIcon className={cls} />;
    if (r.includes('bowl')) return <BowlIcon className={cls} />;
    if (r.includes('all')) return <AllRoundIcon className={cls} />;
    if (r.includes('keep') || r.includes('wicket')) return <KeeperIcon className={cls} />;
    return <BallIcon className={cls} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative max-w-5xl"
    >
      <Card className="relative theme-card-strong backdrop-blur-2xl border-2 border-border rounded-3xl overflow-hidden shadow-2xl">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          {/* ✅ Fixed: bg-size-[14px_24px] → bg-[size:14px_24px] */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        </div>

        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-br-full blur-2xl"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-chart-2/10 rounded-tl-full blur-2xl"></div>

        {/* Main Content */}
        <div className="relative p-2 px-10">
          {/* Player Showcase Section */}
          <div className="items-start gap-8 mb-6 grid md:grid-cols-2 lg:grid-cols-2 sm:grid-cols-1">
            {/* Enhanced Avatar with Holographic Ring */}
            <motion.div 
              className="relative shrink-0"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Rotating Accent Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 bg-primary/35 rounded-full opacity-75 blur-md"
              ></motion.div>
              
              <div className="absolute -inset-1 bg-primary/25 rounded-full opacity-50 blur-sm"></div>
              {player.playerImageUrl ? (
                // ✅ Fixed: w-75 h-75 → w-48 h-48 (192px)
                <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-border shadow-xl bg-card">
                  <Image
                    src={player.playerImageUrl}
                    alt={player.name}
                    fill
                    className="object-cover"
                    sizes="192px"
                    priority
                  />
                  <div className="absolute inset-0 bg-background/30"></div>
                </div>
              ) : (
                <div className="relative w-48 h-48 rounded-full flex items-center justify-center border-4 border-border shadow-xl bg-card backdrop-blur-sm">
                  {getPlayerIcon()}
                </div>
              )}

              {/* Power Indicator */}
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow-lg border border-border/60"
              >
                <Target className="h-3 w-3 inline mr-1" />
                PREMIUM
              </motion.div>
            </motion.div>

            {/* Player Info - Glass Cards */}
            <div className="flex-1 space-y-2 ml-6">
              {/* Name Card */}
              <motion.div 
                className="theme-card backdrop-blur-xl border border-border rounded-2xl p-4 shadow-lg"
                whileHover={{ scale: 1.02, borderColor: 'rgba(6,182,212,0.5)' }}
              >
                <p className="text-xs font-semibold text-primary mb-1 tracking-wider uppercase">Player Name</p>
                <h3 className="text-3xl font-black text-foreground">
                  {player.name}
                </h3>
              </motion.div>

              {/* Current Bid / Base Price Card */}
              <motion.div 
                className={`theme-card backdrop-blur-xl border rounded-2xl p-3 transition-all duration-300 ${
                  isBidding 
                    ? 'border-accent/40 shadow-lg'
                    : 'border-primary/40 shadow-lg'
                }`}
                whileHover={{ scale: 1.02 }}
                animate={isBidding ? { 
                  boxShadow: [
                    '0 8px 32px 0 rgba(16,185,129,0.2)',
                    '0 8px 32px 0 rgba(16,185,129,0.4)',
                    '0 8px 32px 0 rgba(16,185,129,0.2)'
                  ]
                } : {}}
                transition={{ duration: 1.5, repeat: isBidding ? Infinity : 0 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-xs font-semibold tracking-wider uppercase ${
                    isBidding ? 'text-accent' : 'text-primary'
                  }`}>
                    {isBidding ? 'Current Bid' : 'Base Price'}
                  </p>
                  
                  {/* Live Bidding Indicator */}
                  <AnimatePresence>
                    {isBidding && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="flex items-center gap-1 bg-accent/20 px-2 py-1 rounded-full"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 bg-accent rounded-full"
                        />
                        <span className="text-[10px] font-bold text-accent">LIVE</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${
                    isBidding ? 'bg-accent/20' : 'bg-primary/20'
                  }`}>
                    {isBidding ? (
                      <TrendingUp className="h-6 w-6 text-accent " />
                    ) : (
                      <IndianRupee className="h-6 w-6 text-primary " />
                    )}
                  </div>
                  
                  {/* Animated Price Counter */}
                  <motion.p
                    key={displayPrice}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={`text-3xl font-black ${
                      isBidding 
                        ? 'text-accent '
                        : 'text-primary '
                    }`}
                  >
                    ₹{displayPrice.toLocaleString()}
                  </motion.p>
                </div>

                {/* Base Price Reference when bidding */}
                <AnimatePresence>
                  {isBidding && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 pt-2 border-t border-border"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Base Price:</span>
                        <span className="text-foreground/80 font-semibold">
                          ₹{player.basePrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-accent">Increase:</span>
                        <span className="text-accent font-bold">
                          +₹{(displayPrice - player.basePrice).toLocaleString()}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Role Card */}
              <motion.div 
                className="theme-card backdrop-blur-xl border border-border rounded-2xl p-3"
                whileHover={{ scale: 1.02 }}
              >
                <p className="text-xs font-semibold text-muted-foreground mb-3 tracking-wider uppercase">Role</p>
                <Badge
                  variant="outline"
                  className={`text-lg font-bold px-6 py-2 border-2 ${role.color} ${role.glow} shadow-lg`}
                >
                  {role.label}
                </Badge>
              </motion.div>
            </div>
          </div>

          {/* Description Section */}
          {player.description && (
            <motion.div 
              className="theme-card backdrop-blur-xl border border-border rounded-2xl p-3 mb-3 shadow-lg relative overflow-hidden"
              whileHover={{ borderColor: 'rgba(59,130,246,0.5)' }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-chart-3/70"></div>
              
              <p className="text-xs font-semibold text-chart-3 mb-1 tracking-wider uppercase flex items-center gap-2">
                <span className="w-2 h-2 bg-chart-3 rounded-full animate-pulse inline-block"></span>
                Player Profile
              </p>

              <p className="text-base text-foreground/85 leading-relaxed line-clamp-2 font-light">
                {player.description}
              </p>
            </motion.div>
          )}

          {/* Stats Section */}
          {player.stats && (
            <motion.div 
              className="theme-card backdrop-blur-xl border border-border rounded-2xl p-3 shadow-lg relative overflow-hidden"
              whileHover={{ borderColor: 'rgba(16,185,129,0.5)' }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-accent/70"></div>
              
              <div className="text-xs font-semibold text-accent mb-1 tracking-wider uppercase flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                Performance Stats
              </div>
              <p className="text-base text-foreground/85 leading-relaxed line-clamp-2 font-light">
                {player.stats}
              </p>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

// SVG Icons
const BatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3v14M12 3l-3 5M12 3l3 5" strokeLinecap="round" />
    <circle cx="12" cy="19" r="2" fill="currentColor" />
  </svg>
);

const BowlIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 12h20M6 8l6 8 4-10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AllRoundIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const KeeperIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3v3m0 12v3M4 12h3m10 0h3M7 7l5 5 5-5M7 17l5-5 5 5" strokeLinecap="round" />
  </svg>
);

const BallIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" opacity="0.9">
    <circle cx="12" cy="12" r="9" />
    <path
      d="M12 3a9 9 0 0 0-7 14.2 9.5 9.5 0 0 0 14 0A9 9 0 0 0 12 3z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export default AuctionCard;
