import React, { useState, useEffect } from 'react';
import {
  HeroButtonStyle,
  HeroHorizontalPosition,
  HeroSlide,
  HeroSlideButton,
  HeroVerticalPosition,
  LanguageCode,
} from '../data/siteData';
import { useSite } from '../context/SiteContext';

interface HeroCarouselProps {
  language: LanguageCode;
  onNavigate: (path: string) => void;
}

export function resolveSlideButtons(
  slide: HeroSlide,
  defaultProductsLabel: string,
  defaultCategoriesLabel: string
): HeroSlideButton[] {
  if (Array.isArray(slide.buttons)) {
    return slide.buttons;
  }
  const fallback: HeroSlideButton[] = [];
  if (slide.primaryBtnLink !== '') {
    fallback.push({
      id: `${slide.id}-btn-1`,
      label: slide.primaryBtnText || {
        en: 'Products',
        ar: defaultProductsLabel,
        ur: 'مصنوعات',
        hi: 'उत्पाद',
      },
      link: slide.primaryBtnLink || '/all-products',
      style: 'primary',
    });
  }
  if (slide.secondaryBtnLink !== '') {
    fallback.push({
      id: `${slide.id}-btn-2`,
      label: slide.secondaryBtnText || {
        en: 'Products Categories',
        ar: defaultCategoriesLabel,
        ur: 'زمرے',
        hi: 'श्रेणियाँ',
      },
      link: slide.secondaryBtnLink || '/products-categories',
      style: 'secondary',
    });
  }
  return fallback;
}

function getButtonStyleClasses(style: HeroButtonStyle): string {
  switch (style) {
    case 'primary':
      return 'bg-[#23838B] hover:bg-[#1c6b72] text-white border border-transparent';
    case 'secondary':
      return 'bg-[#BE9C6A] hover:bg-[#ab8a59] text-white border border-transparent';
    case 'white':
      return 'bg-white hover:bg-slate-100 text-[#23838B] border border-slate-200 shadow-md';
    case 'outline':
      return 'bg-white/80 hover:bg-[#23838B] text-[#23838B] hover:text-white border-2 border-[#23838B] backdrop-blur-xs';
    default:
      return 'bg-[#23838B] hover:bg-[#1c6b72] text-white';
  }
}

function getVerticalContainerClass(vPos: HeroVerticalPosition = 'center'): string {
  switch (vPos) {
    case 'top':
      return 'items-start pt-28 md:pt-36';
    case 'bottom':
      return 'items-end pb-12 md:pb-20';
    case 'center':
    default:
      return 'items-center';
  }
}

function getHorizontalWrapperStyle(hPos: HeroHorizontalPosition = 'right'): {
  rowJustify: string;
  textAlign: string;
} {
  // Using physical direction classes so 'right', 'center', 'left' always match the user's visual choice regardless of page dir
  switch (hPos) {
    case 'center':
      return {
        rowJustify: 'justify-center',
        textAlign: 'text-center',
      };
    case 'left':
      return {
        rowJustify: 'ltr:justify-start rtl:justify-end',
        textAlign: 'ltr:text-left rtl:text-left',
      };
    case 'right':
    default:
      return {
        rowJustify: 'ltr:justify-end rtl:justify-start',
        textAlign: 'ltr:text-right rtl:text-right',
      };
  }
}

function getButtonsRowJustify(hPos: HeroHorizontalPosition = 'right'): string {
  switch (hPos) {
    case 'center':
      return 'justify-center';
    case 'left':
      return 'ltr:justify-start rtl:justify-end';
    case 'right':
    default:
      return 'ltr:justify-end rtl:justify-start';
  }
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

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="relative w-full p-0 mb-12 overflow-hidden">
      <div className="relative w-full">
        {slides.map((slide, idx) => {
          const slideButtons = resolveSlideButtons(slide, t.products, t.productsCategories);
          const contentPos = slide.contentPosition || 'right';
          const buttonsPos = slide.buttonsPosition || contentPos || 'right';
          const verticalPos = slide.verticalPosition || 'center';
          const imageFit = slide.imageFit || 'cover';
          const showTitle = slide.showTitle !== false;
          const offsetX = typeof slide.buttonOffsetX === 'number' ? slide.buttonOffsetX : 0;
          const offsetY = typeof slide.buttonOffsetY === 'number' ? slide.buttonOffsetY : 0;

          const contentAlign = getHorizontalWrapperStyle(contentPos);
          const buttonsJustify = getButtonsRowJustify(buttonsPos);
          const verticalClass = getVerticalContainerClass(verticalPos);

          const imgFitClass =
            imageFit === 'natural'
              ? 'w-full h-auto block'
              : imageFit === 'contain'
              ? 'w-full min-h-[380px] md:min-h-[540px] lg:min-h-[680px] object-contain bg-white'
              : 'w-full min-h-[450px] md:min-h-[600px] lg:min-h-[760px] object-cover';

          return (
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
                alt={slide.title[language] || slide.title.en || 'Slide'}
                referrerPolicy="no-referrer"
                decoding="async"
                fetchPriority={idx === 0 ? 'high' : 'auto'}
                className={imgFitClass}
              />
              <div className={`absolute inset-0 flex justify-center z-20 ${verticalClass}`}>
                <div className="max-w-[1320px] w-full mx-auto px-6 md:px-12">
                  {/* Slide Heading Block */}
                  {showTitle && (slide.title[language] || slide.title.ar || slide.title.en) && (
                    <div className={`flex w-full ${contentAlign.rowJustify}`}>
                      <div className={`w-full lg:w-8/12 ${contentAlign.textAlign}`}>
                        <h1 className="text-[2.5rem] sm:text-[3.5rem] lg:text-[4.5rem] font-bold text-[#BE9C6A] leading-[1.2] mb-8">
                          {slide.title[language] || slide.title.ar || slide.title.en}
                        </h1>
                      </div>
                    </div>
                  )}

                  {/* Slide Buttons Block with Independent Position & Fine Offset */}
                  {slideButtons.length > 0 && (
                    <div
                      style={{
                        transform:
                          offsetX !== 0 || offsetY !== 0
                            ? `translate(${offsetX}px, ${offsetY}px)`
                            : undefined,
                      }}
                      className={`flex flex-wrap items-center gap-4 w-full ${buttonsJustify}`}
                    >
                      {slideButtons.map((btn) => {
                        const btnText =
                          btn.label[language] || btn.label.ar || btn.label.en || t.products;
                        const btnLink = btn.link || '/all-products';
                        const isExternal =
                          btnLink.startsWith('http://') ||
                          btnLink.startsWith('https://') ||
                          btnLink.startsWith('tel:') ||
                          btnLink.startsWith('mailto:');

                        return (
                          <a
                            key={btn.id}
                            href={btnLink}
                            onClick={(e) => {
                              if (!isExternal) {
                                e.preventDefault();
                                onNavigate(btnLink);
                              }
                            }}
                            className={`font-medium rounded-full py-3.5 px-9 transition-all inline-block ${getButtonStyleClasses(
                              btn.style
                            )}`}
                          >
                            {btnText}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

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
