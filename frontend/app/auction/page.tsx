'use client';



import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

import axiosClient from '@/app/client/axiosClient';
import AuctionCard from '@/components/AuctionCard';
import SellDialog from '@/components/SellDialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

import {
  IndianRupee,
  Users,
  Home,
  CheckCircle,
  Search,
  Gavel,
  TrendingUp,
  Zap,
  Trophy,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus
} from 'lucide-react';

// ✅ Local type definitions matching your API responses

interface Team {
  teamId: number;
  name: string;
  totalPlayers: number;
  remainingPurse: number;
}

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



const INITIAL_PURSE = 100000;
const SALE_CELEBRATION_MS = 5000;
const SOLD_MUSIC_END_TRIM_SECONDS = 5;

const Auction = () => {

  const [teams, setTeams] = useState<Team[]>([]);

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

  const [loading, setLoading] = useState(true);

  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);



  const [searchTerm, setSearchTerm] = useState('');

  const [searchResults, setSearchResults] = useState<Player[]>([]);

  const [searching, setSearching] = useState(false);



  // ✅ Bidding price state

  const [currentBid, setCurrentBid] = useState(0);

  const [showBidPopup, setShowBidPopup] = useState(false);

  const [bidAnimation, setBidAnimation] = useState<'up' | 'down' | null>(null);
  const [isProcessingSale, setIsProcessingSale] = useState(false);



  const animationFrameRef = useRef<number | null>(null);

  const endTimeRef = useRef<number | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  const bidPopupTimeoutRef = useRef<NodeJS.Timeout | null>(null);



  const memefails = [
    'kaunHaiYeLog.mp3',
    'rajpalRona.mp3',
    'yeSabKyaDekhanaPadRhaHai.mp3',
    'khatamHoGayaMatter.mp3',
    'maiGaliNhiDeSkta.mp3',
    'wapisZaroorAaungaMai.mp3'
  ];
  const memepass = [
    'achhaThikHai.mp3',
    'thankslove.mp3',
    'kyaBaatHaiSir.mp3',
    'abhiMazaAayegaNaBhidu.mp3',
    'paisaHiPaisa.mp3'
  ];



  // ✅ Initialize current bid when player changes

  useEffect(() => {

    if (currentPlayer) {

      setCurrentBid(currentPlayer.basePrice);

    }

  }, [currentPlayer]);



  // ✅ Dynamic increment logic based on current bid

  const getIncrementAmount = (bid: number) => {

    if (bid < 10000) return 1000;

    if (bid < 30000) return 2000;

    return 3000;

  };


  const playPassMusic = (fileName: string) => {
    console.log("request coming in play pass...");
    
    if (audioRef.current) {
      const audioFilePath = `/${fileName}`; // Assumes files are in the public directory

      console.log(`🎵 Attempting to play pass audio: ${fileName}`);

      // Create a new Audio object to play the selected meme file
      const passAudio = new Audio(audioFilePath);

      // Play the audio
      passAudio.volume = 0.9;
      passAudio.play()
        .then(() => {
          console.log('✅ Pass audio playing successfully!');
        })
        .catch(error => {
          console.error('❌ Error playing pass audio:', error);
        });
    }
  };



  const incrementBid = () => {
    if (!currentPlayer) return;

    // Use a temporary variable for the new bid value
    let newBid = currentPlayer.basePrice;

    setCurrentBid(prev => {
      const increment = getIncrementAmount(prev);
      newBid = prev + increment; // ✅ Update the newBid variable

      // ✅ New: Check for Meme Pass Milestones
      switch (newBid) {
        case 5000: // Assuming this is 5 currency units, as requested
          playPassMusic(memepass[0]);
          break;
        case 6000:
          playPassMusic(memepass[1]);
          break;
        case 10000:
          playPassMusic(memepass[2]);
          break;
        case 16000:
          playPassMusic(memepass[3]);
          break;
        case 26000:
          playPassMusic(memepass[4]);
          break;
        default:
          break;
      }
      
      return newBid;
    });

    setBidAnimation('up');
    setShowBidPopup(true);

    // Clear existing timeout
    if (bidPopupTimeoutRef.current) {
      clearTimeout(bidPopupTimeoutRef.current);
    }

    // ✅ Hide popup after 3 seconds
    bidPopupTimeoutRef.current = setTimeout(() => {
      setShowBidPopup(false);
      setBidAnimation(null);
    }, 3000);
  };



  // ✅ FIXED: Decrement bid (Left Arrow) - 3 second auto-close

  const decrementBid = () => {

    if (!currentPlayer) return;
    setCurrentBid(prev => {
      const decrement = getIncrementAmount(prev - 1);
      const newBid = Math.max(currentPlayer.basePrice, prev - decrement);
      if (newBid === prev) {
        toast.info('Cannot go below base price');
        return prev;
      }
      return newBid;
    });
    setBidAnimation('down');
    setShowBidPopup(true);

    if (bidPopupTimeoutRef.current) {

      clearTimeout(bidPopupTimeoutRef.current);

    }

   

    // ✅ Hide popup after 2 seconds
    bidPopupTimeoutRef.current = setTimeout(() => {
      setShowBidPopup(false);
      setBidAnimation(null);
    }, 1500);

  };



  // ✅ FIXED: Keyboard event handler - removed currentBid from dependencies

  useEffect(() => {

    const handleKeyPress = (e: KeyboardEvent) => {

      // Prevent default only if we're handling the key

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        // Don't handle if user is typing in an input field
        if (document.activeElement?.tagName === 'INPUT') return;
        e.preventDefault();
        if (e.key === 'ArrowRight') {
          incrementBid();
        } else if (e.key === 'ArrowLeft') {
          decrementBid();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (bidPopupTimeoutRef.current) {
        clearTimeout(bidPopupTimeoutRef.current);
      }
    };
  }, [currentPlayer]); 



  useEffect(() => {

    return () => {

      if (animationFrameRef.current) {

        cancelAnimationFrame(animationFrameRef.current);

      }

      if (audioRef.current) {

        audioRef.current.pause();

      }

    };

  }, []);



  const startConfetti = (durationMs: number = SALE_CELEBRATION_MS) => {

    const rootStyles = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null;
    const colors = [
      rootStyles?.getPropertyValue('--primary').trim(),
      rootStyles?.getPropertyValue('--chart-3').trim(),
      rootStyles?.getPropertyValue('--chart-2').trim(),
      rootStyles?.getPropertyValue('--chart-4').trim(),
      rootStyles?.getPropertyValue('--chart-5').trim(),
    ].filter((value): value is string => Boolean(value));

    const safeDuration = Math.max(500, durationMs);
    const endTime = Date.now() + safeDuration;

   

    endTimeRef.current = endTime;



    const frame = () => {

      if (Date.now() >= endTime) {

        if (animationFrameRef.current) {

          cancelAnimationFrame(animationFrameRef.current);

          animationFrameRef.current = null;

        }

        return;

      }



      confetti({

        particleCount: 2,

        angle: 60,

        spread: 55,

        startVelocity: 60,

        origin: { x: 0, y: 0.5 },

        colors,

        zIndex: 10000,

      });



      confetti({

        particleCount: 2,

        angle: 120,

        spread: 55,

        startVelocity: 60,

        origin: { x: 1, y: 0.5 },

        colors,

        zIndex: 10000,

      });



      animationFrameRef.current = requestAnimationFrame(frame);

    };



    frame();

  };


  const getSoldMusicPlayableDurationMs = async () => {
    if (!audioRef.current) return SALE_CELEBRATION_MS;

    const audio = audioRef.current;

    const resolveDuration = () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        return SALE_CELEBRATION_MS;
      }
      return Math.max(0, Math.floor((audio.duration - SOLD_MUSIC_END_TRIM_SECONDS) * 1000));
    };

    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      return resolveDuration();
    }

    await new Promise<void>((resolve) => {
      const onDone = () => {
        audio.removeEventListener('loadedmetadata', onDone);
        audio.removeEventListener('error', onDone);
        resolve();
      };

      audio.addEventListener('loadedmetadata', onDone);
      audio.addEventListener('error', onDone);
      setTimeout(onDone, 1200);
    });

    return resolveDuration();
  };


  const playSoldMusicAndWait = async (playableDurationMs: number) => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    audio.currentTime = 0;
    audio.volume = 0.7;

    try {
      await audio.play();
    } catch (error) {
      console.error('❌ Error playing sold audio:', error);
      return;
    }

    if (playableDurationMs <= 0) return;

    await new Promise<void>((resolve) => {
      let finished = false;
      let timeoutId: NodeJS.Timeout | null = null;
      const stopAtSeconds = playableDurationMs / 1000;
      const cleanup = () => {
        audio.removeEventListener('ended', onFinish);
        audio.removeEventListener('error', onFinish);
        audio.removeEventListener('timeupdate', onTimeUpdate);
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };
      const onFinish = () => {
        if (finished) return;
        finished = true;
        cleanup();
        resolve();
      };
      const onTimeUpdate = () => {
        if (audio.currentTime >= stopAtSeconds) {
          audio.pause();
          onFinish();
        }
      };

      audio.addEventListener('ended', onFinish);
      audio.addEventListener('error', onFinish);
      audio.addEventListener('timeupdate', onTimeUpdate);

      timeoutId = setTimeout(onFinish, playableDurationMs + 500);
    });
  };



  useEffect(() => {

    const fetchData = async () => {

      try {

        const [teamsRes, playerRes] = await Promise.all([

          axiosClient.get<Team[]>('/api/auction/summary'),

          axiosClient.get<Player>('/api/auction/next-player'),

        ]);

        setTeams(teamsRes.data);

        setCurrentPlayer(playerRes.data);

      } catch (error) {

        toast.error('Failed to load auction data');

      } finally {

        setLoading(false);

      }

    };

    fetchData();

  }, []);



  const reloadCurrentPlayer = async () => {

    try {

      const res = await axiosClient.get<Player>('/api/auction/next-player');

      setCurrentPlayer(res.data);

    } catch {

      setCurrentPlayer(null);

    }

  };



  const reloadTeams = async () => {

    try {

      const res = await axiosClient.get<Team[]>('/api/auction/summary');

      setTeams(res.data);

    } catch {

      setTeams([]);

    }

  };

  const applySoldPlayerToTeams = (teamId: number, soldPrice: number, player: Player) => {
    setTeams((prevTeams) =>
      prevTeams.map((team) => {
        if (player.isSold && player.teamId && player.soldPrice) {
          // Player was already sold: handle edit price/team changes.
          if (player.teamId === teamId && team.teamId === teamId) {
            const priceDelta = soldPrice - player.soldPrice;
            return {
              ...team,
              remainingPurse: team.remainingPurse - priceDelta,
            };
          }

          if (team.teamId === player.teamId) {
            return {
              ...team,
              totalPlayers: Math.max(0, team.totalPlayers - 1),
              remainingPurse: team.remainingPurse + player.soldPrice,
            };
          }

          if (team.teamId === teamId) {
            return {
              ...team,
              totalPlayers: team.totalPlayers + 1,
              remainingPurse: team.remainingPurse - soldPrice,
            };
          }

          return team;
        }

        // Fresh sell: decrement purse and increment player count on target team only.
        if (team.teamId === teamId) {
          return {
            ...team,
            totalPlayers: team.totalPlayers + 1,
            remainingPurse: team.remainingPurse - soldPrice,
          };
        }

        return team;
      })
    );
  };



  // Inside the Auction component

