import React from 'react';
import { LanguageCode, MarketPlaceItem } from '../data/siteData';
import { useSite } from '../context/SiteContext';

interface MarketPlacesSectionProps {
  marketPlaces: MarketPlaceItem[];
  language: LanguageCode;
  useFullDescription?: boolean;
}

export const MarketPlacesSection: React.FC<MarketPlacesSectionProps> = ({
  marketPlaces,
  language,
  useFullDescription = false,
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
            {t.ourMarketPlaces}
          </h1>
          <p className="naseem-p">{t.ourMarketPlacesSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketPlaces.map((mp) => {
            const displayTitle = language === 'ar' ? mp.titleAr : mp.title;
            const displayDesc =
              language === 'ar'
                ? mp.fullDescriptionAr
                : useFullDescription
                ? mp.fullDescription
                : mp.homeExcerpt;

            return (
              <div
                key={mp.id}
                className="bg-white text-center h-full p-6 xl:p-10 flex flex-col items-center shadow-[0_0_45px_rgba(0,0,0,0.03)]"
              >
                <img
                  src={mp.image}
                  alt={displayTitle}
                  width={100}
                  height={100}
                  referrerPolicy="no-referrer"
                  className="w-[100px] h-[100px] object-contain mb-6 mx-auto"
                />
                <h4 className="text-[1.45rem] font-semibold text-[#BE9C6A] mb-4">
                  {displayTitle}
                </h4>
                <p className="naseem-p mb-4 text-justify leading-relaxed">{displayDesc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
