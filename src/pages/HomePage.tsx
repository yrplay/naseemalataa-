import React from 'react';
import { HomeSectionKey, LanguageCode } from '../data/siteData';
import { useSite } from '../context/SiteContext';
import { HeroCarousel } from '../components/HeroCarousel';
import { CategoriesSection } from '../components/CategoriesSection';
import { ProductsSection } from '../components/ProductsSection';
import { MarketPlacesSection } from '../components/MarketPlacesSection';

interface HomePageProps {
  language: LanguageCode;
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ language, onNavigate }) => {
  const { siteState } = useSite();
  const { homeAbout, categories, products, marketPlaces, theme } = siteState;

  const order: HomeSectionKey[] =
    theme.homeSectionsOrder && theme.homeSectionsOrder.length > 0
      ? theme.homeSectionsOrder
      : ['hero', 'about', 'categories', 'products', 'marketplaces'];

  const hidden = new Set(theme.hiddenHomeSections || []);

  const renderSection = (key: HomeSectionKey) => {
    if (hidden.has(key)) return null;

    switch (key) {
      case 'hero':
        return <HeroCarousel key="hero" language={language} onNavigate={onNavigate} />;
      case 'about':
        return (
          <section key="about" className="w-full py-12">
            <div className="max-w-[1320px] mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-6">
                  <div className="about-img relative overflow-hidden p-12 pe-0">
                    <img
                      src={homeAbout.image}
                      alt={homeAbout.heading[language] || homeAbout.heading.en}
                      referrerPolicy="no-referrer"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
                <div className="lg:col-span-6">
                  <h1 className="text-[2.25rem] sm:text-[2.75rem] font-bold text-[#BE9C6A] mb-6 leading-tight">
                    {homeAbout.heading[language] || homeAbout.heading.en}
                  </h1>
                  <p className="naseem-p mb-6 leading-relaxed">
                    {homeAbout.description[language] || homeAbout.description.en}
                  </p>
                  <div className="space-y-3">
                    {(homeAbout.bullets[language] || homeAbout.bullets.en).map((bullet, idx) => (
                      <p key={idx} className="naseem-p flex items-center">
                        <i className="fa fa-check text-[#23838B] me-4"></i>
                        <span>{bullet}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      case 'categories':
        return (
          <CategoriesSection
            key="categories"
            categories={categories}
            language={language}
            onNavigate={onNavigate}
          />
        );
      case 'products':
        return <ProductsSection key="products" products={products} language={language} />;
      case 'marketplaces':
        return (
          <MarketPlacesSection
            key="marketplaces"
            marketPlaces={marketPlaces}
            language={language}
            useFullDescription={false}
          />
        );
      default:
        return null;
    }
  };

  return <div>{order.map((sectionKey) => renderSection(sectionKey))}</div>;
};
