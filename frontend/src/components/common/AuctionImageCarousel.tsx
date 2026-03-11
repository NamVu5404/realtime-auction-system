import { useState, useCallback, useRef, useEffect } from "react";
import { Image, Spin } from "antd";
import { FileResponse } from "../../api/types";
import { getImageUrl, DEFAULT_AUCTION_IMAGE } from "../../utils/imageUtils";

interface AuctionImageCarouselProps {
  images?: FileResponse[] | null;
  /** Compact mode for Drawer — reduces carousel height */
  compact?: boolean;
}

/**
 * AuctionImageCarousel
 *
 * Optimized product-image carousel component.
 * - Uses CSS translateX for 100% smooth transitions.
 * - Integrates Ant Design Image.PreviewGroup for full-screen view.
 * - Uses Ant Design Image placeholder for sync loading.
 * - Swipe left/right + dot indicator.
 * - Responsive & Performance optimized.
 */
export const AuctionImageCarousel = ({
  images,
  compact = false,
}: AuctionImageCarouselProps) => {
  const hasImages = images != null && images.length > 0;

  // Stable URL list derived from the images prop
  const urls: string[] = hasImages
    ? images.map((img) => getImageUrl(img))
    : [DEFAULT_AUCTION_IMAGE];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Reset when images change (e.g., new auction opened)
  useEffect(() => {
    setCurrentIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  const showDots = hasImages && urls.length > 1;
  const aspectClass = compact ? "" : "aspect-[4/3]";
  const heightClass = compact ? "h-[320px] sm:h-[400px]" : "max-h-[500px]";

  // Transitions
  const goPrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (isAnimating || urls.length <= 1) return;
      setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length);
    },
    [isAnimating, urls.length],
  );

  const goNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (isAnimating || urls.length <= 1) return;
      setCurrentIndex((prev) => (prev + 1) % urls.length);
    },
    [isAnimating, urls.length],
  );

  const goTo = (index: number) => {
    if (isAnimating) return;
    setCurrentIndex(index);
  };

  // Touch / Swipe logic
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > 50) {
      if (touchDeltaX.current > 0) goPrev();
      else goNext();
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  return (
    <div className="w-full max-w-5xl mx-auto select-none group/carousel font-sans">
      {/* Carousel Viewport */}
      <div
        className={`relative w-full ${aspectClass} ${heightClass} overflow-hidden rounded-2xl bg-zinc-950`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Image.PreviewGroup>
          <div
            className="flex h-full w-full transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            onTransitionEnd={() => setIsAnimating(false)}
            onTransitionStart={() => setIsAnimating(true)}
          >
            {urls.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="w-full h-full flex-shrink-0 relative overflow-hidden flex items-center justify-center p-1"
              >
                <div className="w-full h-full relative flex items-center justify-center">
                  <Image
                    src={url}
                    alt={`Auction item ${index + 1}`}
                    className="max-w-full max-h-full w-auto h-auto rounded-xl shadow-2xl transition-all duration-300"
                    style={{ objectFit: "contain" }}
                    placeholder={
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 rounded-xl">
                        <Spin size="large" />
                      </div>
                    }
                    fallback={DEFAULT_AUCTION_IMAGE}
                    preview={{
                      cover: (
                        <div className="flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-2xl text-white">🔍</span>
                          <span className="text-white text-xs font-semibold tracking-wider uppercase">
                            Preview
                          </span>
                        </div>
                      ),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Image.PreviewGroup>

        {/* Navigation Arrows */}
        {showDots && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white transition-all opacity-0 group-hover/carousel:opacity-100 border border-white/10"
              aria-label="Previous"
            >
              <span className="text-xl">‹</span>
            </button>
            <button
              onClick={goNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white transition-all opacity-0 group-hover/carousel:opacity-100 border border-white/10"
              aria-label="Next"
            >
              <span className="text-xl">›</span>
            </button>

            {/* Counter */}
            <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/10 shadow-lg">
              {currentIndex + 1} / {urls.length}
            </div>
          </>
        )}
      </div>

      {/* Dot Indicators */}
      {showDots && (
        <div className="flex justify-center items-center gap-2 mt-4">
          {urls.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? "w-8 h-2 bg-yellow-400"
                  : "w-2 h-2 bg-zinc-700 hover:bg-zinc-500"
              }`}
              aria-label={`Go to ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AuctionImageCarousel;
