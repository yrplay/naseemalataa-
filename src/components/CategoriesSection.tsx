import React from 'react';
import { LanguageCode, ProductCategory } from '../data/siteData';
import { useSite } from '../context/SiteContext';

interface CategoriesSectionProps {
  categories: ProductCategory[];
  language: LanguageCode;
  onNavigate: (path: string) => void;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  categories,
  language,
  onNavigate,
}) => {
  const { siteState } = useSite();
  const t = siteState.uiTranslations[language];

  return (
    <section
      style={{ backgroundColor: siteState.theme.lightBgColor || '#F7F8FC' }}
      className="w-full bg-icon my-12 py-24"
    >
      <div className="max-w-[1320px] mx-auto px-6">
        <div className="section-header text-center mx-auto mb-12 max-w-[500px]">
          <h1 className="text-[2.25rem] sm:text-[2.75rem] font-bold text-[#BE9C6A] mb-3">
            {t.productsCategories}
          </h1>
          <p className="naseem-p">{t.productsCategoriesSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const displayTitle = language === 'ar' ? cat.titleAr : cat.title;
            const displayDesc = language === 'ar' ? cat.descriptionAr : cat.description;

            return (
              <div
                key={cat.id}
                className="bg-white text-center h-full p-6 xl:p-10 flex flex-col items-center justify-between shadow-[0_0_45px_rgba(0,0,0,0.03)]"
              >
                <div className="w-full flex flex-col items-center">
                  <img
                    src={cat.image}
                    alt={displayTitle}
                    width={100}
                    height={100}
                    referrerPolicy="no-referrer"
                    className="w-[100px] h-[100px] object-contain mb-6 mx-auto"
                  />
                  <h4 className="text-[1.45rem] font-semibold text-[#BE9C6A] mb-4">
                    {displayTitle}
                  </h4>
                  <div
                    dir={cat.isRtlDescription || language === 'ar' ? 'rtl' : 'ltr'}
                    className={`naseem-p mb-6 w-full text-justify ${
                      cat.isRtlDescription ? 'font-semibold text-[18px] text-center' : ''
                    }`}
                  >
                    {cat.highlightYellow ? (
                      <span className="bg-[#f1c40f] px-1 font-semibold text-[#BE9C6A]">
                        {displayDesc}
                      </span>
                    ) : (
                      <span>{displayDesc}</span>
                    )}
                  </div>
                </div>

                <a
                  href={`/${cat.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(`/${cat.slug}`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-[#23838B] hover:bg-[#1b6970] text-white border-2 border-[#23838B] py-2 px-6 rounded-full font-medium transition-colors inline-block"
                >
                  {t.exploreProducts}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
