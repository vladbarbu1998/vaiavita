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
          <div className="hidden md:flex flex-col gap-2 w-24 shrink-0 max-h-[500px] overflow-y-auto">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => setActiveImage(index)}
                className={`relative overflow-hidden aspect-square rounded-lg border-2 transition-all duration-200 bg-muted/30 ${
                  activeImage === index 
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
            ))}
          </div>
        )}

        {/* Main Image Container */}
        <div className="flex-1 relative">
          {/* Navigation Arrows - Outside main image */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-background border border-border shadow-md hover:bg-muted h-10 w-10"
              onClick={goToPrevious}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          
          <div 
            className="relative overflow-hidden aspect-square rounded-xl border border-border bg-gradient-to-br from-muted/30 to-muted/10 cursor-zoom-in group"
            onClick={() => setZoomOpen(true)}
          >
            <img 
              src={images[activeImage]} 
              alt={productName} 
              className="w-full h-full object-contain p-6 transition-transform duration-300 group-hover:scale-105" 
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
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-background border border-border shadow-md hover:bg-muted h-10 w-10"
              onClick={goToNext}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Thumbnails - Bottom */}
      {images.length > 1 && (
        <div className="md:hidden flex gap-2 mt-4 overflow-x-auto pb-2">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setActiveImage(index)}
              className={`shrink-0 overflow-hidden w-16 h-16 rounded-lg border-2 transition-all bg-muted/30 ${
                activeImage === index 
                  ? 'border-primary shadow-md' 
                  : 'border-border opacity-60'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-contain p-1" />
            </button>
          ))}
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
