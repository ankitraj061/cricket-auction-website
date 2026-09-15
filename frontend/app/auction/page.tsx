'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import type { AxiosError } from 'axios';
import {
  Home,
  Trophy,
  Volume2,
  VolumeX,
  AlertTriangle,
  RotateCw,
  Loader2,
} from 'lucide-react';

import axiosClient from '@/app/client/axiosClient';
import { useAuth } from '@/app/contexts/AuthContext';
import type { AuctionPlayer, AuctionSettings, TeamSummary } from '@/app/types/type';

import AuctionCard from '@/components/AuctionCard';
import SellDialog from '@/components/SellDialog';
import BidTicker from '@/components/auction/BidTicker';
import BidControls from '@/components/auction/BidControls';
import TeamStatusPanel from '@/components/auction/TeamStatusPanel';
import AuctionProgress, { type AuctionStats } from '@/components/auction/AuctionProgress';
import ActivityFeed, { type AuctionEvent } from '@/components/auction/ActivityFeed';
import SaleResultBanner, { type SaleResult } from '@/components/auction/SaleResultBanner';
import ConfirmUnsoldDialog from '@/components/auction/ConfirmUnsoldDialog';
import PlayerSearch from '@/components/auction/PlayerSearch';
import { Button } from '@/components/ui/button';
import UniversalLoader from '@/components/ui/universal-loader';

const LOGO_URL = 'https://ik.imagekit.io/s0kb1s3cx3/PWIOI/yello-Photoroom.png';
const CELEBRATION_FALLBACK_MS = 5000;
const SOLD_MUSIC_END_TRIM_SECONDS = 5;
const DEFAULT_MAX_PLAYERS_PER_TEAM = 11;

const UNSOLD_MEMES = [
  'kaunHaiYeLog.mp3',
  'rajpalRona.mp3',
  'yeSabKyaDekhanaPadRhaHai.mp3',
  'khatamHoGayaMatter.mp3',
  'maiGaliNhiDeSkta.mp3',
  'wapisZaroorAaungaMai.mp3',
];

const BID_MILESTONES = [
  { at: 5000, file: 'achhaThikHai.mp3' },
  { at: 6000, file: 'thankslove.mp3' },
  { at: 10000, file: 'kyaBaatHaiSir.mp3' },
  { at: 16000, file: 'abhiMazaAayegaNaBhidu.mp3' },
  { at: 26000, file: 'paisaHiPaisa.mp3' },
];

const getIncrement = (bid: number) => {
  if (bid < 10000) return 1000;
  if (bid < 30000) return 2000;
  return 3000;
};

const readApiError = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { error?: string } } })?.response?.data?.error || fallback;

const emptyStats: AuctionStats = { total: 0, sold: 0, unsold: 0, remaining: 0 };

