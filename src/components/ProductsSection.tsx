import React, { useState } from 'react';
import { LanguageCode, ProductItem } from '../data/siteData';
import { useSite } from '../context/SiteContext';
import { ProductDetailModal } from './ProductDetailModal';

interface ProductsSectionProps {
  products: ProductItem[];
  language: LanguageCode;
  heading?: string;
  subtitle?: string;
  alignStart?: boolean;
  onSelectProduct?: (product: ProductItem) => void;
}

export const ProductsSection: React.FC<ProductsSectionProps> = ({
  products,
  language,
  heading,
  subtitle,
  alignStart = false,
  onSelectProduct,
}) => {
  const { siteState } = useSite();
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const t = siteState.uiTranslations[language];
  const sectionTitle = heading || t.ourProducts;
  const sectionSubtitle = subtitle !== undefined ? subtitle : t.ourProductsSubtitle;

  return (
    <section className="w-full py-12">
      <div className="max-w-[1320px] mx-auto px-6">
        <div
          className={`section-header mb-12 ${
            alignStart ? 'text-start max-w-full' : 'text-center mx-auto max-w-[500px]'
          }`}
        >
          <h1 className="text-[2.25rem] sm:text-[2.75rem] font-bold text-[#BE9C6A] mb-3">
            {sectionTitle}
          </h1>
          <p className="naseem-p">{sectionSubtitle}</p>
        </div>

        {products.length === 0 ? (
          <p className="naseem-p text-base">{t.noProductsAvailable}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((prod) => {
              const displayTitle = language === 'ar' ? prod.titleAr : prod.title;
              const displayDesc = language === 'ar' ? prod.descriptionAr : prod.description;

              return (
                <div key={prod.id} className="product-item bg-white">
                  <div
                    onClick={() => {
                      setSelectedProduct(prod);
                      if (onSelectProduct) onSelectProduct(prod);
                    }}
                    className="relative bg-[#F7F8FC] overflow-hidden cursor-pointer"
                  >
                    <img
                      src={prod.image}
                      alt={displayTitle}
                      referrerPolicy="no-referrer"
                      className="w-full h-[260px] object-cover"
                    />
                  </div>
                  <div className="text-center p-6">
                    <a
                      href={`#product-${prod.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedProduct(prod);
                        if (onSelectProduct) {
                          onSelectProduct(prod);
                        }
                      }}
                      className="block text-[1.25rem] font-semibold text-[#BE9C6A] hover:text-[#23838B] transition-colors mb-1"
                    >
                      {displayTitle}
                    </a>
                    {prod.price && (
                      <div className="text-sm font-semibold text-[#23838B] tabular-nums mt-1">
                        {prod.price}
                      </div>
                    )}
                    {displayDesc && (
                      <p className="text-xs naseem-p mt-2 line-clamp-2">{displayDesc}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ProductDetailModal
        product={selectedProduct}
        language={language}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
};
