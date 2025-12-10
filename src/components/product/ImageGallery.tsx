import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

export const ImageGallery = ({ images, productName }: ImageGalleryProps) => {
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  const goToPrevious = () => {
    setActiveImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className="flex gap-4 opacity-0 animate-fade-up">
        {/* Thumbnails - Left Side */}
        {images.length > 1 && (
          <div className="hidden sm:flex flex-col gap-3 w-20 shrink-0">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => setActiveImage(index)}
                className={`card-premium overflow-hidden aspect-square p-1.5 transition-all ${
                  activeImage === index 
                    ? 'ring-2 ring-primary' 
                    : 'hover:ring-2 hover:ring-primary/50 opacity-70 hover:opacity-100'
                }`}
              >
                <img 
                  src={img} 
                  alt="" 
                  className="w-full h-full object-contain" 
                />
              </button>
            ))}
          </div>
        )}

        {/* Main Image */}
        <div className="flex-1 relative group">
          <div 
            className="card-premium overflow-hidden aspect-square bg-gradient-to-br from-muted/50 to-muted/30 cursor-zoom-in"
            onClick={() => setZoomOpen(true)}
          >
            <img 
              src={images[activeImage]} 
              alt={productName} 
              className="w-full h-full object-contain p-8 transition-transform group-hover:scale-105" 
            />
          </div>
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </>
          )}

          {/* Zoom Indicator */}
          <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <ZoomIn className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Mobile Thumbnails - Bottom */}
        {images.length > 1 && (
          <div className="sm:hidden flex gap-3 absolute -bottom-16 left-0 right-0">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => setActiveImage(index)}
                className={`card-premium overflow-hidden w-16 h-16 p-1.5 transition-all ${
                  activeImage === index 
                    ? 'ring-2 ring-primary' 
                    : 'hover:ring-2 hover:ring-primary/50 opacity-70'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-background/95 backdrop-blur-md border-0">
          <div className="relative w-full h-full min-h-[80vh] flex items-center justify-center p-4">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={() => setZoomOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Navigation Arrows in Zoom */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-background/80 backdrop-blur-sm hover:bg-background"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-background/80 backdrop-blur-sm hover:bg-background"
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
              className="max-w-full max-h-[85vh] object-contain" 
            />

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
                {activeImage + 1} / {images.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
