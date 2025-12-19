import { useState, useRef, TouchEvent } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, X, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

const VISIBLE_THUMBNAILS = 4;
const MOBILE_VISIBLE_THUMBNAILS = 4;
const THUMBNAIL_HEIGHT = 88; // Fixed height for each thumbnail in px
const THUMBNAIL_GAP = 8; // Gap between thumbnails in px
const ARROW_HEIGHT = 28; // Fixed height for arrows in px
const ARROW_MARGIN = 6; // Margin for arrows in px

// Calculate total height: 4 thumbnails + 3 gaps = main image height
// Main image is square, so we need thumbnails to match that height
const THUMBNAILS_CONTAINER_HEIGHT = (THUMBNAIL_HEIGHT * VISIBLE_THUMBNAILS) + (THUMBNAIL_GAP * (VISIBLE_THUMBNAILS - 1));

export const ImageGallery = ({ images, productName }: ImageGalleryProps) => {
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [thumbnailStart, setThumbnailStart] = useState(0);
  
  // Touch swipe support
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const goToPrevious = () => {
    setActiveImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isSwipe = Math.abs(distance) > minSwipeDistance;
    
    if (isSwipe) {
      if (distance > 0) {
        // Swipe left - go to next
        goToNext();
      } else {
        // Swipe right - go to previous
        goToPrevious();
      }
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const canScrollThumbnailsUp = thumbnailStart > 0;
  const canScrollThumbnailsDown = thumbnailStart + VISIBLE_THUMBNAILS < images.length;

  const scrollThumbnailsUp = () => {
    setThumbnailStart((prev) => Math.max(0, prev - 1));
  };

  const scrollThumbnailsDown = () => {
    setThumbnailStart((prev) => Math.min(images.length - VISIBLE_THUMBNAILS, prev + 1));
  };

  const visibleThumbnails = images.slice(thumbnailStart, thumbnailStart + VISIBLE_THUMBNAILS);
  const showThumbnailNavigation = images.length > VISIBLE_THUMBNAILS;

  // Total height for thumbnail column (same as main image which is square)
  const totalColumnHeight = showThumbnailNavigation 
    ? THUMBNAILS_CONTAINER_HEIGHT + (ARROW_HEIGHT + ARROW_MARGIN) * 2
    : THUMBNAILS_CONTAINER_HEIGHT;

  return (
    <>
      <div className="flex gap-4 opacity-0 animate-fade-up">
        {/* Thumbnails - Left Side */}
        {images.length > 1 && (
          <div 
            className="hidden md:flex flex-col w-24 shrink-0"
            style={{ height: `${totalColumnHeight}px` }}
          >
            {/* Up Arrow - Fixed height */}
            {showThumbnailNavigation && (
              <Button
                variant="ghost"
                size="sm"
                className={`w-full shrink-0 ${!canScrollThumbnailsUp ? 'opacity-30 cursor-not-allowed' : ''}`}
                style={{ height: `${ARROW_HEIGHT}px`, marginBottom: `${ARROW_MARGIN}px` }}
                onClick={scrollThumbnailsUp}
                disabled={!canScrollThumbnailsUp}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            )}
            
            {/* Thumbnails Grid - Fixed height container */}
            <div 
              className="flex flex-col"
              style={{ 
                height: `${THUMBNAILS_CONTAINER_HEIGHT}px`,
                gap: `${THUMBNAIL_GAP}px`
              }}
            >
              {visibleThumbnails.map((img, index) => {
                const actualIndex = thumbnailStart + index;
                return (
                  <button
                    key={actualIndex}
                    onClick={() => setActiveImage(actualIndex)}
                    style={{ height: `${THUMBNAIL_HEIGHT}px` }}
                    className={`relative overflow-hidden shrink-0 rounded-xl border-2 transition-all duration-200 bg-muted/30 ${
                      activeImage === actualIndex 
                        ? 'border-primary shadow-md' 
                        : 'border-border hover:border-primary/50 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt="" 
                      className="w-full h-full object-contain p-2" 
                    />
                  </button>
                );
              })}
            </div>

            {/* Down Arrow - Fixed height */}
            {showThumbnailNavigation && (
              <Button
                variant="ghost"
                size="sm"
                className={`w-full shrink-0 ${!canScrollThumbnailsDown ? 'opacity-30 cursor-not-allowed' : ''}`}
                style={{ height: `${ARROW_HEIGHT}px`, marginTop: `${ARROW_MARGIN}px` }}
                onClick={scrollThumbnailsDown}
                disabled={!canScrollThumbnailsDown}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Main Image Container - Square with same height as thumbnail column */}
        <div 
          className="flex-1 relative min-w-0"
          style={{ height: `${totalColumnHeight}px` }}
        >
          {/* Navigation Arrows - Inside container with proper spacing */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 z-10 bg-background/90 border border-border shadow-md hover:bg-muted h-8 w-8 md:h-10 md:w-10"
              onClick={goToPrevious}
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          )}
          
          <div 
            className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-muted/30 to-muted/10 cursor-zoom-in group w-full h-full mx-auto touch-pan-y"
            onClick={() => setZoomOpen(true)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img 
              src={images[activeImage]} 
              alt={productName} 
              className="w-full h-full object-contain p-6 transition-transform duration-300 group-hover:scale-105 pointer-events-none select-none" 
              draggable={false}
            />
            
            {/* Zoom Indicator */}
            <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md pointer-events-none">
              <ZoomIn className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 z-10 bg-background/90 border border-border shadow-md hover:bg-muted h-8 w-8 md:h-10 md:w-10"
              onClick={goToNext}
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Thumbnails - Carousel with arrows */}
      {images.length > 1 && (
        <div className="md:hidden mt-4 relative">
          <div className="flex items-center gap-2">
            {/* Left Arrow */}
            <Button
              variant="ghost"
              size="icon"
              className={`shrink-0 h-8 w-8 ${thumbnailStart <= 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
              onClick={() => setThumbnailStart(prev => Math.max(0, prev - 1))}
              disabled={thumbnailStart <= 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {/* Thumbnails */}
            <div className="flex gap-2 overflow-hidden flex-1 justify-center">
              {images.slice(thumbnailStart, thumbnailStart + MOBILE_VISIBLE_THUMBNAILS).map((img, index) => {
                const actualIndex = thumbnailStart + index;
                return (
                  <button
                    key={actualIndex}
                    onClick={() => setActiveImage(actualIndex)}
                    className={`shrink-0 overflow-hidden w-14 h-14 rounded-xl border-2 transition-all bg-muted/30 ${
                      activeImage === actualIndex 
                        ? 'border-primary shadow-md' 
                        : 'border-border opacity-60'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain p-1" />
                  </button>
                );
              })}
            </div>
            
            {/* Right Arrow */}
            <Button
              variant="ghost"
              size="icon"
              className={`shrink-0 h-8 w-8 ${thumbnailStart + MOBILE_VISIBLE_THUMBNAILS >= images.length ? 'opacity-30 cursor-not-allowed' : ''}`}
              onClick={() => setThumbnailStart(prev => Math.min(images.length - MOBILE_VISIBLE_THUMBNAILS, prev + 1))}
              disabled={thumbnailStart + MOBILE_VISIBLE_THUMBNAILS >= images.length}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Zoom Modal */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-background/98 backdrop-blur-xl border border-border">
          <div className="relative w-full h-full min-h-[80vh] flex items-center justify-center p-8">
            {/* Close Button */}
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 z-50 bg-background/90 hover:bg-muted shadow-lg"
              onClick={() => setZoomOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Navigation Arrows in Zoom */}
            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-background/90 hover:bg-muted shadow-lg h-12 w-12"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-background/90 hover:bg-muted shadow-lg h-12 w-12"
                  onClick={goToNext}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}

            {/* Zoomed Image */}
            <img 
              src={images[activeImage]} 
              alt={productName} 
              className="max-w-full max-h-[80vh] object-contain" 
            />

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-border shadow-md">
                {activeImage + 1} / {images.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};