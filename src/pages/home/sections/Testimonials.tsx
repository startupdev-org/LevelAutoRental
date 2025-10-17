import React, { useEffect, useRef } from 'react';
import Slider from 'react-slick';
import { testimonials } from '../../../data/testimonials';
import { useTranslation } from 'react-i18next';

// Add inline styles for the slider
const SliderStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    .slick-slider {
      position: relative;
      display: block;
      box-sizing: border-box;
      user-select: none;
      touch-action: pan-y;
    }
    
    .slick-list {
      position: relative;
      display: block;
      overflow: hidden;
      margin: 0;
      padding: 0;
    }
    
    .slick-track {
      position: relative;
      top: 0;
      left: 0;
      display: flex;
      margin-left: auto;
      margin-right: auto;
    }
    
    .slick-slide {
      display: none;
      height: 100%;
      min-height: 1px;
    }
    
    .slick-slide.slick-active {
      display: block;
    }
    
    .slick-initialized .slick-slide {
      display: block;
    }
  `}} />
);

// Navigation arrow components are defined inline

const TestimonialCard = ({ review }: { review: any }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 15;
      const rotateY = (centerX - x) / 15;
      
      card.style.transform = `
        perspective(1000px) 
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg) 
        translateY(-10px)
      `;
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div 
      ref={cardRef}
      className="relative w-full h-[450px] cursor-pointer rounded-[20px] shadow-md transition-all duration-500 overflow-hidden border bg-white/5 backdrop-blur-md border-red-500/10 hover:border-red-500/20"
      style={{
        transformStyle: 'preserve-3d',
        transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
      }}
    >
      {/* Quote icon */}
      <div className="absolute top-6 right-6 opacity-5 group-hover:opacity-15 transition-opacity duration-300">
        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
        </svg>
      </div>

      <div className="p-8 flex flex-col h-full">
        {/* Product Image Section */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={review.product.images[0]?.url}
                alt={review.product.name}
                className="w-16 h-16 object-cover rounded-xl border-2 shadow-sm"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>
            <div className="flex-grow">
              <div className="text-sm font-bold transition-colors duration-200 truncate cursor-pointer">
                {review.product.name}
              </div>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center mb-6">
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, starIdx) => (
              <svg
                key={starIdx}
                className={`w-5 h-5 ${starIdx < review.rating ? 'text-yellow-400' : 'text-gray-200'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="ml-3 text-sm font-medium">({review.rating}.0)</span>
        </div>

        {/* Review Content */}
        <div className="flex-grow mb-6">
          <p className="text-base leading-relaxed font-medium">"{review.comment}"</p>
        </div>

        {/* Customer Info */}
        <div className="flex items-center pt-4 border-t">
          <div className="relative mr-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center border bg-gradient-to-br from-gray-100 to-gray-200 border-gray-200">
              <span className="font-bold text-sm text-gray-600">
                {review.userName.split(' ').map((n: string) => n[0]).join('')}
              </span>
            </div>
            <div className="absolute -bottom-[-1px] -right-[-1px] w-3 h-3 bg-red-500 rounded-full border border-white"></div>
          </div>
          
          <div className="flex-grow">
            <h4 className="font-bold text-base mb-1">{review.userName}</h4>
            <p className="text-sm font-medium">Client Verificat</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Testimonials: React.FC = () => {
  // Translation hook available if needed later
  useTranslation();
  const sliderRef = useRef<Slider>(null);

  const sliderSettings = {
    dots: false,
    arrows: false,
    infinite: true,
    speed: 700,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: false, // Disabled autoplay for now
    autoplaySpeed: 4000,
    pauseOnHover: true,
    centerMode: true,
    centerPadding: '0px',
    cssEase: 'ease-out',
    useCSS: true,
    useTransform: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 3, centerMode: true }
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 1, centerMode: false }
      }
    ]
  };

  return (
    <section className="relative py-0 mt-10 bg-gray-50">
      <SliderStyles />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold tracking-wider text-red-500 uppercase bg-gradient-to-r from-red-500 to-red-600 bg-clip-text">
            Testimoniale
          </span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold text-gray-800 leading-tight max-w-3xl mx-auto">
            Recenzii Clienți
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Ascultați ce spun clienții noștri despre serviciile noastre
          </p>
        </div>

        <div className="relative">
          <Slider ref={sliderRef} {...sliderSettings}>
          {testimonials.map((review) => (
            <div key={review.id} className="px-3">
              <TestimonialCard review={review} />
            </div>
          ))}
          </Slider>
          
          {/* Left Arrow */}
          <button
            onClick={() => sliderRef.current?.slickPrev()}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-32 z-10 w-14 h-14 rounded-full shadow-lg transition-all duration-300 bg-white border-2 border-gray-200 hover:border-red-500 hover:bg-red-500 text-gray-600 hover:text-white group"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="mx-auto transition-transform duration-300 group-hover:-translate-x-0.5">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          
          {/* Right Arrow */}
          <button
            onClick={() => sliderRef.current?.slickNext()}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-32 z-10 w-14 h-14 rounded-full shadow-lg transition-all duration-300 bg-white border-2 border-gray-200 hover:border-red-500 hover:bg-red-500 text-gray-600 hover:text-white group"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="mx-auto transition-transform duration-300 group-hover:translate-x-0.5">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};