const Auction = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const reduceMotion = useReducedMotion();

  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<AuctionPlayer | null>(null);
  const [stats, setStats] = useState<AuctionStats>(emptyStats);
  const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState(DEFAULT_MAX_PLAYERS_PER_TEAM);
  const [round, setRound] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [auctionComplete, setAuctionComplete] = useState(false);

  const [currentBid, setCurrentBid] = useState(0);
  const [bidDirection, setBidDirection] = useState<'up' | 'down' | null>(null);

  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [sellError, setSellError] = useState<string | null>(null);
  const [saleResult, setSaleResult] = useState<SaleResult | null>(null);
  const [sellSession, setSellSession] = useState(0);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const [showUnsoldConfirm, setShowUnsoldConfirm] = useState(false);
  const [isMarkingUnsold, setIsMarkingUnsold] = useState(false);

  const [events, setEvents] = useState<AuctionEvent[]>([]);
  const [muted, setMuted] = useState(false);

  const soldAudioRef = useRef<HTMLAudioElement>(null);
  const memeAudioRef = useRef<HTMLAudioElement | null>(null);
  const confettiFrameRef = useRef<number | null>(null);
  const bidRef = useRef(0);
  const mutedRef = useRef(false);
  const directionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevUnsoldRef = useRef<number | null>(null);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  /* ---------------------------------------------------------------- audio */

  const stopAllAudio = useCallback(() => {
    soldAudioRef.current?.pause();
    memeAudioRef.current?.pause();
    memeAudioRef.current = null;
  }, []);

  const playClip = useCallback((fileName: string) => {
    if (mutedRef.current) return;
    const audio = new Audio(`/${fileName}`);
    audio.volume = 0.9;
    memeAudioRef.current = audio;
    void audio.play().catch(() => undefined);
  }, []);

  const playMilestone = useCallback(
    (from: number, to: number) => {
      const crossed = BID_MILESTONES.filter((m) => from < m.at && to >= m.at).pop();
      if (crossed) playClip(crossed.file);
    },
    [playClip],
  );

  const stopConfetti = useCallback(() => {
    if (confettiFrameRef.current) {
      cancelAnimationFrame(confettiFrameRef.current);
      confettiFrameRef.current = null;
    }
  }, []);

  const startConfetti = useCallback(
    (durationMs: number) => {
      if (reduceMotion) return;

      const rootStyles = getComputedStyle(document.documentElement);
      const colors = ['--primary', '--chart-3', '--chart-2', '--chart-4', '--chart-5']
        .map((token) => rootStyles.getPropertyValue(token).trim())
        .filter(Boolean);

      const endTime = Date.now() + Math.max(500, durationMs);
      stopConfetti();

      const frame = () => {
        if (Date.now() >= endTime) {
          stopConfetti();
          return;
        }
        confetti({ particleCount: 2, angle: 60, spread: 55, startVelocity: 60, origin: { x: 0, y: 0.5 }, colors, zIndex: 10000 });
        confetti({ particleCount: 2, angle: 120, spread: 55, startVelocity: 60, origin: { x: 1, y: 0.5 }, colors, zIndex: 10000 });
        confettiFrameRef.current = requestAnimationFrame(frame);
      };

      frame();
    },
    [reduceMotion, stopConfetti],
  );

  const playSoldMusic = useCallback(() => {
    const audio = soldAudioRef.current;
    if (!audio || mutedRef.current) return CELEBRATION_FALLBACK_MS;

    audio.currentTime = 0;
    audio.volume = 0.7;
    void audio.play().catch(() => undefined);

    const playable =
      Number.isFinite(audio.duration) && audio.duration > 0
        ? Math.max(0, (audio.duration - SOLD_MUSIC_END_TRIM_SECONDS) * 1000)
        : CELEBRATION_FALLBACK_MS;

    // The track is trimmed short so it never outlasts the celebration.
    window.setTimeout(() => audio.pause(), playable);
    return playable;
  }, []);

  useEffect(
    () => () => {
      stopConfetti();
      stopAllAudio();
      if (directionTimeoutRef.current) clearTimeout(directionTimeoutRef.current);
    },
    [stopAllAudio, stopConfetti],
  );

  /* ----------------------------------------------------------------- data */

  const applyStats = useCallback((players: AuctionPlayer[]) => {
    const sold = players.filter((p) => p.isSold).length;
    const unsold = players.filter((p) => p.isUnsold).length;
    const next: AuctionStats = {
      total: players.length,
      sold,
      unsold,
      remaining: players.length - sold - unsold,
    };

    // The backend silently starts a new round by clearing every unsold flag at once.
    if (prevUnsoldRef.current !== null && prevUnsoldRef.current > 0 && unsold === 0 && next.remaining > 0) {
      setRound((r) => r + 1);
    }
    prevUnsoldRef.current = unsold;
    setStats(next);
  }, []);

  const reloadTeams = useCallback(async () => {
    try {
      const res = await axiosClient.get<TeamSummary[]>('/api/auction/summary');
      setTeams(res.data);
    } catch {
      toast.error('Could not refresh team purses');
    }
  }, []);

  const reloadStats = useCallback(async () => {
    try {
      const res = await axiosClient.get<{ players: AuctionPlayer[] }>('/api/auction/players');
      applyStats(res.data.players);
    } catch {
      /* progress is supplementary — a failure here must not disrupt the auction */
    }
  }, [applyStats]);

  const loadNextPlayer = useCallback(async () => {
    try {
      const res = await axiosClient.get<AuctionPlayer>('/api/auction/next-player');
      setCurrentPlayer(res.data);
      setAuctionComplete(false);
      setLoadError(null);
    } catch (error) {
      setCurrentPlayer(null);
      if ((error as AxiosError).response?.status === 404) {
        setAuctionComplete(true);
        setLoadError(null);
      } else {
        setAuctionComplete(false);
        setLoadError(readApiError(error, 'Could not load the next player.'));
      }
    }
  }, []);

  const loadEverything = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [teamsRes, settingsRes] = await Promise.all([
        axiosClient.get<TeamSummary[]>('/api/auction/summary'),
        axiosClient.get<AuctionSettings>('/api/auction/settings'),
      ]);
      setTeams(teamsRes.data);
      setMaxPlayersPerTeam(settingsRes.data.maxPlayersPerTeam ?? DEFAULT_MAX_PLAYERS_PER_TEAM);
      await Promise.all([loadNextPlayer(), reloadStats()]);
    } catch (error) {
      setLoadError(readApiError(error, 'Could not load auction data.'));
    } finally {
      setLoading(false);
    }
  }, [loadNextPlayer, reloadStats]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/auth/admin/login');
      return;
    }
    void loadEverything();
  }, [authLoading, isAuthenticated, loadEverything, router]);

  /* ----------------------------------------------------------------- bids */

  const setBid = useCallback((value: number) => {
    bidRef.current = value;
    setCurrentBid(value);
  }, []);

  useEffect(() => {
    if (currentPlayer) setBid(currentPlayer.basePrice);
  }, [currentPlayer, setBid]);

  const flashDirection = useCallback((direction: 'up' | 'down') => {
    setBidDirection(direction);
    if (directionTimeoutRef.current) clearTimeout(directionTimeoutRef.current);
    directionTimeoutRef.current = setTimeout(() => setBidDirection(null), 1200);
  }, []);

  const canBid = Boolean(currentPlayer) && !saleResult && !isSelling && !isMarkingUnsold;

  const increaseBid = useCallback(() => {
    if (!canBid) return;
    const from = bidRef.current;
    const to = from + getIncrement(from);
    setBid(to);
    playMilestone(from, to);
    flashDirection('up');
  }, [canBid, flashDirection, playMilestone, setBid]);

  const decreaseBid = useCallback(() => {
    if (!canBid || !currentPlayer) return;
    const from = bidRef.current;
    const to = Math.max(currentPlayer.basePrice, from - getIncrement(from - 1));
    if (to === from) {
      toast.info('Cannot go below base price');
      return;
    }
    setBid(to);
    flashDirection('down');
  }, [canBid, currentPlayer, flashDirection, setBid]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
      event.preventDefault();
      if (event.key === 'ArrowRight') increaseBid();
      else decreaseBid();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [increaseBid, decreaseBid]);

  /* ------------------------------------------------------------- handlers */

  const handleSell = async (teamId: string, soldPrice: number) => {
    if (!currentPlayer || isSelling) return;

    setIsSelling(true);
    setSellError(null);

    try {
      await axiosClient.put('/api/auction/players/sell', {
        playerId: currentPlayer.id,
        teamId: parseInt(teamId, 10),
        soldPrice,
      });

      const teamName = teams.find((t) => t.teamId === parseInt(teamId, 10))?.name ?? 'Unknown team';

      setIsSellDialogOpen(false);
      setSaleResult({
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        teamName,
        price: soldPrice,
      });
      setEvents((prev) =>
        [
          {
            id: `${currentPlayer.id}-${Date.now()}`,
            type: 'sold' as const,
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
            teamName,
            price: soldPrice,
          },
          ...prev,
        ].slice(0, 8),
      );

      startConfetti(playSoldMusic());
      toast.success(`${currentPlayer.name} sold to ${teamName} for ₹${soldPrice.toLocaleString('en-IN')}`);

      await Promise.all([reloadTeams(), reloadStats()]);
    } catch (error) {
      setSellError(readApiError(error, 'Failed to sell player'));
    } finally {
      setIsSelling(false);
    }
  };

  const handleUnsold = async () => {
    if (!currentPlayer || isMarkingUnsold) return;

    setIsMarkingUnsold(true);
    try {
      await axiosClient.put(`/api/auction/players/${currentPlayer.id}/unsold`);

      if (!mutedRef.current) {
        playClip(UNSOLD_MEMES[Math.floor(Math.random() * UNSOLD_MEMES.length)]);
      }
      setEvents((prev) =>
        [
          {
            id: `${currentPlayer.id}-${Date.now()}`,
            type: 'unsold' as const,
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
          },
          ...prev,
        ].slice(0, 8),
      );
      toast.success(`${currentPlayer.name} marked as unsold`);

      setShowUnsoldConfirm(false);
      await Promise.all([loadNextPlayer(), reloadTeams(), reloadStats()]);
    } catch (error) {
      toast.error(readApiError(error, 'Failed to mark unsold'));
    } finally {
      setIsMarkingUnsold(false);
    }
  };

  const handleNextPlayer = async () => {
    setIsAdvancing(true);
    stopConfetti();
    stopAllAudio();
    try {
      await loadNextPlayer();
      setSaleResult(null);
    } finally {
      setIsAdvancing(false);
    }
  };

  // Bumping the session remounts SellDialog so it always opens with fresh selections.
  const openSellDialog = () => {
    setSellError(null);
    setSellSession((session) => session + 1);
    setIsSellDialogOpen(true);
  };

  const handleCorrectSale = () => {
    stopConfetti();
    stopAllAudio();
    if (saleResult) setBid(saleResult.price);
    setSaleResult(null);
    openSellDialog();
  };

  const handleCorrectLastSale = () => {
    const lastSale = events.find((event) => event.type === 'sold');
    if (!lastSale) return;

    if (currentPlayer?.id !== lastSale.playerId) {
      toast.info('Search for the player to change their team or price.');
      return;
    }
    handleCorrectSale();
  };

  const handleSelectPlayer = (player: AuctionPlayer) => {
    stopConfetti();
    stopAllAudio();
    setSaleResult(null);
    setCurrentPlayer(player);
  };

  /* -------------------------------------------------------------- render */

  if (authLoading || (loading && !loadError)) {
    return <UniversalLoader fullScreen message="Loading auction" subtitle="Preparing the bidding floor" />;
  }

  if (!isAuthenticated) {
    return <UniversalLoader fullScreen message="Redirecting to login" />;
  }

  const shell = (children: React.ReactNode) => (
    <div className="theme-page-bg relative min-h-screen text-foreground">
      <div className="theme-grid-overlay pointer-events-none absolute inset-0" />
      <div className="container relative z-10 mx-auto flex min-h-screen items-center justify-center px-4 py-10">
        {children}
      </div>
    </div>
  );

  if (loadError) {
    return shell(
      <div className="theme-card-strong stadium-glow max-w-lg rounded-3xl p-10 text-center">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15">
          <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden />
        </span>
        <h1 className="text-3xl text-foreground">Couldn&apos;t reach the auction</h1>
        <p className="mt-3 text-muted-foreground">{loadError}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          The auction has not ended — this is a connection problem.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            onClick={() => void loadEverything()}
            className="h-12 rounded-xl bg-primary px-8 font-bold text-primary-foreground hover:opacity-90"
          >
            <RotateCw className="mr-2 h-4 w-4" aria-hidden />
            Retry
          </Button>
          <Link href="/">
            <Button
              variant="outline"
              className="h-12 w-full rounded-xl border border-border bg-secondary px-8 font-semibold text-foreground"
            >
              <Home className="mr-2 h-4 w-4" aria-hidden />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>,
    );
  }

  if (auctionComplete || !currentPlayer) {
    return shell(
      <div className="theme-card-strong stadium-glow max-w-lg rounded-3xl p-10 text-center">
        <motion.span
          animate={reduceMotion ? undefined : { rotate: [0, -8, 8, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15"
        >
          <Trophy className="h-10 w-10 text-primary" aria-hidden />
        </motion.span>
        <h1 className="text-4xl text-foreground">Auction Complete!</h1>
        <p className="mt-3 text-muted-foreground">
          Every player has been through the auction. {stats.sold} sold, {stats.unsold} unsold.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/teams">
            <Button className="h-12 w-full rounded-xl bg-primary px-8 font-bold text-primary-foreground hover:opacity-90">
              <Trophy className="mr-2 h-4 w-4" aria-hidden />
              View Squads
            </Button>
          </Link>
          <Link href="/">
            <Button
              variant="outline"
              className="h-12 w-full rounded-xl border border-border bg-secondary px-8 font-semibold text-foreground"
            >
              <Home className="mr-2 h-4 w-4" aria-hidden />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>,
    );
  }

  const isBusy = isSelling || isMarkingUnsold || isAdvancing;

  return (
    <div className="theme-page-bg relative min-h-screen text-foreground">
      <audio ref={soldAudioRef} preload="auto">
        <source src="/iplmusic.mp3" type="audio/mpeg" />
      </audio>

      <div className="theme-grid-overlay pointer-events-none absolute inset-0 opacity-60" />

      <div className="container relative z-10 mx-auto px-4 py-6 lg:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-5">
            <Image
              src={LOGO_URL}
              alt="Yello"
              width={96}
              height={96}
              priority
              className="h-14 w-14 object-contain sm:h-20 sm:w-20"
            />
            <h1 className="text-3xl leading-none text-foreground sm:text-5xl lg:text-6xl">
              Premier League
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              onClick={() => {
                if (!muted) stopAllAudio();
                setMuted((prev) => !prev);
              }}
              aria-pressed={muted}
              aria-label={muted ? 'Unmute auction sounds' : 'Mute auction sounds'}
              className="rounded-xl border border-border bg-secondary text-foreground hover:opacity-90"
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>

            <Link href="/">
              <Button className="h-12 rounded-xl bg-primary px-5 font-bold text-primary-foreground hover:opacity-90">
                <Home className="mr-2 h-5 w-5" aria-hidden />
                Exit
              </Button>
            </Link>
          </div>
        </header>

        <div className="mb-6">
          <AuctionProgress stats={stats} round={round} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <main className="space-y-6 lg:col-span-8">
            <PlayerSearch onSelect={handleSelectPlayer} disabled={isBusy} />

            <AuctionCard player={currentPlayer} eyebrow={saleResult ? 'Sold For' : 'Now Bidding'} />

            {saleResult ? (
              <SaleResultBanner
                result={saleResult}
                isAdvancing={isAdvancing}
                onNextPlayer={() => void handleNextPlayer()}
                onCorrect={handleCorrectSale}
              />
            ) : (
              <>
                <BidTicker
                  currentBid={currentBid}
                  basePrice={currentPlayer.basePrice}
                  nextIncrement={getIncrement(currentBid)}
                  direction={bidDirection}
                />
                <BidControls
                  currentBid={currentBid}
                  increment={getIncrement(currentBid)}
                  canDecrease={currentBid > currentPlayer.basePrice}
                  isBusy={isBusy}
                  onIncrease={increaseBid}
                  onDecrease={decreaseBid}
                  onSell={openSellDialog}
                  onUnsold={() => setShowUnsoldConfirm(true)}
                />
              </>
            )}
          </main>

          <aside className="lg:col-span-4 lg:sticky lg:top-6 lg:self-start">
            <TeamStatusPanel
              teams={teams}
              currentBid={currentBid}
              maxPlayersPerTeam={maxPlayersPerTeam}
            />
            <ActivityFeed
              events={events}
              canCorrectLastSale={events.some((event) => event.type === 'sold')}
              onCorrectLastSale={handleCorrectLastSale}
            />
          </aside>
        </div>
      </div>

      <SellDialog
        key={sellSession}
        open={isSellDialogOpen}
        onOpenChange={(open) => {
          if (!isSelling) {
            setIsSellDialogOpen(open);
            if (!open) setSellError(null);
          }
        }}
        teams={teams}
        currentPlayer={currentPlayer}
        onSell={handleSell}
        defaultPrice={currentBid}
        isPending={isSelling}
        serverError={sellError}
        maxPlayersPerTeam={maxPlayersPerTeam}
      />

      <ConfirmUnsoldDialog
        open={showUnsoldConfirm}
        onOpenChange={setShowUnsoldConfirm}
        playerName={currentPlayer.name}
        isPending={isMarkingUnsold}
        onConfirm={() => void handleUnsold()}
      />

      {isAdvancing && (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm text-muted-foreground shadow-xl">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading next player…
        </div>
      )}
    </div>
  );
};

export default Auction;