const playUnsoldMusic = () => {

  if (audioRef.current) {

    const randomIndex = Math.floor(Math.random() * memefails.length);

    const randomMeme = memefails[randomIndex];

    const audioFilePath = `/${randomMeme}`; // Assumes files are in the public directory



    console.log(`🎵 Attempting to play unsold audio: ${randomMeme}`);

   

    // Create a new Audio object to play the randomly selected meme file

    const unsoldAudio = new Audio(audioFilePath);

     

      // Play the audio

      unsoldAudio.volume = 0.9; // Set volume similar to your sold music

      unsoldAudio.play()

        .then(() => {

          console.log('✅ Unsold audio playing successfully!');

        })

        .catch(error => {

          console.error('❌ Error playing unsold audio:', error);

        });

    }

  };

// ... existing functions (reloadCurrentPlayer, reloadTeams) ...



  const handleUnsold = async () => {

    if (!currentPlayer || isProcessingSale) return;

    try {

      await axiosClient.put(`/api/auction/players/${currentPlayer.id}/unsold`);

     

      // ✅ MODIFIED: Call the new function

      playUnsoldMusic();

     

      toast.success(`${currentPlayer.name} marked as unsold`);

      await reloadCurrentPlayer();

      await reloadTeams();

    } catch (error) {

      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to mark unsold';

      toast.error(message);

    }

  };


  const handleSell = async (teamId: string, soldPrice: number) => {

    if (!currentPlayer || isProcessingSale) return;

    try {

      setIsProcessingSale(true);
      const soldMusicDurationMs = await getSoldMusicPlayableDurationMs();
      startConfetti(soldMusicDurationMs);

      const soldMusicPromise = playSoldMusicAndWait(soldMusicDurationMs);

     

      // Use current bid instead of manually entered price

      const finalPrice = soldPrice || currentBid;

     

      await axiosClient.put('/api/auction/players/sell', {

        playerId: currentPlayer.id,

        teamId: parseInt(teamId, 10),

        soldPrice: finalPrice,

      });

       

      const teamName = teams.find((t) => t.teamId === parseInt(teamId))?.name || 'Unknown';

      toast.success(`🎉 ${currentPlayer.name} sold to ${teamName} for ₹${finalPrice.toLocaleString()}!`);

      await soldMusicPromise;

      applySoldPlayerToTeams(parseInt(teamId, 10), finalPrice, currentPlayer);
      await reloadCurrentPlayer();

    } catch (error) {

      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to sell player';

      toast.error(errorMessage);
    } finally {
      setIsProcessingSale(false);

    }

  };



  // ✅ Open sell dialog with current bid price

  const openSellDialog = () => {
    if (isProcessingSale) return;

    setIsSellDialogOpen(true);

  };



  const handleSearch = async () => {

    if (!searchTerm.trim()) {

      setSearchResults([]);

      return;

    }

    setSearching(true);

    try {

      const res = await axiosClient.get<Player[]>('/api/auction/search', {

        params: { q: searchTerm },

      });

      setSearchResults(res.data);

    } catch (error) {

      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Search failed';

      toast.error(errorMessage);

      setSearchResults([]);

    } finally {

      setSearching(false);

    }

  };



  const selectPlayer = (player: Player) => {

    setCurrentPlayer(player);

    setSearchResults([]);

    setSearchTerm('');

  };



  if (loading) {
    return (
      <div className="theme-page-bg min-h-screen relative overflow-hidden text-foreground">
        <div className="absolute inset-0 theme-grid-overlay pointer-events-none" />
        <div className="container mx-auto px-4 py-6 space-y-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-10 w-72 rounded-xl bg-secondary/80 border border-border" />
            <div className="h-12 w-36 rounded-xl bg-secondary/80 border border-border" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <div className="h-20 rounded-2xl theme-card-strong border border-border" />
              <div className="h-[480px] rounded-3xl theme-card-strong border border-border" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-16 rounded-xl bg-secondary/80 border border-border" />
                <div className="h-16 rounded-xl bg-secondary/80 border border-border" />
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="h-16 rounded-2xl theme-card-strong border border-border" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl theme-card border border-border" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }



  if (!currentPlayer) {

    return (

      <div className="theme-page-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden text-foreground">

        <div className="absolute inset-0 overflow-hidden pointer-events-none">

          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse"></div>

          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>

        </div>



        <motion.div

          initial={{ scale: 0.8, opacity: 0 }}

          animate={{ scale: 1, opacity: 1 }}

          transition={{ type: 'spring', stiffness: 200, damping: 20 }}

          className="max-w-lg w-full relative z-10"

        >

          <div className="relative">

            <div className="absolute -inset-2 bg-primary/20 rounded-3xl blur-xl opacity-50"></div>

           

            <Card className="theme-card-strong relative text-center p-12 rounded-3xl shadow-2xl">

              <motion.div

                animate={{ rotate: 360, scale: [1, 1.1, 1] }}

                transition={{ rotate: { duration: 3, repeat: Infinity, ease: 'linear' }, scale: { duration: 2, repeat: Infinity } }}

                className="inline-block mb-6"

              >

                <div className="p-6 bg-secondary/80 rounded-full border-4 border-border">

                  <Trophy className="h-20 w-20 text-accent" />

                </div>

              </motion.div>



              <h2 className="text-4xl font-black text-foreground mb-3">

                Auction Complete!

              </h2>

              <p className="theme-muted mb-8 text-lg">All players have been successfully auctioned.</p>

             

              <Link href="/">

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>

                  <div className="relative group">
                    <Button size="lg" className="relative w-full bg-primary hover:opacity-90 text-primary-foreground font-bold py-6 text-lg">

                      <Home className="h-5 w-5 mr-2" />

                      Back to Home

                    </Button>

                  </div>

                </motion.div>

              </Link>

            </Card>

          </div>

        </motion.div>

      </div>

    );

  }

  


  return (

    <div className="theme-page-bg min-h-screen text-foreground relative overflow-hidden">

      {/* ✅ AUDIO ELEMENT */}

      <audio ref={audioRef} preload="auto">

        <source src="/iplmusic.mp3" type="audio/mpeg" />

      </audio>



      {/* ✅ Bid Price Popup Overlay - 3 second auto-close */}

      <AnimatePresence>

        {showBidPopup && (

          <motion.div

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            exit={{ opacity: 0 }}

            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"

          >

            <motion.div

              initial={{ scale: 0.5, opacity: 0, y: bidAnimation === 'up' ? 50 : -50 }}

              animate={{ scale: 1, opacity: 1, y: 0 }}

              exit={{ scale: 0.8, opacity: 0 }}

              transition={{ type: 'spring', stiffness: 300, damping: 25 }}

              className="relative"

            >

              {/* Glow Effect */}

              <div className="absolute -inset-4 bg-primary/30 rounded-3xl blur-2xl opacity-75 animate-pulse"></div>

             

              {/* Popup Card */}

              <div className="theme-card-strong relative rounded-3xl p-10 shadow-2xl border-4 border-primary/50">

                <motion.div

                  animate={{

                    y: bidAnimation === 'up' ? [-10, 0] : [10, 0]

                  }}

                  transition={{ duration: 0.3 }}

                  className="text-center"

                >

                  {bidAnimation === 'up' ? (

                    <ArrowUp className="h-12 w-12 text-accent mx-auto mb-4 animate-bounce" />

                  ) : (

                    <ArrowDown className="h-12 w-12 text-destructive mx-auto mb-4 animate-bounce" />

                  )}

                 

                  <p className="text-sm theme-muted mb-2 font-medium">Current Bid</p>

                  <div className="flex items-center justify-center gap-2">

                    <IndianRupee className="h-8 w-8 text-primary" />

                    <motion.span

                      key={currentBid}

                      initial={{ scale: 1.5, opacity: 0 }}

                      animate={{ scale: 1, opacity: 1 }}

                      className="text-6xl font-black text-primary"

                    >

                      {currentBid.toLocaleString()}

                    </motion.span>

                  </div>

                 

                  <p className="text-xs theme-muted mt-4">

                    {bidAnimation === 'up' ? '+' : '-'}₹{getIncrementAmount(currentBid).toLocaleString()}

                  </p>

                </motion.div>

              </div>

            </motion.div>

          </motion.div>

        )}

      </AnimatePresence>



      {/* Enhanced Background Elements */}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">

        <div className="absolute top-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse"></div>

        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-chart-2/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      </div>



      {/* Grid Pattern */}

      <div className="absolute inset-0 theme-grid-overlay opacity-10 pointer-events-none"></div>



      <div className="container mx-auto px-4 py-8 md:py-10 relative z-10">

        {/* Enhanced Header */}

        <motion.div

          initial={{ opacity: 0, y: -20 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.6 }}

          className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8"

        >

          <div>

            {/* <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 bg-destructive/10 rounded-full border border-destructive/30 animate-pulse">

              <Zap className="h-3.5 w-3.5 text-destructive" />

              <span className="text-destructive text-xs font-bold tracking-wide uppercase">

                🔴 Live Now

              </span>

            </div> */}

            <div className='grid grid-cols-[10rem_1fr] w-full max-w-5xl'>



            {/* LEFT COLUMN: Yello Logo */}

            {/* Setting a fixed width (e.g., w-40 or 10rem) ensures the logo is compact */}

            <div className="flex items-center justify-center ">

                <img

                    src="https://ik.imagekit.io/s0kb1s3cx3/PWIOI/yello-Photoroom.png"

                    alt="yello_logo"

                    // Adjusted h-16 w-32 to fit better in the fixed 10rem column

                    className="h-36 w-36  object-contain"

                />

            </div>

            <div className="flex items-center text-6xl p-2 font-bold text-left">

                <span className="p-3 pt-5 text-foreground leading-none">

                    Premier League

                </span>

            </div>

        </div>
{/* 
            <p className="theme-muted mt-2 text-sm md:text-base flex items-center gap-2">

              <Gavel className="h-4 w-4 text-primary" />

              Bid in real-time • Build your ultimate XI

            </p> */}

          </div>

         

          <Link href="/">

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>

              <div className="relative group">
                <Button className="relative bg-primary hover:opacity-90 text-primary-foreground border-0 shadow-lg px-6 py-6 text-base font-bold">

                  <Home className="h-5 w-5 mr-2" />

                  Exit Auction

                </Button>

              </div>

            </motion.div>

          </Link>

        </motion.div>



        {/* Main Layout */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">



          {/* Left: Auction Arena */}

          <motion.div

            initial={{ opacity: 0, x: 30 }}

            animate={{ opacity: 1, x: 0 }}

            transition={{ duration: 0.6 }}

            className="lg:col-span-8 space-y-6"

          >

            {/* Search Bar */}

            <div className="relative">

              <div className="absolute -inset-1 bg-border/40 rounded-2xl blur-lg opacity-50"></div>

             

              <div className="theme-card-strong relative flex gap-3 rounded-2xl p-4">

                <div className="relative flex-grow group">

                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />

                  <Input

                    placeholder="Search players by name or role..."

                    value={searchTerm}

                    onChange={(e) => setSearchTerm(e.target.value)}

                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}

                    className="pl-12 pr-4 py-6 bg-input border border-border focus:border-ring text-foreground placeholder:text-muted-foreground rounded-xl text-base focus:ring-2 focus:ring-ring/30 transition-all duration-300"

                  />

                </div>

               

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>

                  <Button

                    onClick={handleSearch}

                    disabled={searching || !searchTerm.trim()}

                    className="bg-primary hover:opacity-90 text-primary-foreground px-8 py-6 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"

                  >

                    {searching ? (

                      <motion.div

                        animate={{ rotate: 360 }}

                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}

                      >

                        <Search className="h-5 w-5" />

                      </motion.div>

                    ) : (

                      'Search'

                    )}

                  </Button>

                </motion.div>

              </div>



              <AnimatePresence>

                {searchResults.length > 0 && (

                  <motion.div

                    initial={{ opacity: 0, y: -10, scale: 0.95 }}

                    animate={{ opacity: 1, y: 0, scale: 1 }}

                    exit={{ opacity: 0, y: -10, scale: 0.95 }}

                    transition={{ duration: 0.2 }}

                    className="absolute z-30 mt-2 w-full max-h-80 overflow-y-auto bg-card/95 backdrop-blur-xl border-2 border-border rounded-2xl shadow-2xl"

                  >

                    {searchResults.map((player, index) => (

                      <motion.div

                        key={player.id}

                        initial={{ opacity: 0, x: -10 }}

                        animate={{ opacity: 1, x: 0 }}

                        transition={{ delay: index * 0.03 }}

                        onClick={() => selectPlayer(player)}

                        className="p-4 cursor-pointer hover:bg-accent/20 border-b border-border last:border-b-0 flex justify-between items-center group transition-all duration-200"

                      >

                        <div>

                          <span className="font-semibold text-foreground group-hover:text-accent transition-colors">{player.name}</span>

                          <p className="text-xs theme-muted mt-0.5">{player.role}</p>

                        </div>

                        <div className="flex items-center gap-1 text-primary font-bold">

                          <IndianRupee className="h-4 w-4" />

                          <span>{player.basePrice.toLocaleString()}</span>

                        </div>

                      </motion.div>

                    ))}

                  </motion.div>

                )}

              </AnimatePresence>

            </div>



            {/* Auction Spotlight */}

            <motion.div

              animate={{ scale: [1, 1.01, 1] }}

              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}

              className="relative"

            >

              <div className="absolute -inset-2 bg-border/60 rounded-3xl blur-xl opacity-75 animate-pulse"></div>

              <div className="theme-card-strong relative rounded-3xl p-2 shadow-2xl">

                <AuctionCard player={currentPlayer} defaultPrice={currentBid}  />

              </div>

            </motion.div>



            {/* Action Buttons */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>

                <div className="relative group">

                  <Button

                    onClick={openSellDialog}
                    disabled={isProcessingSale}

                    size="lg"

                    className="relative w-full bg-primary hover:opacity-90 text-primary-foreground text-lg font-black py-7 shadow-xl border-0 disabled:opacity-50 disabled:cursor-not-allowed"

                  >

                    <CheckCircle className="h-6 w-6 mr-2" />

                    Sell at ₹{currentBid.toLocaleString()}

                  </Button>

                </div>

              </motion.div>



              <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>

                <div className="relative group">

                  <Button

                    onClick={handleUnsold}
                    disabled={isProcessingSale}

                    size="lg"

                    className="relative w-full bg-destructive hover:opacity-90 text-destructive-foreground text-lg font-black py-7 shadow-xl border-0 disabled:opacity-50 disabled:cursor-not-allowed"

                  >

                    ❌ Mark Unsold

                  </Button>

                </div>

              </motion.div>

            </div>

          </motion.div>



          {/* Right: Team Status Panel */}

          <motion.div

            initial={{ opacity: 0, x: -30 }}

            animate={{ opacity: 1, x: 0 }}

            transition={{ duration: 0.6 }}

            className="lg:col-span-4"

          >

            <div className="relative mb-6">
              <div className="theme-card-strong relative rounded-2xl p-4">

                <h2 className="text-xl font-black text-foreground flex items-center gap-3">

                  <div className="p-2 bg-chart-3/15 rounded-xl">

                    <Users className="h-5 w-5 text-chart-3" />

                  </div>

                  Team Status

                  <span className="ml-auto px-3 py-1 bg-chart-3/20 text-chart-3 rounded-full text-xs font-bold">

                    {teams.length} Teams

                  </span>

                </h2>

              </div>

            </div>



            <div className="space-y-3 pr-2">

  {teams.map((team, index) => (

    <motion.div

      key={team.teamId}

      initial={{ opacity: 0, x: -20 }}

      animate={{ opacity: 1, x: 0 }}

      transition={{ delay: index * 0.05 }}

      whileHover={{ scale: 1.02 }}

      className="cursor-pointer"

    >

      <Card className="theme-card backdrop-blur-xl border border-border hover:border-border rounded-xl p-4 transition-all duration-300 shadow-lg">

        <div className="flex items-center justify-between gap-4">

          {/* Team Name */}

          <div className="flex items-center gap-3 flex-1 min-w-0">

            <div className="p-2 bg-accent/15 rounded-lg flex-shrink-0">

              <Trophy className="h-4 w-4 text-accent" />

            </div>

            <div className="min-w-0">

              <h3 className="font-bold text-foreground text-sm truncate">{team.name}</h3>

            </div>

          </div>



          {/* Stats */}

          <div className="flex items-center gap-4 flex-shrink-0">

            {/* Players Count */}

            <div className="text-center">

              <p className="text-[10px] theme-muted uppercase">Players</p>

              <p className="text-base font-black text-accent">{team.totalPlayers}</p>

            </div>



            <div className="h-8 w-px bg-secondary/80"></div>



            {/* Remaining Purse */}

            <div className="text-right">

              <p className="text-[10px] theme-muted uppercase">Purse</p>

              <p className="text-base font-black text-primary flex items-center gap-0.5">

                <IndianRupee className="h-3 w-3" />

                {(team.remainingPurse / 1000).toFixed(0)}K

              </p>

            </div>

          </div>

        </div>

      </Card>

    </motion.div>

  ))}

</div>



          </motion.div>



        </div>

      </div>



      <SellDialog

        open={isSellDialogOpen}

        onOpenChange={setIsSellDialogOpen}

        teams={teams}

        currentPlayer={currentPlayer}

        onSell={handleSell}

        defaultPrice={currentBid}

      />

    </div>

  );

};



export default Auction;
