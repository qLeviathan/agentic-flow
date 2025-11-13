import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { listen } from '@tauri-apps/api/event';
import { TrendingUp, TrendingDown, Pause, Play } from 'lucide-react';

interface TickerData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

export function TickerDisplay() {
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Subscribe to real-time ticker updates via Tauri
    const unsubscribe = listen<TickerData[]>('ticker-update', (event) => {
      setTickers(event.payload);
    });

    return () => {
      unsubscribe.then(fn => fn());
    };
  }, []);

  // Auto-pause on hover
  useEffect(() => {
    if (isHovered && !isPaused) {
      setIsPaused(true);
    } else if (!isHovered && isPaused) {
      // Auto-resume after 2 seconds
      const timeout = setTimeout(() => setIsPaused(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [isHovered]);

  return (
    <div
      className="fixed top-20 left-0 right-0 h-16 glass-window overflow-hidden z-[9999]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Ticker scroll container */}
      <motion.div
        className="flex items-center gap-8 h-full px-4"
        animate={{ x: isPaused ? 0 : ['0%', '-50%'] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 60,
            ease: 'linear',
          },
        }}
      >
        {/* Duplicate tickers for seamless loop */}
        {[...tickers, ...tickers].map((ticker, index) => (
          <TickerItem key={`${ticker.symbol}-${index}`} ticker={ticker} />
        ))}
      </motion.div>

      {/* Pause/Play control */}
      <motion.button
        onClick={() => setIsPaused(!isPaused)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 glass-accent rounded-lg hover:scale-110 transition-transform"
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        title={isPaused ? 'Resume ticker' : 'Pause ticker'}
      >
        {isPaused ? (
          <Play className="w-4 h-4 text-glass-text" />
        ) : (
          <Pause className="w-4 h-4 text-glass-text" />
        )}
      </motion.button>
    </div>
  );
}

// Individual ticker item component
function TickerItem({ ticker }: { ticker: TickerData }) {
  const isPositive = ticker.change >= 0;

  return (
    <div className="flex items-center gap-3 whitespace-nowrap">
      {/* Symbol */}
      <span className="glass-text font-bold text-lg">{ticker.symbol}</span>

      {/* Price */}
      <span className="glass-text font-mono text-base">
        ${ticker.price.toFixed(2)}
      </span>

      {/* Change */}
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <TrendingDown className="w-4 h-4" />
        )}
        <span className="font-mono text-sm">
          {isPositive ? '+' : ''}{ticker.change.toFixed(2)} ({ticker.changePercent.toFixed(2)}%)
        </span>
      </div>

      {/* Volume indicator */}
      <span className="text-xs text-glass-text-muted font-mono">
        Vol: {formatVolume(ticker.volume)}
      </span>

      {/* Separator */}
      <div className="w-px h-8 bg-glass-border" />
    </div>
  );
}

// Format volume with K/M/B suffixes
function formatVolume(volume: number): string {
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(2)}B`;
  } else if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(2)}M`;
  } else if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(2)}K`;
  }
  return volume.toString();
}
