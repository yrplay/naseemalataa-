import React, { useState } from 'react';
import { LanguageCode, ProductItem } from '../data/siteData';
import { useSite } from '../context/SiteContext';
import { addProductToState } from '../utils/siteLogic';
import { ProductDetailModal } from './ProductDetailModal';
import { ImageInputField } from './admin/ImageInputField';

interface ProductsSectionProps {
  products: ProductItem[];
  language: LanguageCode;
  heading?: string;
  subtitle?: string;
  alignStart?: boolean;
  categorySlug?: string;
  categoryTitleAr?: string;
  onSelectProduct?: (product: ProductItem) => void;
}

export const ProductsSection: React.FC<ProductsSectionProps> = ({
  products,
  language,
  heading,
  subtitle,
  alignStart = false,
  categorySlug,
  categoryTitleAr,
  onSelectProduct,
}) => {
  const { siteState, updateSiteState, isAdminAuthenticated } = useSite();
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickProd, setQuickProd] = useState({
    titleAr: '',
    title: '',
    price: '',
    descriptionAr: '',
    image: '/uploads/1782929518_product-1.jpg',
  });
  const [quickAddedNotice, setQuickAddedNotice] = useState('');

  const t = siteState.uiTranslations[language];
  const sectionTitle = heading || t.ourProducts;
  const sectionSubtitle = subtitle !== undefined ? subtitle : t.ourProductsSubtitle;

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categorySlug) return;
    if (!quickProd.titleAr.trim() && !quickProd.title.trim()) return;
    const finalTitleAr = quickProd.titleAr.trim() || quickProd.title.trim();
    const finalTitle = quickProd.title.trim() || quickProd.titleAr.trim();

    // Find any sibling categories with the same Arabic title so the product appears in both
    const targetCat = siteState.categories.find(
      (c) => c.slug.toLowerCase() === categorySlug.toLowerCase()
    );
    const targetSlugs = new Set<string>([categorySlug]);
    if (targetCat) {
      siteState.categories.forEach((sib) => {
        if (sib.titleAr.trim() === targetCat.titleAr.trim()) {
          targetSlugs.add(sib.slug);
        }
      });
    }

    const created: ProductItem = {
      id: `prod-${Date.now()}`,
      title: finalTitle,
      titleAr: finalTitleAr,
      price: quickProd.price.trim() || undefined,
      descriptionAr: quickProd.descriptionAr.trim() || undefined,
      description: quickProd.descriptionAr.trim() || undefined,
      image: quickProd.image || '/uploads/1782929518_product-1.jpg',
      categorySlugs: Array.from(targetSlugs),
    };

    updateSiteState((prev) => addProductToState(prev, created));
    setQuickProd({
      titleAr: '',
      title: '',
      price: '',
      descriptionAr: '',
      image: '/uploads/1782929518_product-1.jpg',
    });
    setQuickAddedNotice(`تمت إضافة "${finalTitleAr}" إلى هذا القسم بنجاح!`);
    setTimeout(() => setQuickAddedNotice(''), 3500);
  };

  return (
    <section className="w-full py-12">
      <div className="max-w-[1320px] mx-auto px-6">
        <div
          className={`section-header mb-12 ${
            alignStart ? 'text-start max-w-full' : 'text-center mx-auto max-w-[500px]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-[2.25rem] sm:text-[2.75rem] font-bold text-[#BE9C6A] mb-3">
                {sectionTitle}
              </h1>
              <p className="naseem-p">{sectionSubtitle}</p>
            </div>

            {categorySlug && isAdminAuthenticated && (
              <button
                type="button"
                onClick={() => setShowQuickAdd(!showQuickAdd)}
                className="px-4 py-2.5 text-xs font-semibold bg-[#23838B] hover:bg-[#1a666d] text-white rounded shadow-sm transition-colors cursor-pointer shrink-0"
              >
                <i className="fa fa-plus me-1.5"></i>
                {showQuickAdd
                  ? 'إغلاق نموذج الإضافة السريعة'
                  : `+ إضافة منتج مباشر داخل "${categoryTitleAr || sectionTitle}"`}
              </button>
            )}
          </div>
        </div>

        {/* Inline Admin Quick-Add Form inside the Category Page */}
        {categorySlug && isAdminAuthenticated && showQuickAdd && (
          <form
            dir="rtl"
            onSubmit={handleQuickAddSubmit}
            className="mb-10 p-6 bg-teal-50/70 border-2 border-[#23838B] rounded-lg space-y-4 text-start"
          >
            <div className="flex items-center justify-between border-b border-teal-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                إضافة منتج جديد مباشرة داخل قسم: {categoryTitleAr || categorySlug}
              </h3>
              {quickAddedNotice && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded">
                  {quickAddedNotice}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم المنتج (بالعربية) *
                </label>
                <input
                  type="text"
                  required
                  value={quickProd.titleAr}
                  onChange={(e) => setQuickProd({ ...quickProd, titleAr: e.target.value })}
                  placeholder="مثال: سلة غذائية متكاملة"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم المنتج (بالإنجليزية - اختياري)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={quickProd.title}
                  onChange={(e) => setQuickProd({ ...quickProd, title: e.target.value })}
                  placeholder="e.g. Premium Food Basket"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  السعر أو الكود (اختياري)
                </label>
                <input
                  type="text"
                  value={quickProd.price}
                  onChange={(e) => setQuickProd({ ...quickProd, price: e.target.value })}
                  placeholder="مثال: 150 ر.س"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                وصف المنتج (اختياري)
              </label>
              <input
                type="text"
                value={quickProd.descriptionAr}
                onChange={(e) => setQuickProd({ ...quickProd, descriptionAr: e.target.value })}
                placeholder="تفاصيل المنتج أو العبوة..."
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded"
              />
            </div>

            <ImageInputField
              label="صورة المنتج"
              value={quickProd.image}
              onChange={(url) => setQuickProd({ ...quickProd, image: url })}
            />

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-[#23838B] hover:bg-[#1a666d] text-white rounded cursor-pointer"
              >
                حفظ وإظهار المنتج فوراً في القسم
              </button>
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="px-4 py-2 text-xs bg-white border border-slate-300 rounded cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </form>
        )}

        {products.length === 0 ? (
          <div className="space-y-3">
            <p className="naseem-p text-base">{t.noProductsAvailable}</p>
            {categorySlug && isAdminAuthenticated && !showQuickAdd && (
              <button
                type="button"
                onClick={() => setShowQuickAdd(true)}
                className="px-4 py-2 text-xs font-semibold bg-[#23838B] text-white rounded cursor-pointer"
              >
                + أضف أول منتج في هذا القسم الآن
              </button>
            )}
          </div>
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
