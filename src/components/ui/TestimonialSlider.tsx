import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Slider from 'react-slick';
import { useTranslation } from 'react-i18next';
import { X, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Testimonial } from '../../types';
import { useInView } from '../../hooks/useInView';

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const SliderStyles = () => (
  <style dangerouslySetInnerHTML={{
    __html: `
      .slick-slider { position: relative; display: block; box-sizing: border-box; user-select: none; touch-action: pan-y; }
      .slick-list { position: relative; display: block; overflow: hidden; margin: 0; padding: 0; }
      .slick-track { position: relative; top: 0; left: 0; display: flex !important; align-items: stretch; margin-left: auto; margin-right: auto; }
      .slick-slide, .slick-initialized .slick-slide { height: auto !important; }
      .slick-initialized .slick-slide { display: flex !important; }
      .slick-slide > div, .slick-slide > div > div { position: relative; z-index: 1; height: 100%; width: 100%; display: flex; }
      @media (max-width: 768px) {
        .slick-slide { width: 100% !important; flex: 0 0 100% !important; }
        .slick-track { width: 100% !important; display: flex !important; }
        .slick-list { overflow: hidden !important; }
      }
    `
  }} />
);

const TestimonialCard = ({ review }: { review: Testimonial }) => {
  const { t } = useTranslation();
  const images = review.reviewImages ?? [];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const visibleImages = images.slice(0, 2);

  const stepLightbox = (dir: -1 | 1) => {
    setLightboxIndex((prev) =>
      prev === null ? 0 : (prev + dir + images.length) % images.length
    );
  };

  useEffect(() => {
    if (lightboxIndex === null) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft' && images.length > 1) stepLightbox(-1);
      if (e.key === 'ArrowRight' && images.length > 1) stepLightbox(1);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [lightboxIndex, images.length]);

  return (
    <>
      <div className="w-full h-[480px] rounded-[20px] shadow-md overflow-hidden border border-gray-200 hover:border-red-500/20 bg-white my-8 flex flex-col">
        <div className="w-full h-36 flex-shrink-0 bg-gray-100 overflow-hidden">
          {visibleImages.length > 0 && (
            <div className={`h-full w-full grid ${visibleImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {visibleImages.map((src, index) => {
                const remaining = images.length - visibleImages.length;
                const showMore = index === visibleImages.length - 1 && remaining > 0;

                return (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    className={`relative overflow-hidden bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                      visibleImages.length > 1 && index === 0 ? 'border-r border-white' : ''
                    }`}
                  >
                    <img
                      src={src}
                      alt={`${review.userName} review photo ${index + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    {showMore && (
                      <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                        <span className="text-white text-lg font-semibold">+{remaining}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 pt-6 pb-5 flex flex-col flex-1 min-h-0">
          <div className="flex items-center mb-5">
            <div className="flex items-center space-x-1">
              {Array.from({ length: 5 }).map((_, starIdx) => (
                <Star
                  key={starIdx}
                  className={`w-5 h-5 ${starIdx < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                />
              ))}
            </div>
            <span className="ml-3 text-sm font-medium text-gray-600">({review.rating}.0)</span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y">
            <p className="text-base leading-relaxed font-medium text-gray-700">
              {t(review.comment)}
            </p>
          </div>

          <div className="flex items-center pt-4 mt-auto border-t border-gray-100">
            {review.avatar ? (
              <img
                src={review.avatar}
                alt={review.userName}
                className="w-12 h-12 object-cover mr-4"
              />
            ) : (
              <div className="w-12 h-12 flex items-center justify-center bg-gray-100 mr-4">
                <span className="font-bold text-sm text-gray-600">
                  {review.userName.split(' ').map((n) => n[0]).join('')}
                </span>
              </div>
            )}

            <div className="flex-grow min-w-0">
              <h4 className="font-bold text-base mb-1 text-gray-800">{review.userName}</h4>
              <p className="text-sm font-medium text-gray-500">{t(review.publishedAt)}</p>
            </div>

            <GoogleIcon className="w-8 h-8 flex-shrink-0 ml-3" />
          </div>
        </div>
      </div>

      {lightboxIndex !== null &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
            onClick={() => setLightboxIndex(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Review photo"
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute top-5 right-5 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    stepLightbox(-1);
                  }}
                  className="absolute left-4 md:left-8 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    stepLightbox(1);
                  }}
                  className="absolute right-4 md:right-8 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              </>
            )}

            <img
              src={images[lightboxIndex]}
              alt={`${review.userName} review photo ${lightboxIndex + 1}`}
              className="max-w-[92vw] max-h-[88vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium">
                {lightboxIndex + 1} / {images.length}
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
};

interface TestimonialSliderProps {
  testimonials: Testimonial[];
  showArrows?: boolean;
  autoplay?: boolean;
  autoplaySpeed?: number;
}

const arrowBtnClass =
  'hidden md:block absolute top-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full shadow-sm transition-all duration-300 bg-white border-2 border-gray-200 hover:border-red-500 hover:bg-red-500 text-gray-600 hover:text-white';

export const TestimonialSlider: React.FC<TestimonialSliderProps> = ({
  testimonials,
  showArrows = true,
  autoplay = false,
  autoplaySpeed = 4000
}) => {
  const sliderRef = useRef<Slider>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { ref: inViewRef, isInView } = useInView({ threshold: 0.25 });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!autoplay) return;
    if (isInView) sliderRef.current?.slickPlay();
    else sliderRef.current?.slickPause();
  }, [isInView, autoplay]);

  return (
    <div ref={inViewRef} className="relative">
      <SliderStyles />
      <Slider
        key={isMobile ? 'mobile' : 'desktop'}
        ref={sliderRef}
        dots={false}
        arrows={false}
        infinite
        speed={700}
        slidesToShow={isMobile ? 1 : 3}
        slidesToScroll={1}
        autoplay={autoplay}
        autoplaySpeed={autoplaySpeed}
        pauseOnHover
        pauseOnFocus
        swipeToSlide
        cssEase="ease-out"
      >
        {testimonials.map((review) => (
          <div key={review.id} className="px-3 h-full">
            <TestimonialCard review={review} />
          </div>
        ))}
      </Slider>

      {showArrows && (
        <>
          <button
            type="button"
            onClick={() => sliderRef.current?.slickPrev()}
            className={`${arrowBtnClass} left-0 -translate-x-32`}
          >
            <ChevronLeft className="w-6 h-6 mx-auto" />
          </button>
          <button
            type="button"
            onClick={() => sliderRef.current?.slickNext()}
            className={`${arrowBtnClass} right-0 translate-x-32`}
          >
            <ChevronRight className="w-6 h-6 mx-auto" />
          </button>
        </>
      )}
    </div>
  );
};
