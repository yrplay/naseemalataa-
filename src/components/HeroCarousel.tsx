import React, { useState, useEffect } from 'react';
import { LanguageCode } from '../data/siteData';
import { useSite } from '../context/SiteContext';

interface HeroCarouselProps {
  language: LanguageCode;
  onNavigate: (path: string) => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ language, onNavigate }) => {
  const { siteState } = useSite();
  const slides = siteState.heroSlides;
  const t = siteState.uiTranslations[language];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) {
    return null;
  }

  const safeIndex = activeIndex % slides.length;
  const currentSlide = slides[safeIndex];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  };

  const primaryLabel = currentSlide.primaryBtnText?.[language] || t.products;
  const primaryLink = currentSlide.primaryBtnLink || '/all-products';
  const secondaryLabel = currentSlide.secondaryBtnText?.[language] || t.productsCategories;
  const secondaryLink = currentSlide.secondaryBtnLink || '/products-categories';

  return (
    <div className="relative w-full p-0 mb-12 overflow-hidden">
      <div className="relative min-h-[450px] md:min-h-[600px] lg:min-h-[760px] w-full">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`transition-opacity duration-700 ${
              idx === safeIndex
                ? 'opacity-100 relative z-10'
                : 'opacity-0 absolute inset-0 pointer-events-none'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title[language] || slide.title.en}
              referrerPolicy="no-referrer"
              className="w-full min-h-[450px] md:min-h-[600px] lg:min-h-[760px] object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="max-w-[1320px] w-full mx-auto px-6 md:px-12">
                <div className="flex justify-start">
                  <div className="w-full lg:w-7/12 text-start">
                    <h1 className="text-[2.5rem] sm:text-[3.5rem] lg:text-[4.5rem] font-bold text-[#BE9C6A] leading-[1.15] mb-10">
                      {currentSlide.title[language] || currentSlide.title.en}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4">
                      <a
                        href={primaryLink}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(primaryLink);
                        }}
                        className="bg-[#23838B] hover:bg-[#1c6b72] text-white font-medium rounded-full py-3.5 px-10 transition-colors inline-block"
                      >
                        {primaryLabel}
                      </a>
                      <a
                        href={secondaryLink}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(secondaryLink);
                        }}
                        className="bg-[#BE9C6A] hover:bg-[#ab8a59] text-white font-medium rounded-full py-3.5 px-10 transition-colors inline-block"
                      >
                        {secondaryLabel}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Prev / Next Controls */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous"
              className="absolute top-0 bottom-0 start-0 w-[8%] min-w-[64px] z-30 flex items-center justify-center group cursor-pointer"
            >
              <span className="w-12 h-12 rounded-full bg-[#23838B]/80 group-hover:bg-[#23838B] text-white flex items-center justify-center transition-colors shadow">
                <i className="fa fa-chevron-left text-lg"></i>
              </span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next"
              className="absolute top-0 bottom-0 end-0 w-[8%] min-w-[64px] z-30 flex items-center justify-center group cursor-pointer"
            >
              <span className="w-12 h-12 rounded-full bg-[#23838B]/80 group-hover:bg-[#23838B] text-white flex items-center justify-center transition-colors shadow">
                <i className="fa fa-chevron-right text-lg"></i>
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
