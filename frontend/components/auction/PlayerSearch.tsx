'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, IndianRupee, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axiosClient from '@/app/client/axiosClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { AuctionPlayer } from '@/app/types/type';

interface PlayerSearchProps {
  onSelect: (player: AuctionPlayer) => void;
  disabled: boolean;
}

const LISTBOX_ID = 'auction-player-search-results';

const PlayerSearch = ({ onSelect, disabled }: PlayerSearchProps) => {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<AuctionPlayer[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const isOpen = hasSearched && !searching;

  const close = () => {
    setResults([]);
    setHasSearched(false);
    setActiveIndex(-1);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  const runSearch = async () => {
    const query = term.trim();
    if (!query) return;

    setSearching(true);
    setActiveIndex(-1);
    try {
      const res = await axiosClient.get<AuctionPlayer[]>('/api/auction/search', {
        params: { q: query },
      });
      setResults(res.data);
      setHasSearched(true);
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Search failed';
      toast.error(message);
      setResults([]);
      setHasSearched(false);
    } finally {
      setSearching(false);
    }
  };

  const select = (player: AuctionPlayer) => {
    onSelect(player);
    setTerm('');
    close();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (isOpen && activeIndex >= 0 && results[activeIndex]) {
        select(results[activeIndex]);
      } else {
        void runSearch();
      }
      return;
    }

    if (event.key === 'Escape') {
      close();
      return;
    }

    if (!isOpen || results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="theme-card-strong flex gap-3 rounded-2xl p-3">
        <div className="group relative flex-grow">
          <Search
            aria-hidden
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
          />
          <Input
            role="combobox"
            aria-expanded={isOpen && results.length > 0}
            aria-controls={LISTBOX_ID}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `${LISTBOX_ID}-option-${activeIndex}` : undefined
            }
            aria-label="Search players by name"
            placeholder="Search a player by name to bring them up out of order..."
            value={term}
            disabled={disabled}
            onChange={(event) => {
              setTerm(event.target.value);
              if (hasSearched) close();
            }}
            onKeyDown={handleKeyDown}
            className="h-14 rounded-xl border border-border bg-input pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <Button
          type="button"
          onClick={() => void runSearch()}
          disabled={searching || disabled || !term.trim()}
          className="h-14 rounded-xl bg-primary px-7 text-base font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {searching ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : 'Search'}
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border-2 border-border bg-popover shadow-2xl backdrop-blur-xl"
          >
            {results.length === 0 ? (
              <p className="p-5 text-center text-sm text-muted-foreground">
                No players match “{term.trim()}”.
              </p>
            ) : (
              <ul id={LISTBOX_ID} role="listbox" aria-label="Player search results">
                {results.map((player, index) => (
                  <li
                    key={player.id}
                    id={`${LISTBOX_ID}-option-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    tabIndex={-1}
                    onClick={() => select(player)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex cursor-pointer items-center justify-between gap-4 border-b border-border p-4 transition-colors last:border-b-0 ${
                      index === activeIndex ? 'bg-accent/20' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{player.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {player.role}
                        {player.isSold && ' · Sold'}
                        {player.isUnsold && ' · Unsold'}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 font-bold tabular-nums text-primary">
                      <IndianRupee className="h-4 w-4" aria-hidden />
                      {player.basePrice.toLocaleString('en-IN')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlayerSearch;
