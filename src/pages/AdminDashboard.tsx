import React, { useState } from 'react';
import {
  CustomPage,
  HeroSlide,
  HomeSectionKey,
  LanguageCode,
  LegalSection,
  MarketPlaceItem,
  ProductCategory,
  ProductItem,
  UITranslationSet,
  WorkAreaRow,
} from '../data/siteData';
import { useSite } from '../context/SiteContext';
import {
  addCategoryToState,
  addProductToState,
  deleteCategoryFromState,
  deleteProductFromState,
  getProductsByCategorySlug,
  moveArrayItem,
  slugifyText,
  updateCategoryInState,
  updateProductInState,
} from '../utils/siteLogic';
import { ImageInputField } from '../components/admin/ImageInputField';
import { AdminLoginGate } from '../components/admin/AdminLoginGate';
import { AdminSecurityAndDeployModal } from '../components/admin/AdminSecurityAndDeployModal';

export type AdminTabKey =
  | 'overview'
  | 'company'
  | 'theme'
  | 'hero'
  | 'about'
  | 'categories'
  | 'products'
  | 'marketplaces'
  | 'pages'
  | 'messages';

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
}

const HOME_SECTION_LABELS: Record<HomeSectionKey, string> = {
  hero: 'السلايدر الرئيسي (Hero Carousel)',
  about: 'قسم النبذة التعريفية (About Section)',
  categories: 'أقسام المنتجات (Products Categories)',
  products: 'قائمة المنتجات (Our Products)',
  marketplaces: 'قطاعات العمل (Our Market Places)',
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const {
    siteState,
    setSiteState,
    updateSiteState,
    resetSiteState,
    language,
    setLanguage,
    isAdminAuthenticated,
    loginAdmin,
    logoutAdmin,
    publishChanges,
    cloudAdminUser,
    cloudSyncStatus,
    cloudSyncError,
    signInWithGoogleAdmin,
    syncNowToCloud,
  } = useSite();
  const [activeTab, setActiveTab] = useState<AdminTabKey>(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as AdminTabKey | null;
    const validTabs: AdminTabKey[] = [
      'overview',
      'company',
      'theme',
      'hero',
      'about',
      'categories',
      'products',
      'marketplaces',
      'pages',
      'messages',
    ];
    return tabParam && validTabs.includes(tabParam) ? tabParam : 'overview';
  });
  const [statusNotice, setStatusNotice] = useState<string>('');

  // Search & filter states for Categories & Products
  const [catSearch, setCatSearch] = useState('');
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [inCatProduct, setInCatProduct] = useState({
    titleAr: '',
    title: '',
    price: '',
    descriptionAr: '',
    image: '/uploads/1782929518_product-1.jpg',
  });
  const [newCategory, setNewCategory] = useState<Omit<ProductCategory, 'id'>>({
    slug: '',
    title: '',
    titleAr: '',
    image: '/uploads/naseem-profile-logo.jpeg',
    description: '',
    descriptionAr: '',
    isRtlDescription: false,
    highlightYellow: false,
  });

  const [prodSearch, setProdSearch] = useState('');
  const [prodCategoryFilter, setProdCategoryFilter] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('cat') || 'all';
  });
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [newProduct, setNewProduct] = useState<Omit<ProductItem, 'id'>>(() => {
    const params = new URLSearchParams(window.location.search);
    const initialCat = params.get('cat');
    return {
      title: '',
      titleAr: '',
      price: '',
      description: '',
      descriptionAr: '',
      image: '/uploads/1782929518_product-1.jpg',
      categorySlugs: initialCat ? [initialCat] : ['food-baskets'],
    };
  });

  const handleQuickAddProductToCategory = (slug: string, titleAr: string) => {
    setNewProduct((prev) => ({
      ...prev,
      categorySlugs: [slug],
    }));
    setProdCategoryFilter(slug);
    setActiveTab('products');
    notify(`جاري إضافة منتج جديد داخل قسم: "${titleAr}"`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Marketplaces state
  const [editingMarketPlace, setEditingMarketPlace] = useState<MarketPlaceItem | null>(null);
  const [newMarketPlace, setNewMarketPlace] = useState<Omit<MarketPlaceItem, 'id'>>({
    title: '',
    titleAr: '',
    image: '/uploads/1782762418_supermarket.png',
    homeExcerpt: '',
    fullDescription: '',
    fullDescriptionAr: '',
  });

  // Custom pages state
  const [editingCustomPage, setEditingCustomPage] = useState<CustomPage | null>(null);
  const [newCustomPage, setNewCustomPage] = useState<Omit<CustomPage, 'id'>>({
    slug: '',
    title: '',
    titleAr: '',
    content: '',
    contentAr: '',
    showInNavbar: true,
    showInFooter: true,
  });

  // Translation editor language
  const [transLang, setTransLang] = useState<LanguageCode>('ar');

  // JSON Import / Export state
  const [jsonInputText, setJsonInputText] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);

  const notify = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => {
      setStatusNotice((prev) => (prev === msg ? '' : prev));
    }, 3500);
  };

  const unreadMessagesCount = siteState.contactMessages.filter((m) => !m.read).length;

  const navItems: Array<{ key: AdminTabKey; label: string; icon: string; badge?: number }> = [
    { key: 'overview', label: 'نظرة عامة والإحصائيات', icon: 'fa-chart-pie' },
    { key: 'company', label: 'الهوية وبيانات التواصل', icon: 'fa-building' },
    { key: 'theme', label: 'المظهر والألوان وترتيب الرئيسية', icon: 'fa-palette' },
    {
      key: 'hero',
      label: 'السلايدر الرئيسي (Hero)',
      icon: 'fa-images',
      badge: siteState.heroSlides.length,
    },
    { key: 'about', label: 'نبذة الرئيسية وصفحة من نحن', icon: 'fa-info-circle' },
    {
      key: 'categories',
      label: 'إدارة أقسام المنتجات',
      icon: 'fa-th-large',
      badge: siteState.categories.length,
    },
    {
      key: 'products',
      label: 'إدارة المنتجات',
      icon: 'fa-box-open',
      badge: siteState.products.length,
    },
    {
      key: 'marketplaces',
      label: 'قطاعات العمل (Market Places)',
      icon: 'fa-store',
      badge: siteState.marketPlaces.length,
    },
    { key: 'pages', label: 'الصفحات والسياسات والترجمات', icon: 'fa-file-alt' },
    {
      key: 'messages',
      label: 'الرسائل وأدوات المطور',
      icon: 'fa-envelope-open-text',
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
  ];

  // Handlers for Categories
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.title.trim() && !newCategory.titleAr.trim()) return;
    const finalTitle = newCategory.title.trim() || newCategory.titleAr.trim();
    const finalTitleAr = newCategory.titleAr.trim() || newCategory.title.trim();
    const slug = newCategory.slug.trim() || slugifyText(finalTitle);

    const created: ProductCategory = {
      id: `cat-${Date.now()}`,
      slug,
      title: finalTitle,
      titleAr: finalTitleAr,
      image: newCategory.image || '/uploads/naseem-profile-logo.jpeg',
      description: newCategory.description || finalTitle,
      descriptionAr: newCategory.descriptionAr || finalTitleAr,
      isRtlDescription: newCategory.isRtlDescription,
      highlightYellow: newCategory.highlightYellow,
    };

    updateSiteState((prev) => addCategoryToState(prev, created));
    setNewCategory({
      slug: '',
      title: '',
      titleAr: '',
      image: '/uploads/naseem-profile-logo.jpeg',
      description: '',
      descriptionAr: '',
      isRtlDescription: false,
      highlightYellow: false,
    });
    notify(`تمت إضافة القسم "${finalTitleAr}" بنجاح.`);
  };

  const handleSaveCategoryEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    updateSiteState((prev) => updateCategoryInState(prev, editingCategory));
    notify(`تم حفظ تعديلات القسم "${editingCategory.titleAr}" بنجاح.`);
    setEditingCategory(null);
  };

  const expandWithSiblingCategorySlugs = (slugs: string[]): string[] => {
    const baseSlugs =
      slugs.length > 0
        ? slugs
        : prodCategoryFilter !== 'all'
        ? [prodCategoryFilter]
        : ['food-baskets'];
    const expanded = new Set<string>();
    baseSlugs.forEach((rawSlug) => {
      const clean = rawSlug.trim();
      if (!clean) return;
      expanded.add(clean);
      const matchedCat = siteState.categories.find(
        (c) => c.slug.toLowerCase() === clean.toLowerCase() || c.id === clean
      );
      if (matchedCat) {
        expanded.add(matchedCat.slug);
        siteState.categories.forEach((sib) => {
          if (
            sib.titleAr.trim() !== '' &&
            sib.titleAr.trim() === matchedCat.titleAr.trim()
          ) {
            expanded.add(sib.slug);
          }
        });
      }
    });
    return Array.from(expanded);
  };

  // Handlers for Products
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.title.trim() && !newProduct.titleAr.trim()) return;
    const finalTitle = newProduct.title.trim() || newProduct.titleAr.trim();
    const finalTitleAr = newProduct.titleAr.trim() || newProduct.title.trim();
    const finalSlugs = expandWithSiblingCategorySlugs(newProduct.categorySlugs);

    const created: ProductItem = {
      id: `prod-${Date.now()}`,
      title: finalTitle,
      titleAr: finalTitleAr,
      price: newProduct.price?.trim() || undefined,
      description: newProduct.description?.trim() || undefined,
      descriptionAr: newProduct.descriptionAr?.trim() || undefined,
      image: newProduct.image || '/uploads/1782929518_product-1.jpg',
      categorySlugs: finalSlugs,
    };

    updateSiteState((prev) => addProductToState(prev, created));
    setNewProduct({
      title: '',
      titleAr: '',
      price: '',
      description: '',
      descriptionAr: '',
      image: '/uploads/1782929518_product-1.jpg',
      categorySlugs: finalSlugs,
    });
    notify(`تمت إضافة المنتج "${finalTitleAr}" داخل القسم المحدد بنجاح.`);
  };

  const handleAddProductInsideCategoryModal = (targetCat: ProductCategory) => {
    if (!inCatProduct.titleAr.trim() && !inCatProduct.title.trim()) return;
    const finalTitleAr = inCatProduct.titleAr.trim() || inCatProduct.title.trim();
    const finalTitle = inCatProduct.title.trim() || inCatProduct.titleAr.trim();
    const finalSlugs = expandWithSiblingCategorySlugs([targetCat.slug]);

    const created: ProductItem = {
      id: `prod-${Date.now()}`,
      title: finalTitle,
      titleAr: finalTitleAr,
      price: inCatProduct.price.trim() || undefined,
      descriptionAr: inCatProduct.descriptionAr.trim() || undefined,
      description: inCatProduct.descriptionAr.trim() || undefined,
      image: inCatProduct.image || '/uploads/1782929518_product-1.jpg',
      categorySlugs: finalSlugs,
    };

    updateSiteState((prev) => addProductToState(prev, created));
    setInCatProduct({
      titleAr: '',
      title: '',
      price: '',
      descriptionAr: '',
      image: '/uploads/1782929518_product-1.jpg',
    });
    notify(`تمت إضافة المنتج "${finalTitleAr}" داخل قسم "${targetCat.titleAr}" بنجاح!`);
  };

  const handleSaveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const updatedWithSiblings: ProductItem = {
      ...editingProduct,
      categorySlugs: expandWithSiblingCategorySlugs(editingProduct.categorySlugs),
    };
    updateSiteState((prev) => updateProductInState(prev, updatedWithSiblings));
    notify(`تم تحديث المنتج "${editingProduct.titleAr}" بنجاح.`);
    setEditingProduct(null);
  };

  const toggleCategorySlugInList = (slugs: string[], slug: string): string[] => {
    return slugs.includes(slug) ? slugs.filter((s) => s !== slug) : [...slugs, slug];
  };

  // Handlers for MarketPlaces
  const handleAddMarketPlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMarketPlace.title.trim() && !newMarketPlace.titleAr.trim()) return;
    const created: MarketPlaceItem = {
      id: `mp-${Date.now()}`,
      title: newMarketPlace.title.trim() || newMarketPlace.titleAr.trim(),
      titleAr: newMarketPlace.titleAr.trim() || newMarketPlace.title.trim(),
      image: newMarketPlace.image || '/uploads/1782762418_supermarket.png',
      homeExcerpt: newMarketPlace.homeExcerpt || newMarketPlace.fullDescription,
      fullDescription: newMarketPlace.fullDescription || newMarketPlace.homeExcerpt,
      fullDescriptionAr: newMarketPlace.fullDescriptionAr || newMarketPlace.homeExcerpt,
    };
    updateSiteState((prev) => ({
      ...prev,
      marketPlaces: [...prev.marketPlaces, created],
    }));
    setNewMarketPlace({
      title: '',
      titleAr: '',
      image: '/uploads/1782762418_supermarket.png',
      homeExcerpt: '',
      fullDescription: '',
      fullDescriptionAr: '',
    });
    notify(`تمت إضافة قطاع العمل "${created.titleAr}" بنجاح.`);
  };

  // Handlers for Hero Slides
  const handleAddHeroSlide = () => {
    const newSlide: HeroSlide = {
      id: `slide-${Date.now()}`,
      image: '/front_css/img/carousel-1.jpg',
      title: {
        en: 'New Promotional Slide',
        ar: 'عنوان الشريحة الترويجية الجديدة',
        ur: 'نئی پروموشنل سلائیڈ',
        hi: 'नई प्रचार स्लाइड',
      },
      primaryBtnLink: '/all-products',
      secondaryBtnLink: '/products-categories',
    };
    updateSiteState((prev) => ({
      ...prev,
      heroSlides: [...prev.heroSlides, newSlide],
    }));
    notify('تمت إضافة شريحة جديدة إلى السلايدر الرئيسي.');
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = JSON.stringify(siteState, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'naseem-alataa-site-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify('تم تحميل ملف النسخة الاحتياطية (JSON) بنجاح.');
  };

  const handleImportJson = () => {
    if (!jsonInputText.trim()) return;
    try {
      const parsed = JSON.parse(jsonInputText);
      if (parsed && parsed.company && parsed.categories && parsed.products) {
        setSiteState((prev) => ({ ...prev, ...parsed }));
        setJsonInputText('');
        notify('تم استيراد بيانات الموقع بنجاح وتطبيقها فوراً.');
      } else {
        notify('خطأ: صيغة ملف JSON غير مكتملة.');
      }
    } catch {
      notify('خطأ: كود JSON غير صالح.');
    }
  };

  // Filtered lists
  const uniqueCategorySlugs = Array.from(
    new Set(siteState.categories.map((c) => c.slug).filter((s) => s && s !== 'n-a'))
  );

  const filteredCategories = siteState.categories.filter(
    (c) =>
      c.title.toLowerCase().includes(catSearch.toLowerCase()) ||
      c.titleAr.includes(catSearch) ||
      c.slug.toLowerCase().includes(catSearch.toLowerCase())
  );

  const filteredProducts = siteState.products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(prodSearch.toLowerCase()) ||
      p.titleAr.includes(prodSearch);
    const matchesCat =
      prodCategoryFilter === 'all' || p.categorySlugs.includes(prodCategoryFilter);
    return matchesSearch && matchesCat;
  });

  if (!isAdminAuthenticated) {
    return (
      <AdminLoginGate
        onLoginSuccess={() => {
          loginAdmin();
          notify('مرحباً بك في لوحة تحكم شركة نسيم العطاء التجارية.');
        }}
        onNavigateHome={() => onNavigate('/')}
      />
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar Contract: Breadcrumb on Start, 1-2 Primary Actions on End */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-8">
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <img
            src={siteState.company.logo}
            alt="Logo"
            referrerPolicy="no-referrer"
            className="h-9 w-auto object-contain"
          />
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-900 text-base">
            لوحة تحكم الأدمن الشاملة
          </span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <span className="text-sm text-[#23838B] font-semibold hidden sm:inline">
            {navItems.find((i) => i.key === activeTab)?.label}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {statusNotice && (
            <span
              role="status"
              className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded"
            >
              {statusNotice}
            </span>
          )}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 border border-slate-200 rounded px-2 py-1 text-xs">
            <span className="text-slate-600">لغة الزوار:</span>
            <button
              type="button"
              onClick={() => {
                setLanguage('ar');
                notify('تم تثبيت لغة واجهة الزوار على العربية.');
              }}
              className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                language === 'ar' ? 'bg-[#23838B] text-white' : 'text-slate-700 hover:bg-white'
              }`}
            >
              العربية
            </button>
            <button
              type="button"
              onClick={() => {
                setLanguage('en');
                notify('تم تغيير لغة واجهة الزوار إلى الإنجليزية.');
              }}
              className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                language === 'en' ? 'bg-[#23838B] text-white' : 'text-slate-700 hover:bg-white'
              }`}
            >
              EN
            </button>
          </div>
          <button
            type="button"
            onClick={async () => {
              const ts = publishChanges();
              const ok = await syncNowToCloud();
              if (ok) {
                notify(`تم حفظ ومزامنة التعديلات سحابياً مع جميع الأجهزة بنجاح (${ts}).`);
              } else {
                notify('يرجى ربط حساب Google للأدمن لإتمام المزامنة السحابية مع الأجهزة الأخرى.');
              }
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#BE9C6A] hover:opacity-90 rounded transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
          >
            <i className="fa fa-cloud-upload-alt me-1.5"></i>
            {cloudAdminUser
              ? cloudSyncStatus === 'saving'
                ? 'جاري المزامنة السحابية...'
                : 'مزامنة سحابية لكل الأجهزة (Cloud Sync)'
              : 'تفعيل المزامنة السحابية (Google)'}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#23838B] hover:bg-[#1a666d] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <i className="fa fa-external-link-alt me-1.5"></i>
            معاينة الموقع الحي
          </button>
        </div>
      </header>

      {/* Cloud Sync Banner if not connected with Google Admin */}
      {!cloudAdminUser ? (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-medium">
            <i className="fa fa-exclamation-triangle text-amber-600"></i>
            <span>
              أنت مسجل الدخول محلياً فقط. لكي تظهر المنتجات والتعديلات في <strong>جميع الأجهزة والجوالات الأخرى فوراً</strong>، اضغط على زر ربط حساب Google السحابي:
            </span>
          </div>
          <button
            type="button"
            onClick={async () => {
              const ok = await signInWithGoogleAdmin();
              if (ok) {
                notify('تم تفعيل المزامنة السحابية الفورية مع جميع الأجهزة بنجاح!');
              }
            }}
            className="px-3.5 py-1.5 bg-[#23838B] hover:bg-[#1a666d] text-white font-semibold rounded cursor-pointer shrink-0"
          >
            <i className="fab fa-google me-1.5"></i>
            تفعيل المزامنة السحابية الآن ({cloudAdminUser ? 'متصل' : 'Google'})
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
            <span>
              <strong>المزامنة السحابية الفورية نشطة (Firebase Cloud Firestore):</strong> أي منتج تضيفه أو تعديل تقوم به يظهر تلقائياً وفي نفس اللحظة على جميع الأجهزة والجوالات ({cloudAdminUser.email}).
            </span>
          </div>
          {cloudSyncError && (
            <span className="text-red-700 font-mono text-[11px]">{cloudSyncError}</span>
          )}
        </div>
      )}

      {/* Main Workspace Layout: Sidebar + Content Viewport */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-[300px] bg-white border-b lg:border-b-0 lg:border-e border-slate-200 shrink-0 p-4">
          <nav aria-label="قائمة لوحة التحكم" className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveTab(item.key)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#23838B] text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <i
                      className={`fa ${item.icon} w-4 text-center shrink-0 ${
                        isActive ? 'text-white' : 'text-[#23838B]'
                      }`}
                    ></i>
                    <span>{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-xs font-mono tabular-nums px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-6 pt-5 border-t border-slate-200 space-y-2">
            <button
              type="button"
              onClick={() => setSecurityModalOpen(true)}
              className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <i className="fa fa-key text-[#BE9C6A]"></i>
              <span>إعدادات دخول الأدمن ودليل النشر</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <i className="fa fa-download text-[#23838B]"></i>
              <span>تصدير نسخة احتياطية (JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                logoutAdmin();
              }}
              className="w-full px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <i className="fa fa-sign-out-alt"></i>
              <span>تسجيل الخروج من الأدمن</span>
            </button>
          </div>
        </aside>

        {/* Main Viewport */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    مركز إدارة وتطوير موقع شركة نسيم العطاء التجارية
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    كل تعديل تقوم به هنا ينعكس فوراً وبشكل حي على جميع صفحات الموقع للزوار والعملاء.
                  </p>
                </div>
              </div>

              {/* KPI Metrics Strip */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded border border-slate-200">
                  <div className="text-xs text-slate-500">أقسام المنتجات</div>
                  <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
                    {siteState.categories.length}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('categories')}
                    className="text-xs text-[#23838B] hover:underline mt-2 inline-block cursor-pointer"
                  >
                    إدارة الأقسام &larr;
                  </button>
                </div>

                <div className="bg-white p-4 rounded border border-slate-200">
                  <div className="text-xs text-slate-500">إجمالي المنتجات</div>
                  <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
                    {siteState.products.length}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('products')}
                    className="text-xs text-[#23838B] hover:underline mt-2 inline-block cursor-pointer"
                  >
                    إدارة المنتجات &larr;
                  </button>
                </div>

                <div className="bg-white p-4 rounded border border-slate-200">
                  <div className="text-xs text-slate-500">قطاعات العمل</div>
                  <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
                    {siteState.marketPlaces.length}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('marketplaces')}
                    className="text-xs text-[#23838B] hover:underline mt-2 inline-block cursor-pointer"
                  >
                    إدارة القطاعات &larr;
                  </button>
                </div>

                <div className="bg-white p-4 rounded border border-slate-200">
                  <div className="text-xs text-slate-500">شرائح السلايدر</div>
                  <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
                    {siteState.heroSlides.length}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('hero')}
                    className="text-xs text-[#23838B] hover:underline mt-2 inline-block cursor-pointer"
                  >
                    تعديل السلايدر &larr;
                  </button>
                </div>

                <div className="bg-white p-4 rounded border border-slate-200">
                  <div className="text-xs text-slate-500">الصفحات المخصصة</div>
                  <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
                    {siteState.customPages.length}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('pages')}
                    className="text-xs text-[#23838B] hover:underline mt-2 inline-block cursor-pointer"
                  >
                    إدارة الصفحات &larr;
                  </button>
                </div>

                <div className="bg-white p-4 rounded border border-slate-200">
                  <div className="text-xs text-slate-500">رسائل التواصل</div>
                  <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
                    {siteState.contactMessages.length}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('messages')}
                    className="text-xs text-[#23838B] hover:underline mt-2 inline-block cursor-pointer"
                  >
                    عرض الرسائل ({unreadMessagesCount} جديد) &larr;
                  </button>
                </div>
              </div>

              {/* Quick Jump Modules */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      1. الهوية ومعلومات الاتصال والخريطة
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      تعديل اسم الشركة، الشعار الرسمي، أرقام التواصل، البريد الإلكتروني، العنوان في
                      مكة المكرمة، وروابط شبكات التواصل الاجتماعي.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('company')}
                    className="mt-4 px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 self-start cursor-pointer"
                  >
                    فتح إعدادات الهوية
                  </button>
                </div>

                <div className="bg-white p-5 rounded border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      2. المنتجات والأقسام والقطاعات
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      إضافة منتجات جديدة، رفع صور المنتجات، تعديل الأقسام الـ 15 أو إضافة أقسام
                      جديدة، وربط كل منتج بالقسم المخصص له.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('products')}
                      className="px-4 py-2 text-xs font-semibold bg-[#23838B] text-white rounded hover:bg-[#1a666d] cursor-pointer"
                    >
                      إدارة المنتجات
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('categories')}
                      className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300 rounded hover:bg-slate-200 cursor-pointer"
                    >
                      إدارة الأقسام
                    </button>
                  </div>
                </div>

                <div className="bg-white p-5 rounded border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      3. الألوان، الترتيب، وأدوات المطور
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      تغيير الألوان الأساسية، إعادة ترتيب أقسام الصفحة الرئيسية أو إخفاء أي منها،
                      إضافة CSS مخصص، أو تصدير/استيراد قاعدة البيانات كاملة بصيغة JSON.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('theme')}
                      className="px-4 py-2 text-xs font-semibold bg-[#BE9C6A] text-white rounded hover:opacity-90 cursor-pointer"
                    >
                      تخصيص المظهر والألوان
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('messages')}
                      className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300 rounded hover:bg-slate-200 cursor-pointer"
                    >
                      أدوات المطور
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. COMPANY & CONTACT INFO TAB */}
          {activeTab === 'company' && (
            <div className="bg-white p-6 rounded border border-slate-200 space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  إعدادات الهوية، الشعار، ومعلومات التواصل
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  تظهر هذه البيانات في الشريط العلوي (Top Bar)، الهيدر، صفحة تواصل معنا، والفوتر.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    اسم الشركة (بالعربية)
                  </label>
                  <input
                    type="text"
                    value={siteState.company.nameAr}
                    onChange={(e) =>
                      updateSiteState((prev) => ({
                        ...prev,
                        company: { ...prev.company, nameAr: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    اسم الشركة (بالإنجليزية)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={siteState.company.nameEn}
                    onChange={(e) =>
                      updateSiteState((prev) => ({
                        ...prev,
                        company: { ...prev.company, nameEn: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    اسم حقوق الملكية في الفوتر
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={siteState.company.nameFooter}
                    onChange={(e) =>
                      updateSiteState((prev) => ({
                        ...prev,
                        company: { ...prev.company, nameFooter: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    العنوان الرسمي
                  </label>
                  <input
                    type="text"
                    value={siteState.company.addressAr}
                    onChange={(e) =>
                      updateSiteState((prev) => ({
                        ...prev,
                        company: { ...prev.company, addressAr: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    البريد الإلكتروني الرسمي
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={siteState.company.email}
                    onChange={(e) =>
                      updateSiteState((prev) => ({
                        ...prev,
                        company: { ...prev.company, email: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    رقم الهاتف / الجوال
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={siteState.company.phone}
                    onChange={(e) =>
                      updateSiteState((prev) => ({
                        ...prev,
                        company: { ...prev.company, phone: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <ImageInputField
                  label="الشعار الرئيسي في الهيدر والفوتر (Logo)"
                  value={siteState.company.logo}
                  onChange={(url) =>
                    updateSiteState((prev) => ({
                      ...prev,
                      company: { ...prev.company, logo: url },
                    }))
                  }
                />

                <ImageInputField
                  label="شعار البروفايل الافتراضي للأقسام (Profile Logo)"
                  value={siteState.company.profileLogo}
                  onChange={(url) =>
                    updateSiteState((prev) => ({
                      ...prev,
                      company: { ...prev.company, profileLogo: url },
                    }))
                  }
                />
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رابط خريطة قوقل التفاعلية (Google Maps Embed URL) في صفحة تواصل معنا
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={siteState.company.mapEmbedUrl}
                  onChange={(e) =>
                    updateSiteState((prev) => ({
                      ...prev,
                      company: { ...prev.company, mapEmbedUrl: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-bold text-slate-800 mb-3">
                  روابط شبكات التواصل الاجتماعي
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {(
                    ['facebook', 'twitter', 'linkedin', 'instagram', 'youtube'] as Array<
                      keyof typeof siteState.company.socialLinks
                    >
                  ).map((net) => (
                    <div key={net}>
                      <label className="block text-xs font-semibold text-slate-600 capitalize mb-1">
                        {net}
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={siteState.company.socialLinks[net]}
                        onChange={(e) =>
                          updateSiteState((prev) => ({
                            ...prev,
                            company: {
                              ...prev.company,
                              socialLinks: {
                                ...prev.company.socialLinks,
                                [net]: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. THEME & LAYOUT TAB */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded border border-slate-200 space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-lg font-bold text-slate-900">
                    الألوان، الخلفيات، وخيارات العرض
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    تغيير الألوان ينعكس لحظياً على كامل الموقع بدون إعادة تحميل.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3 border border-slate-200 rounded bg-slate-50">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      اللون الأساسي (Primary Teal)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={siteState.theme.primaryColor}
                        onChange={(e) =>
                          updateSiteState((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, primaryColor: e.target.value },
                          }))
                        }
                        className="w-10 h-9 rounded cursor-pointer border border-slate-300"
                      />
                      <input
                        type="text"
                        dir="ltr"
                        value={siteState.theme.primaryColor}
                        onChange={(e) =>
                          updateSiteState((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, primaryColor: e.target.value },
                          }))
                        }
                        className="flex-1 px-2 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                      />
                    </div>
                  </div>

                  <div className="p-3 border border-slate-200 rounded bg-slate-50">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      اللون الذهبي للعناوين (Secondary Gold)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={siteState.theme.secondaryColor}
                        onChange={(e) =>
                          updateSiteState((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, secondaryColor: e.target.value },
                          }))
                        }
                        className="w-10 h-9 rounded cursor-pointer border border-slate-300"
                      />
                      <input
                        type="text"
                        dir="ltr"
                        value={siteState.theme.secondaryColor}
                        onChange={(e) =>
                          updateSiteState((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, secondaryColor: e.target.value },
                          }))
                        }
                        className="flex-1 px-2 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                      />
                    </div>
                  </div>

                  <div className="p-3 border border-slate-200 rounded bg-slate-50">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      لون خلفية الأقسام الفاتحة (Light Bg)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={siteState.theme.lightBgColor}
                        onChange={(e) =>
                          updateSiteState((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, lightBgColor: e.target.value },
                          }))
                        }
                        className="w-10 h-9 rounded cursor-pointer border border-slate-300"
                      />
                      <input
                        type="text"
                        dir="ltr"
                        value={siteState.theme.lightBgColor}
                        onChange={(e) =>
                          updateSiteState((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, lightBgColor: e.target.value },
                          }))
                        }
                        className="flex-1 px-2 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                      />
                    </div>
                  </div>

                  <div className="p-3 border border-slate-200 rounded bg-slate-50">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      لون خلفية الفوتر الداكن (Footer Bg)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={siteState.theme.darkFooterColor}
                        onChange={(e) =>
                          updateSiteState((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, darkFooterColor: e.target.value },
                          }))
                        }
                        className="w-10 h-9 rounded cursor-pointer border border-slate-300"
                      />
                      <input
                        type="text"
                        dir="ltr"
                        value={siteState.theme.darkFooterColor}
                        onChange={(e) =>
                          updateSiteState((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, darkFooterColor: e.target.value },
                          }))
                        }
                        className="flex-1 px-2 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      عرض الشعار بالبكسل (Logo Width px)
                    </label>
                    <input
                      type="number"
                      min={120}
                      max={500}
                      value={siteState.theme.logoWidthPx}
                      onChange={(e) =>
                        updateSiteState((prev) => ({
                          ...prev,
                          theme: {
                            ...prev.theme,
                            logoWidthPx: Number(e.target.value) || 350,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded tabular-nums"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-5">
                    <input
                      id="toggle_topbar"
                      type="checkbox"
                      checked={siteState.theme.showTopBar}
                      onChange={(e) =>
                        updateSiteState((prev) => ({
                          ...prev,
                          theme: { ...prev.theme, showTopBar: e.target.checked },
                        }))
                      }
                      className="w-4 h-4"
                    />
                    <label htmlFor="toggle_topbar" className="text-sm font-medium text-slate-700">
                      إظهار الشريط العلوي (Top Bar)
                    </label>
                  </div>

                  <div className="flex items-center gap-3 pt-5">
                    <input
                      id="toggle_backtotop"
                      type="checkbox"
                      checked={siteState.theme.showBackToTop}
                      onChange={(e) =>
                        updateSiteState((prev) => ({
                          ...prev,
                          theme: { ...prev.theme, showBackToTop: e.target.checked },
                        }))
                      }
                      className="w-4 h-4"
                    />
                    <label
                      htmlFor="toggle_backtotop"
                      className="text-sm font-medium text-slate-700"
                    >
                      إظهار زر الصعود للأعلى (Back to Top)
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <ImageInputField
                    label="صورة النقش الخلفي للأقسام (bg-icon)"
                    value={siteState.theme.bgIconUrl}
                    onChange={(url) =>
                      updateSiteState((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, bgIconUrl: url },
                      }))
                    }
                  />

                  <ImageInputField
                    label="صورة خلفية ترويسة الصفحات الفرعية (Page Header)"
                    value={siteState.theme.pageHeaderBgUrl}
                    onChange={(url) =>
                      updateSiteState((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, pageHeaderBgUrl: url },
                      }))
                    }
                  />
                </div>
              </div>

              {/* Home Page Sections Order & Visibility */}
              <div className="bg-white p-6 rounded border border-slate-200 space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  ترتيب وإظهار/إخفاء أقسام الصفحة الرئيسية
                </h3>
                <p className="text-xs text-slate-500">
                  يمكنك تقديم أو تأخير أي قسم في الصفحة الرئيسية أو إخفاؤه مؤقتاً بضغطة زر.
                </p>

                <div className="divide-y divide-slate-200 border border-slate-200 rounded">
                  {siteState.theme.homeSectionsOrder.map((secKey, idx) => {
                    const isHidden = siteState.theme.hiddenHomeSections.includes(secKey);
                    return (
                      <div
                        key={secKey}
                        className="flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-400 tabular-nums">
                            0{idx + 1}
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              isHidden ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {HOME_SECTION_LABELS[secKey]}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateSiteState((prev) => ({
                                ...prev,
                                theme: {
                                  ...prev.theme,
                                  hiddenHomeSections: isHidden
                                    ? prev.theme.hiddenHomeSections.filter((k) => k !== secKey)
                                    : [...prev.theme.hiddenHomeSections, secKey],
                                },
                              }))
                            }
                            className={`px-3 py-1 text-xs font-medium rounded border cursor-pointer ${
                              isHidden
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {isHidden ? 'مخفي (إظهار)' : 'ظاهر (إخفاء)'}
                          </button>

                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() =>
                              updateSiteState((prev) => ({
                                ...prev,
                                theme: {
                                  ...prev.theme,
                                  homeSectionsOrder: moveArrayItem(
                                    prev.theme.homeSectionsOrder,
                                    idx,
                                    'up'
                                  ),
                                },
                              }))
                            }
                            aria-label="تحريك لأعلى"
                            className="p-1.5 text-xs border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                          >
                            <i className="fa fa-arrow-up"></i>
                          </button>

                          <button
                            type="button"
                            disabled={idx === siteState.theme.homeSectionsOrder.length - 1}
                            onClick={() =>
                              updateSiteState((prev) => ({
                                ...prev,
                                theme: {
                                  ...prev.theme,
                                  homeSectionsOrder: moveArrayItem(
                                    prev.theme.homeSectionsOrder,
                                    idx,
                                    'down'
                                  ),
                                },
                              }))
                            }
                            aria-label="تحريك لأسفل"
                            className="p-1.5 text-xs border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                          >
                            <i className="fa fa-arrow-down"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 4. HERO SLIDES TAB */}
          {activeTab === 'hero' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white p-5 rounded border border-slate-200">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    إدارة شرائح السلايدر الرئيسي (Hero Carousel)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    تحكم في صور السلايدر، العناوين بجميع اللغات، وروابط الأزرار.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddHeroSlide}
                  className="px-4 py-2 text-xs font-semibold bg-[#23838B] text-white rounded hover:bg-[#1a666d] cursor-pointer"
                >
                  <i className="fa fa-plus me-1.5"></i>
                  إضافة شريحة جديدة
                </button>
              </div>

              <div className="space-y-4">
                {siteState.heroSlides.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className="bg-white p-6 rounded border border-slate-200 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="text-sm font-bold text-slate-800">
                        الشريحة #{idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() =>
                            updateSiteState((prev) => ({
                              ...prev,
                              heroSlides: moveArrayItem(prev.heroSlides, idx, 'up'),
                            }))
                          }
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                        >
                          <i className="fa fa-arrow-up"></i>
                        </button>
                        <button
                          type="button"
                          disabled={idx === siteState.heroSlides.length - 1}
                          onClick={() =>
                            updateSiteState((prev) => ({
                              ...prev,
                              heroSlides: moveArrayItem(prev.heroSlides, idx, 'down'),
                            }))
                          }
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                        >
                          <i className="fa fa-arrow-down"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateSiteState((prev) => ({
                              ...prev,
                              heroSlides: prev.heroSlides.filter((s) => s.id !== slide.id),
                            }))
                          }
                          className="px-3 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 cursor-pointer"
                        >
                          حذف الشريحة
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          العنوان الرئيسي (بالعربية)
                        </label>
                        <input
                          type="text"
                          value={slide.title.ar}
                          onChange={(e) =>
                            updateSiteState((prev) => ({
                              ...prev,
                              heroSlides: prev.heroSlides.map((s) =>
                                s.id === slide.id
                                  ? { ...s, title: { ...s.title, ar: e.target.value } }
                                  : s
                              ),
                            }))
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          العنوان الرئيسي (بالإنجليزية)
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={slide.title.en}
                          onChange={(e) =>
                            updateSiteState((prev) => ({
                              ...prev,
                              heroSlides: prev.heroSlides.map((s) =>
                                s.id === slide.id
                                  ? { ...s, title: { ...s.title, en: e.target.value } }
                                  : s
                              ),
                            }))
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          العنوان الرئيسي (بالأردية - UR)
                        </label>
                        <input
                          type="text"
                          value={slide.title.ur}
                          onChange={(e) =>
                            updateSiteState((prev) => ({
                              ...prev,
                              heroSlides: prev.heroSlides.map((s) =>
                                s.id === slide.id
                                  ? { ...s, title: { ...s.title, ur: e.target.value } }
                                  : s
                              ),
                            }))
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          العنوان الرئيسي (بالهندية - HI)
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={slide.title.hi}
                          onChange={(e) =>
                            updateSiteState((prev) => ({
                              ...prev,
                              heroSlides: prev.heroSlides.map((s) =>
                                s.id === slide.id
                                  ? { ...s, title: { ...s.title, hi: e.target.value } }
                                  : s
                              ),
                            }))
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                        />
                      </div>
                    </div>

                    {/* Hero Buttons & Links */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          نص الزر الأول (عربي - اختياري)
                        </label>
                        <input
                          type="text"
                          value={slide.primaryBtnText?.ar || ''}
                          onChange={(e) =>
                            updateSiteState((prev) => ({
                              ...prev,
                              heroSlides: prev.heroSlides.map((s) =>
                                s.id === slide.id
                                  ? {
                                      ...s,
                                      primaryBtnText: {
                                        en: s.primaryBtnText?.en || 'Products',
                                        ar: e.target.value,
                                        ur: s.primaryBtnText?.ur || 'مصنوعات',
                                        hi: s.primaryBtnText?.hi || 'उत्पाद',
                                      },
                                    }
                                  : s
                              ),
                            }))
                          }
                          placeholder="الافتراضي: المنتجات"
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          نص الزر الأول (إنجليزي - اختياري)
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={slide.primaryBtnText?.en || ''}
                          onChange={(e) =>
                            updateSiteState((prev) => ({
                              ...prev,
                              heroSlides: prev.heroSlides.map((s) =>
                                s.id === slide.id
                                  ? {
                                      ...s,
                                      primaryBtnText: {
                                        en: e.target.value,
                                        ar: s.primaryBtnText?.ar || 'المنتجات',
                                        ur: s.primaryBtnText?.ur || 'مصنوعات',
                                        hi: s.primaryBtnText?.hi || 'उत्पाद',
                                      },
                                    }
                                  : s
                              ),
                            }))
                          }
                          placeholder="Default: Products"
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          رابط الزر الأول (Link)
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={slide.primaryBtnLink}
                          onChange={(e) =>
                            updateSiteState((prev) => ({
                              ...prev,
                              heroSlides: prev.heroSlides.map((s) =>
                                s.id === slide.id ? { ...s, primaryBtnLink: e.target.value } : s
                              ),
                            }))
                          }
                          className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          نص الزر الثاني (عربي - اختياري)
                        </label>
                        <input
                          type="text"
                          value={slide.secondaryBtnText?.ar || ''}
                          onChange={(e) =>
                            updateSiteState((prev) => ({
                              ...prev,
                              heroSlides: prev.heroSlides.map((s) =>
                                s.id === slide.id
                                  ? {
                                      ...s,
                                      secondaryBtnText: {
                                        en: s.secondaryBtnText?.en || 'Categories',
                                        ar: e.target.value,
                                        ur: s.secondaryBtnText?.ur || 'زمرے',
                                        hi: s.secondaryBtnText?.hi || 'श्रेणियाँ',
                                      },
                                    }
                                  : s
                              ),
                            }))
                          }
                          placeholder="الافتراضي: الأقسام"
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          نص الزر الثاني (إنجليزي - اختياري)
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={slide.secondaryBtnText?.en || ''}
                          onChange={(e) =>
                            updateSiteState((prev) => ({
                              ...prev,
                              heroSlides: prev.heroSlides.map((s) =>
                                s.id === slide.id
                                  ? {
                                      ...s,
                                      secondaryBtnText: {
                                        en: e.target.value,
                                        ar: s.secondaryBtnText?.ar || 'الأقسام',
                                        ur: s.secondaryBtnText?.ur || 'زمرے',
                                        hi: s.secondaryBtnText?.hi || 'श्रेणियाँ',
                                      },
                                    }
                                  : s
                              ),
                            }))
                          }
                          placeholder="Default: Categories"
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          رابط الزر الثاني (Link)
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={slide.secondaryBtnLink}
                          onChange={(e) =>
                            updateSiteState((prev) => ({
                              ...prev,
                              heroSlides: prev.heroSlides.map((s) =>
                                s.id === slide.id ? { ...s, secondaryBtnLink: e.target.value } : s
                              ),
                            }))
                          }
                          className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded"
                        />
                      </div>
                    </div>

                    <ImageInputField
                      label="صورة خلفية الشريحة"
                      value={slide.image}
                      onChange={(url) =>
                        updateSiteState((prev) => ({
                          ...prev,
                          heroSlides: prev.heroSlides.map((s) =>
                            s.id === slide.id ? { ...s, image: url } : s
                          ),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. ABOUT US (HOME + FULL PAGE) TAB */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              {/* Home About Section */}
              <div className="bg-white p-6 rounded border border-slate-200 space-y-5">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">
                  أولاً: قسم النبذة التعريفية في الصفحة الرئيسية (Home About)
                </h2>

                <ImageInputField
                  label="صورة قسم النبذة في الرئيسية"
                  value={siteState.homeAbout.image}
                  onChange={(url) =>
                    updateSiteState((prev) => ({
                      ...prev,
                      homeAbout: { ...prev.homeAbout, image: url },
                    }))
                  }
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      عنوان النبذة (عربي)
                    </label>
                    <input
                      type="text"
                      value={siteState.homeAbout.heading.ar}
                      onChange={(e) =>
                        updateSiteState((prev) => ({
                          ...prev,
                          homeAbout: {
                            ...prev.homeAbout,
                            heading: { ...prev.homeAbout.heading, ar: e.target.value },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      عنوان النبذة (إنجليزي)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={siteState.homeAbout.heading.en}
                      onChange={(e) =>
                        updateSiteState((prev) => ({
                          ...prev,
                          homeAbout: {
                            ...prev.homeAbout,
                            heading: { ...prev.homeAbout.heading, en: e.target.value },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      النص الوصفي (عربي)
                    </label>
                    <textarea
                      rows={4}
                      value={siteState.homeAbout.description.ar}
                      onChange={(e) =>
                        updateSiteState((prev) => ({
                          ...prev,
                          homeAbout: {
                            ...prev.homeAbout,
                            description: { ...prev.homeAbout.description, ar: e.target.value },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      النص الوصفي (إنجليزي)
                    </label>
                    <textarea
                      rows={4}
                      dir="ltr"
                      value={siteState.homeAbout.description.en}
                      onChange={(e) =>
                        updateSiteState((prev) => ({
                          ...prev,
                          homeAbout: {
                            ...prev.homeAbout,
                            description: { ...prev.homeAbout.description, en: e.target.value },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      النقاط المميزة بالعربية (كل سطر نقطة)
                    </label>
                    <textarea
                      rows={5}
                      value={siteState.homeAbout.bullets.ar.join('\n')}
                      onChange={(e) =>
                        updateSiteState((prev) => ({
                          ...prev,
                          homeAbout: {
                            ...prev.homeAbout,
                            bullets: {
                              ...prev.homeAbout.bullets,
                              ar: e.target.value.split('\n'),
                            },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      النقاط المميزة بالإنجليزية (كل سطر نقطة)
                    </label>
                    <textarea
                      rows={5}
                      dir="ltr"
                      value={siteState.homeAbout.bullets.en.join('\n')}
                      onChange={(e) =>
                        updateSiteState((prev) => ({
                          ...prev,
                          homeAbout: {
                            ...prev.homeAbout,
                            bullets: {
                              ...prev.homeAbout.bullets,
                              en: e.target.value.split('\n'),
                            },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Full About Us Page Editor */}
              <div className="bg-white p-6 rounded border border-slate-200 space-y-5">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">
                  ثانياً: محتوى صفحة "من نحن" الكاملة (/about-us)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      العنوان الرئيسي في الصفحة
                    </label>
                    <input
                      type="text"
                      value={siteState.aboutPage.companyBannerTitle}
                      onChange={(e) =>
                        updateSiteState((prev) => ({
                          ...prev,
                          aboutPage: {
                            ...prev.aboutPage,
                            companyBannerTitle: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      العنوان الفرعي الترحيبي
                    </label>
                    <input
                      type="text"
                      value={siteState.aboutPage.companyBannerSubtitle}
                      onChange={(e) =>
                        updateSiteState((prev) => ({
                          ...prev,
                          aboutPage: {
                            ...prev.aboutPage,
                            companyBannerSubtitle: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    فقرات "من نحن؟" (كل سطر فقرة مستقلة)
                  </label>
                  <textarea
                    rows={5}
                    value={siteState.aboutPage.whoWeAreParagraphs.join('\n')}
                    onChange={(e) =>
                      updateSiteState((prev) => ({
                        ...prev,
                        aboutPage: {
                          ...prev.aboutPage,
                          whoWeAreParagraphs: e.target.value.split('\n'),
                        },
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      نص الرؤية (رؤيتنا)
                    </label>
                    <textarea
                      rows={3}
                      value={siteState.aboutPage.visionText}
                      onChange={(e) =>
                        updateSiteState((prev) => ({
                          ...prev,
                          aboutPage: { ...prev.aboutPage, visionText: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      نص الرسالة (مهمتنا)
                    </label>
                    <textarea
                      rows={3}
                      value={siteState.aboutPage.missionText}
                      onChange={(e) =>
                        updateSiteState((prev) => ({
                          ...prev,
                          aboutPage: { ...prev.aboutPage, missionText: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      قائمة القيم المؤسسية (كل سطر قيمة)
                    </label>
                    <textarea
                      rows={6}
                      value={siteState.aboutPage.valuesList.join('\n')}
                      onChange={(e) =>
                        updateSiteState((prev) => ({
                          ...prev,
                          aboutPage: {
                            ...prev.aboutPage,
                            valuesList: e.target.value.split('\n'),
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      قائمة الأهداف (كل سطر هدف)
                    </label>
                    <textarea
                      rows={6}
                      dir="ltr"
                      value={siteState.aboutPage.objectivesList.join('\n')}
                      onChange={(e) =>
                        updateSiteState((prev) => ({
                          ...prev,
                          aboutPage: {
                            ...prev.aboutPage,
                            objectivesList: e.target.value.split('\n'),
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>
                </div>

                {/* Areas of Work Table Editor */}
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">
                      جدول مجالات العمل (Our Areas of Work)
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        const nextNo = String(siteState.aboutPage.areasTable.length + 1);
                        const newRow: WorkAreaRow = {
                          id: `area-${Date.now()}`,
                          no: nextNo,
                          area: 'New Area',
                          areaAr: 'مجال عمل جديد',
                          description: 'Description',
                          descriptionAr: 'وصف مجال العمل',
                        };
                        updateSiteState((prev) => ({
                          ...prev,
                          aboutPage: {
                            ...prev.aboutPage,
                            areasTable: [...prev.aboutPage.areasTable, newRow],
                          },
                        }));
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-[#23838B] text-white rounded cursor-pointer"
                    >
                      + إضافة صف للمجالات
                    </button>
                  </div>

                  <div className="space-y-3">
                    {siteState.aboutPage.areasTable.map((row) => (
                      <div
                        key={row.id}
                        className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                          <input
                            type="text"
                            value={row.no}
                            onChange={(e) =>
                              updateSiteState((prev) => ({
                                ...prev,
                                aboutPage: {
                                  ...prev.aboutPage,
                                  areasTable: prev.aboutPage.areasTable.map((r) =>
                                    r.id === row.id ? { ...r, no: e.target.value } : r
                                  ),
                                },
                              }))
                            }
                            placeholder="#"
                            className="md:col-span-1 px-2 py-1.5 text-xs border border-slate-300 rounded bg-white text-center"
                          />
                          <input
                            type="text"
                            value={row.areaAr}
                            onChange={(e) =>
                              updateSiteState((prev) => ({
                                ...prev,
                                aboutPage: {
                                  ...prev.aboutPage,
                                  areasTable: prev.aboutPage.areasTable.map((r) =>
                                    r.id === row.id ? { ...r, areaAr: e.target.value } : r
                                  ),
                                },
                              }))
                            }
                            placeholder="مجال العمل (عربي)"
                            className="md:col-span-4 px-2 py-1.5 text-xs border border-slate-300 rounded bg-white"
                          />
                          <input
                            type="text"
                            value={row.descriptionAr}
                            onChange={(e) =>
                              updateSiteState((prev) => ({
                                ...prev,
                                aboutPage: {
                                  ...prev.aboutPage,
                                  areasTable: prev.aboutPage.areasTable.map((r) =>
                                    r.id === row.id ? { ...r, descriptionAr: e.target.value } : r
                                  ),
                                },
                              }))
                            }
                            placeholder="الوصف (عربي)"
                            className="md:col-span-6 px-2 py-1.5 text-xs border border-slate-300 rounded bg-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateSiteState((prev) => ({
                                ...prev,
                                aboutPage: {
                                  ...prev.aboutPage,
                                  areasTable: prev.aboutPage.areasTable.filter(
                                    (r) => r.id !== row.id
                                  ),
                                },
                              }))
                            }
                            className="md:col-span-1 text-xs text-red-600 hover:underline cursor-pointer"
                          >
                            حذف
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                          <span className="md:col-span-1 text-[10px] font-mono text-slate-400 text-center">
                            EN
                          </span>
                          <input
                            type="text"
                            dir="ltr"
                            value={row.area}
                            onChange={(e) =>
                              updateSiteState((prev) => ({
                                ...prev,
                                aboutPage: {
                                  ...prev.aboutPage,
                                  areasTable: prev.aboutPage.areasTable.map((r) =>
                                    r.id === row.id ? { ...r, area: e.target.value } : r
                                  ),
                                },
                              }))
                            }
                            placeholder="Area (EN)"
                            className="md:col-span-4 px-2 py-1.5 text-xs border border-slate-300 rounded bg-white"
                          />
                          <input
                            type="text"
                            dir="ltr"
                            value={row.description}
                            onChange={(e) =>
                              updateSiteState((prev) => ({
                                ...prev,
                                aboutPage: {
                                  ...prev.aboutPage,
                                  areasTable: prev.aboutPage.areasTable.map((r) =>
                                    r.id === row.id ? { ...r, description: e.target.value } : r
                                  ),
                                },
                              }))
                            }
                            placeholder="Description (EN)"
                            className="md:col-span-7 px-2 py-1.5 text-xs border border-slate-300 rounded bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Our Services Groups Editor */}
                <div className="border-t border-slate-200 pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        مجموعات الخدمات التفصيلية (Our Services Groups)
                      </h3>
                      <p className="text-xs text-slate-500">
                        تظهر في النصف السفلي من صفحة "من نحن" (/about-us).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newGroup = {
                          id: `sg-${Date.now()}`,
                          heading: `${siteState.aboutPage.serviceGroups.length + 1}. New Service Group`,
                          headingAr: `${siteState.aboutPage.serviceGroups.length + 1}. مجموعة خدمات جديدة`,
                          items: ['Service item 1'],
                          itemsAr: ['خدمة رقم 1'],
                        };
                        updateSiteState((prev) => ({
                          ...prev,
                          aboutPage: {
                            ...prev.aboutPage,
                            serviceGroups: [...prev.aboutPage.serviceGroups, newGroup],
                          },
                        }));
                        notify('تمت إضافة مجموعة خدمات جديدة.');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-[#23838B] text-white rounded cursor-pointer"
                    >
                      + إضافة مجموعة خدمات
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        عنوان قسم الخدمات
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={siteState.aboutPage.servicesHeading}
                        onChange={(e) =>
                          updateSiteState((prev) => ({
                            ...prev,
                            aboutPage: {
                              ...prev.aboutPage,
                              servicesHeading: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        مقدمة قسم الخدمات
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={siteState.aboutPage.servicesIntro}
                        onChange={(e) =>
                          updateSiteState((prev) => ({
                            ...prev,
                            aboutPage: {
                              ...prev.aboutPage,
                              servicesIntro: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {siteState.aboutPage.serviceGroups.map((group) => (
                      <div
                        key={group.id}
                        className="p-4 bg-slate-50 rounded border border-slate-200 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1">
                            <input
                              type="text"
                              value={group.headingAr}
                              onChange={(e) =>
                                updateSiteState((prev) => ({
                                  ...prev,
                                  aboutPage: {
                                    ...prev.aboutPage,
                                    serviceGroups: prev.aboutPage.serviceGroups.map((g) =>
                                      g.id === group.id ? { ...g, headingAr: e.target.value } : g
                                    ),
                                  },
                                }))
                              }
                              placeholder="عنوان المجموعة (عربي)"
                              className="px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded bg-white"
                            />
                            <input
                              type="text"
                              dir="ltr"
                              value={group.heading}
                              onChange={(e) =>
                                updateSiteState((prev) => ({
                                  ...prev,
                                  aboutPage: {
                                    ...prev.aboutPage,
                                    serviceGroups: prev.aboutPage.serviceGroups.map((g) =>
                                      g.id === group.id ? { ...g, heading: e.target.value } : g
                                    ),
                                  },
                                }))
                              }
                              placeholder="Group Heading (EN)"
                              className="px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded bg-white"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              updateSiteState((prev) => ({
                                ...prev,
                                aboutPage: {
                                  ...prev.aboutPage,
                                  serviceGroups: prev.aboutPage.serviceGroups.filter(
                                    (g) => g.id !== group.id
                                  ),
                                },
                              }))
                            }
                            className="px-2.5 py-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded cursor-pointer"
                          >
                            حذف المجموعة
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">
                              عناصر الخدمة بالعربية (كل سطر عنصر)
                            </label>
                            <textarea
                              rows={3}
                              value={group.itemsAr.join('\n')}
                              onChange={(e) =>
                                updateSiteState((prev) => ({
                                  ...prev,
                                  aboutPage: {
                                    ...prev.aboutPage,
                                    serviceGroups: prev.aboutPage.serviceGroups.map((g) =>
                                      g.id === group.id
                                        ? { ...g, itemsAr: e.target.value.split('\n') }
                                        : g
                                    ),
                                  },
                                }))
                              }
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">
                              عناصر الخدمة بالإنجليزية (كل سطر عنصر)
                            </label>
                            <textarea
                              rows={3}
                              dir="ltr"
                              value={group.items.join('\n')}
                              onChange={(e) =>
                                updateSiteState((prev) => ({
                                  ...prev,
                                  aboutPage: {
                                    ...prev.aboutPage,
                                    serviceGroups: prev.aboutPage.serviceGroups.map((g) =>
                                      g.id === group.id
                                        ? { ...g, items: e.target.value.split('\n') }
                                        : g
                                    ),
                                  },
                                }))
                              }
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. CATEGORIES MANAGEMENT TAB */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Add New Category Card */}
              <form
                onSubmit={handleAddCategory}
                className="bg-white p-6 rounded border border-slate-200 space-y-4"
              >
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3">
                  إضافة قسم منتجات جديد
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="new_cat_title_ar"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      اسم القسم (بالعربية)
                    </label>
                    <input
                      id="new_cat_title_ar"
                      type="text"
                      required
                      value={newCategory.titleAr}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, titleAr: e.target.value })
                      }
                      placeholder="مثال: التمور الفاخرة"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new_cat_title_en"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      اسم القسم (بالإنجليزية)
                    </label>
                    <input
                      id="new_cat_title_en"
                      type="text"
                      dir="ltr"
                      value={newCategory.title}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, title: e.target.value })
                      }
                      placeholder="e.g. Premium Dates"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new_cat_slug"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      الرابط الفرعي (Slug - اختياري)
                    </label>
                    <input
                      id="new_cat_slug"
                      type="text"
                      dir="ltr"
                      value={newCategory.slug}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, slug: e.target.value })
                      }
                      placeholder="premium-dates"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      وصف القسم (بالعربية)
                    </label>
                    <textarea
                      rows={2}
                      value={newCategory.descriptionAr}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, descriptionAr: e.target.value })
                      }
                      placeholder="وصف مختصر يظهر تحت اسم القسم..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      وصف القسم (بالإنجليزية)
                    </label>
                    <textarea
                      rows={2}
                      dir="ltr"
                      value={newCategory.description}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, description: e.target.value })
                      }
                      placeholder="Category description..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(newCategory.highlightYellow)}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, highlightYellow: e.target.checked })
                      }
                    />
                    <span>تمييز خلفية الوصف باللون الأصفر (مثل قسم الأجبان في الموقع الأصلي)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(newCategory.isRtlDescription)}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, isRtlDescription: e.target.checked })
                      }
                    />
                    <span>محاذاة الوصف من اليمين لليسار دائماً (RTL)</span>
                  </label>
                </div>

                <ImageInputField
                  label="صورة / أيقونة القسم"
                  value={newCategory.image}
                  onChange={(url) => setNewCategory({ ...newCategory, image: url })}
                />

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-semibold bg-[#23838B] hover:bg-[#1a666d] text-white rounded transition-colors cursor-pointer"
                  >
                    <i className="fa fa-plus me-1.5"></i>
                    إضافة القسم للموقع
                  </button>
                </div>
              </form>

              {/* Edit Category Modal / Drawer Inline */}
              {editingCategory && (
                <form
                  onSubmit={handleSaveCategoryEdit}
                  className="bg-amber-50/70 p-6 rounded border-2 border-[#BE9C6A] space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                    <h3 className="text-base font-bold text-slate-900">
                      تعديل القسم: {editingCategory.titleAr}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      إلغاء التعديل
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        الاسم بالعربية
                      </label>
                      <input
                        type="text"
                        value={editingCategory.titleAr}
                        onChange={(e) =>
                          setEditingCategory({ ...editingCategory, titleAr: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        الاسم بالإنجليزية
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={editingCategory.title}
                        onChange={(e) =>
                          setEditingCategory({ ...editingCategory, title: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        الرابط (Slug)
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={editingCategory.slug}
                        onChange={(e) =>
                          setEditingCategory({ ...editingCategory, slug: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        الوصف بالعربية
                      </label>
                      <textarea
                        rows={2}
                        value={editingCategory.descriptionAr}
                        onChange={(e) =>
                          setEditingCategory({
                            ...editingCategory,
                            descriptionAr: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        الوصف بالإنجليزية
                      </label>
                      <textarea
                        rows={2}
                        dir="ltr"
                        value={editingCategory.description}
                        onChange={(e) =>
                          setEditingCategory({
                            ...editingCategory,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={Boolean(editingCategory.highlightYellow)}
                        onChange={(e) =>
                          setEditingCategory({
                            ...editingCategory,
                            highlightYellow: e.target.checked,
                          })
                        }
                      />
                      <span>تمييز خلفية الوصف باللون الأصفر</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={Boolean(editingCategory.isRtlDescription)}
                        onChange={(e) =>
                          setEditingCategory({
                            ...editingCategory,
                            isRtlDescription: e.target.checked,
                          })
                        }
                      />
                      <span>محاذاة الوصف من اليمين لليسار (RTL)</span>
                    </label>
                  </div>

                  <ImageInputField
                    label="صورة القسم"
                    value={editingCategory.image}
                    onChange={(url) => setEditingCategory({ ...editingCategory, image: url })}
                  />

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-semibold bg-[#23838B] text-white rounded cursor-pointer"
                    >
                      حفظ تعديلات بيانات القسم
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate(`/${editingCategory.slug}`)}
                      className="px-4 py-2 text-xs font-semibold text-[#23838B] bg-white border border-[#23838B] rounded cursor-pointer"
                    >
                      معاينة القسم في الموقع &larr;
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="px-4 py-2 text-xs font-medium bg-white border border-slate-300 rounded cursor-pointer"
                    >
                      إغلاق
                    </button>
                  </div>

                  {/* Direct In-Category Product Management Box */}
                  <div className="mt-6 pt-5 border-t-2 border-amber-200 bg-white p-4 rounded space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">
                        المنتجات داخل قسم "{editingCategory.titleAr}" (
                        {
                          getProductsByCategorySlug(
                            editingCategory.slug,
                            siteState.products,
                            siteState.categories
                          ).length
                        }
                        ) — أضف منتجاً جديداً هنا مباشرة:
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={inCatProduct.titleAr}
                        onChange={(e) =>
                          setInCatProduct({ ...inCatProduct, titleAr: e.target.value })
                        }
                        placeholder="اسم المنتج بالعربية *"
                        className="px-3 py-2 text-xs border border-slate-300 rounded"
                      />
                      <input
                        type="text"
                        dir="ltr"
                        value={inCatProduct.title}
                        onChange={(e) =>
                          setInCatProduct({ ...inCatProduct, title: e.target.value })
                        }
                        placeholder="Product Name (EN - Optional)"
                        className="px-3 py-2 text-xs border border-slate-300 rounded"
                      />
                      <input
                        type="text"
                        value={inCatProduct.price}
                        onChange={(e) =>
                          setInCatProduct({ ...inCatProduct, price: e.target.value })
                        }
                        placeholder="السعر (اختياري - مثال: 120 ر.س)"
                        className="px-3 py-2 text-xs border border-slate-300 rounded"
                      />
                    </div>

                    <ImageInputField
                      label="صورة المنتج الجديد داخل هذا القسم"
                      value={inCatProduct.image}
                      onChange={(url) => setInCatProduct({ ...inCatProduct, image: url })}
                    />

                    <div>
                      <button
                        type="button"
                        onClick={() => handleAddProductInsideCategoryModal(editingCategory)}
                        className="px-4 py-2 text-xs font-semibold bg-[#23838B] hover:bg-[#1a666d] text-white rounded cursor-pointer"
                      >
                        <i className="fa fa-plus me-1.5"></i>
                        إضافة المنتج فوراً داخل قسم "{editingCategory.titleAr}"
                      </button>
                    </div>

                    {/* List of products currently in this category */}
                    <div className="pt-2">
                      {getProductsByCategorySlug(
                        editingCategory.slug,
                        siteState.products,
                        siteState.categories
                      ).length === 0 ? (
                        <p className="text-xs text-slate-500">
                          لا توجد منتجات مضافة في هذا القسم حتى الآن. اكتب اسم المنتج أعلاه واضغط
                          إضافة.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {getProductsByCategorySlug(
                            editingCategory.slug,
                            siteState.products,
                            siteState.categories
                          ).map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between gap-2 p-2 rounded border border-slate-200 bg-slate-50"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={p.image}
                                  alt={p.titleAr}
                                  referrerPolicy="no-referrer"
                                  className="w-9 h-9 object-cover rounded bg-white border border-slate-200 shrink-0"
                                />
                                <div className="truncate">
                                  <div className="text-xs font-bold text-slate-900 truncate">
                                    {p.titleAr}
                                  </div>
                                  {p.price && (
                                    <div className="text-[11px] text-[#23838B]">{p.price}</div>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  updateSiteState((prev) => deleteProductFromState(prev, p.id))
                                }
                                className="text-xs text-red-600 hover:underline shrink-0 cursor-pointer"
                              >
                                حذف
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              )}

              {/* Categories Table */}
              <div className="bg-white rounded border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    قائمة الأقسام الحالية ({filteredCategories.length})
                  </h3>
                  <input
                    type="search"
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                    placeholder="ابحث في الأقسام..."
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded w-full sm:w-64"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-start border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                        <th className="py-2.5 px-4">الصورة</th>
                        <th className="py-2.5 px-4">الاسم (عربي / إنجليزي)</th>
                        <th className="py-2.5 px-4">عدد المنتجات بالقسم</th>
                        <th className="py-2.5 px-4">الرابط (Slug)</th>
                        <th className="py-2.5 px-4">إجراءات وإضافة منتجات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredCategories.map((cat, idx) => {
                        const countInCat = getProductsByCategorySlug(
                          cat.slug,
                          siteState.products,
                          siteState.categories
                        ).length;
                        return (
                          <tr key={cat.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4">
                              <img
                                src={cat.image}
                                alt={cat.title}
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 object-contain rounded border border-slate-200 bg-white"
                              />
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="font-semibold text-slate-900">{cat.titleAr}</div>
                              <div className="text-xs text-slate-500">{cat.title}</div>
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono tabular-nums bg-slate-100 text-slate-800">
                                {countInCat} منتجات
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-mono text-xs text-slate-600" dir="ltr">
                              /{cat.slug}
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleQuickAddProductToCategory(cat.slug, cat.titleAr)
                                  }
                                  className="px-3 py-1 text-xs font-semibold bg-[#23838B] hover:bg-[#1a666d] text-white rounded cursor-pointer"
                                >
                                  + إضافة منتج للقسم
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onNavigate(`/${cat.slug}`)}
                                  className="px-2.5 py-1 text-xs font-medium bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded cursor-pointer"
                                >
                                  عرض القسم
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCategory(cat)}
                                  className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded cursor-pointer"
                                >
                                  تعديل
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() =>
                                    updateSiteState((prev) => ({
                                      ...prev,
                                      categories: moveArrayItem(prev.categories, idx, 'up'),
                                    }))
                                  }
                                  className="px-2 py-1 text-xs border border-slate-200 rounded disabled:opacity-40 cursor-pointer"
                                >
                                  <i className="fa fa-arrow-up"></i>
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === filteredCategories.length - 1}
                                  onClick={() =>
                                    updateSiteState((prev) => ({
                                      ...prev,
                                      categories: moveArrayItem(prev.categories, idx, 'down'),
                                    }))
                                  }
                                  className="px-2 py-1 text-xs border border-slate-200 rounded disabled:opacity-40 cursor-pointer"
                                >
                                  <i className="fa fa-arrow-down"></i>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateSiteState((prev) =>
                                      deleteCategoryFromState(prev, cat.id)
                                    );
                                    notify(`تم حذف القسم "${cat.titleAr}".`);
                                  }}
                                  className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded cursor-pointer"
                                >
                                  حذف
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 7. PRODUCTS MANAGEMENT TAB */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Add Product Form */}
              <form
                onSubmit={handleAddProduct}
                className="bg-white p-6 rounded border border-slate-200 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      إضافة منتج جديد وربطه بالأقسام
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      اختر القسم (أو عدة أقسام) ثم أدخل اسم المنتج وصورته ليظهر فوراً داخل صفحة القسم.
                    </p>
                  </div>
                  {newProduct.categorySlugs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onNavigate(`/${newProduct.categorySlugs[0]}`)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#23838B] bg-teal-50 border border-teal-200 rounded hover:bg-teal-100 cursor-pointer self-start"
                    >
                      معاينة صفحة القسم المختار &larr;
                    </button>
                  )}
                </div>

                {/* Step 1: Primary Category Selector Dropdown */}
                <div className="p-4 bg-teal-50/50 border border-teal-200 rounded space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div>
                      <label
                        htmlFor="primary_category_select"
                        className="block text-xs font-bold text-slate-900 mb-1"
                      >
                        1. اختر القسم الرئيسي الذي تريد إضافة المنتج بداخله:
                      </label>
                      <select
                        id="primary_category_select"
                        value={newProduct.categorySlugs[0] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            setNewProduct({ ...newProduct, categorySlugs: [] });
                          } else {
                            setNewProduct({
                              ...newProduct,
                              categorySlugs: [val],
                            });
                            setProdCategoryFilter(val);
                          }
                        }}
                        className="w-full px-3 py-2 text-sm font-semibold bg-white text-slate-900 border border-[#23838B] rounded"
                      >
                        <option value="">-- اختر القسم من القائمة ({siteState.categories.length} قسماً) --</option>
                        {siteState.categories.map((cat) => (
                          <option key={cat.id} value={cat.slug}>
                            {cat.titleAr} — ({cat.title})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="text-xs text-slate-600 leading-relaxed">
                      يمكنك اختيار قسم واحد من القائمة المنسدلة، أو الضغط على أزرار الأقسام أدناه
                      لإظهار نفس المنتج في أكثر من قسم في نفس الوقت.
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="new_prod_title_ar"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      اسم المنتج (بالعربية)
                    </label>
                    <input
                      id="new_prod_title_ar"
                      type="text"
                      required
                      value={newProduct.titleAr}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, titleAr: e.target.value })
                      }
                      placeholder="مثال: سلة غذائية متكاملة"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new_prod_title_en"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      اسم المنتج (بالإنجليزية)
                    </label>
                    <input
                      id="new_prod_title_en"
                      type="text"
                      dir="ltr"
                      value={newProduct.title}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, title: e.target.value })
                      }
                      placeholder="e.g. Premium Food Basket"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new_prod_price"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      السعر أو الكود (اختياري)
                    </label>
                    <input
                      id="new_prod_price"
                      type="text"
                      value={newProduct.price || ''}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, price: e.target.value })
                      }
                      placeholder="مثال: 150 ر.س"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      وصف المنتج التفصيلي (بالعربية - يظهر في نافذة تفاصيل المنتج)
                    </label>
                    <textarea
                      rows={2}
                      value={newProduct.descriptionAr || ''}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, descriptionAr: e.target.value })
                      }
                      placeholder="تفاصيل العبوة، الوزن، المنشأ، وخيارات التوريد..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      وصف المنتج التفصيلي (بالإنجليزية)
                    </label>
                    <textarea
                      rows={2}
                      dir="ltr"
                      value={newProduct.description || ''}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, description: e.target.value })
                      }
                      placeholder="Packaging details, weight, origin, wholesale options..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-slate-700 mb-2">
                    الأقسام المرتبطة بالمنتج (اختر قسماً أو أكثر ليظهر المنتج بداخلها):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {uniqueCategorySlugs.map((slug) => {
                      const catObj = siteState.categories.find((c) => c.slug === slug);
                      const selected = newProduct.categorySlugs.includes(slug);
                      return (
                        <button
                          key={slug}
                          type="button"
                          onClick={() =>
                            setNewProduct({
                              ...newProduct,
                              categorySlugs: toggleCategorySlugInList(
                                newProduct.categorySlugs,
                                slug
                              ),
                            })
                          }
                          className={`px-3 py-1.5 text-xs rounded border transition-colors cursor-pointer ${
                            selected
                              ? 'bg-[#23838B] text-white border-[#23838B]'
                              : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {catObj ? `${catObj.titleAr} (${slug})` : slug}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <ImageInputField
                  label="صورة المنتج"
                  value={newProduct.image}
                  onChange={(url) => setNewProduct({ ...newProduct, image: url })}
                />

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-semibold bg-[#23838B] hover:bg-[#1a666d] text-white rounded transition-colors cursor-pointer"
                  >
                    <i className="fa fa-plus me-1.5"></i>
                    إضافة المنتج الآن
                  </button>
                </div>
              </form>

              {/* Edit Product Inline Form */}
              {editingProduct && (
                <form
                  onSubmit={handleSaveProductEdit}
                  className="bg-amber-50/70 p-6 rounded border-2 border-[#BE9C6A] space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                    <h3 className="text-base font-bold text-slate-900">
                      تعديل المنتج: {editingProduct.titleAr}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        الاسم بالعربية
                      </label>
                      <input
                        type="text"
                        value={editingProduct.titleAr}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, titleAr: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        الاسم بالإنجليزية
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={editingProduct.title}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, title: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        السعر (اختياري)
                      </label>
                      <input
                        type="text"
                        value={editingProduct.price || ''}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, price: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        الوصف بالعربية
                      </label>
                      <textarea
                        rows={2}
                        value={editingProduct.descriptionAr || ''}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            descriptionAr: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        الوصف بالإنجليزية
                      </label>
                      <textarea
                        rows={2}
                        dir="ltr"
                        value={editingProduct.description || ''}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-slate-700 mb-2">
                      الأقسام المرتبطة:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {uniqueCategorySlugs.map((slug) => {
                        const selected = editingProduct.categorySlugs.includes(slug);
                        return (
                          <button
                            key={slug}
                            type="button"
                            onClick={() =>
                              setEditingProduct({
                                ...editingProduct,
                                categorySlugs: toggleCategorySlugInList(
                                  editingProduct.categorySlugs,
                                  slug
                                ),
                              })
                            }
                            className={`px-3 py-1 text-xs rounded border cursor-pointer ${
                              selected
                                ? 'bg-[#23838B] text-white border-[#23838B]'
                                : 'bg-white text-slate-700 border-slate-300'
                            }`}
                          >
                            {slug}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <ImageInputField
                    label="صورة المنتج"
                    value={editingProduct.image}
                    onChange={(url) => setEditingProduct({ ...editingProduct, image: url })}
                  />

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-semibold bg-[#23838B] text-white rounded cursor-pointer"
                    >
                      حفظ التعديلات
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="px-4 py-2 text-xs bg-white border border-slate-300 rounded cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              )}

              {/* Products List Table */}
              <div className="bg-white rounded border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    قائمة المنتجات ({filteredProducts.length})
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="فلترة حسب القسم"
                      value={prodCategoryFilter}
                      onChange={(e) => setProdCategoryFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white text-slate-800 border border-slate-300 rounded"
                    >
                      <option value="all">جميع الأقسام</option>
                      {uniqueCategorySlugs.map((slug) => (
                        <option key={slug} value={slug}>
                          {slug}
                        </option>
                      ))}
                    </select>
                    <input
                      type="search"
                      value={prodSearch}
                      onChange={(e) => setProdSearch(e.target.value)}
                      placeholder="ابحث عن منتج..."
                      className="px-3 py-1.5 text-xs border border-slate-300 rounded w-48"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-start border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                        <th className="py-2.5 px-4">الصورة</th>
                        <th className="py-2.5 px-4">المنتج</th>
                        <th className="py-2.5 px-4">الأقسام المرتبطة</th>
                        <th className="py-2.5 px-4">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredProducts.map((prod, idx) => (
                        <tr key={prod.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4">
                            <img
                              src={prod.image}
                              alt={prod.title}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 object-cover rounded border border-slate-200"
                            />
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="font-semibold text-slate-900">{prod.titleAr}</div>
                            <div className="text-xs text-slate-500">{prod.title}</div>
                            {prod.price && (
                              <div className="text-xs font-semibold text-[#23838B] tabular-nums">
                                {prod.price}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-xs text-slate-600">
                            {prod.categorySlugs.length > 0
                              ? prod.categorySlugs.join(' · ')
                              : 'عام (يظهر في جميع المنتجات)'}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingProduct(prod)}
                                className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded cursor-pointer"
                              >
                                تعديل
                              </button>
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() =>
                                  updateSiteState((prev) => ({
                                    ...prev,
                                    products: moveArrayItem(prev.products, idx, 'up'),
                                  }))
                                }
                                className="px-2 py-1 text-xs border border-slate-200 rounded disabled:opacity-40 cursor-pointer"
                              >
                                <i className="fa fa-arrow-up"></i>
                              </button>
                              <button
                                type="button"
                                disabled={idx === filteredProducts.length - 1}
                                onClick={() =>
                                  updateSiteState((prev) => ({
                                    ...prev,
                                    products: moveArrayItem(prev.products, idx, 'down'),
                                  }))
                                }
                                className="px-2 py-1 text-xs border border-slate-200 rounded disabled:opacity-40 cursor-pointer"
                              >
                                <i className="fa fa-arrow-down"></i>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  updateSiteState((prev) =>
                                    deleteProductFromState(prev, prod.id)
                                  );
                                  notify(`تم حذف المنتج "${prod.titleAr}".`);
                                }}
                                className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded cursor-pointer"
                              >
                                حذف
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 8. MARKET PLACES TAB */}
          {activeTab === 'marketplaces' && (
            <div className="space-y-6">
              <form
                onSubmit={handleAddMarketPlace}
                className="bg-white p-6 rounded border border-slate-200 space-y-4"
              >
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3">
                  إضافة قطاع عمل جديد (Market Place)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      اسم القطاع (بالعربية)
                    </label>
                    <input
                      type="text"
                      required
                      value={newMarketPlace.titleAr}
                      onChange={(e) =>
                        setNewMarketPlace({ ...newMarketPlace, titleAr: e.target.value })
                      }
                      placeholder="مثال: شركات الطيران والتموين"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      اسم القطاع (بالإنجليزية)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={newMarketPlace.title}
                      onChange={(e) =>
                        setNewMarketPlace({ ...newMarketPlace, title: e.target.value })
                      }
                      placeholder="e.g. Airlines & Aviation Catering"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      الوصف بالعربية
                    </label>
                    <textarea
                      rows={3}
                      value={newMarketPlace.fullDescriptionAr}
                      onChange={(e) =>
                        setNewMarketPlace({
                          ...newMarketPlace,
                          fullDescriptionAr: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      الوصف بالإنجليزية
                    </label>
                    <textarea
                      rows={3}
                      dir="ltr"
                      value={newMarketPlace.fullDescription}
                      onChange={(e) =>
                        setNewMarketPlace({
                          ...newMarketPlace,
                          fullDescription: e.target.value,
                          homeExcerpt: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>
                </div>

                <ImageInputField
                  label="أيقونة / صورة القطاع"
                  value={newMarketPlace.image}
                  onChange={(url) => setNewMarketPlace({ ...newMarketPlace, image: url })}
                />

                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold bg-[#23838B] text-white rounded cursor-pointer"
                >
                  + إضافة قطاع العمل
                </button>
              </form>

              {editingMarketPlace && (
                <div className="bg-amber-50/70 p-6 rounded border-2 border-[#BE9C6A] space-y-4">
                  <h3 className="text-base font-bold text-slate-900">
                    تعديل قطاع: {editingMarketPlace.titleAr}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={editingMarketPlace.titleAr}
                      onChange={(e) =>
                        setEditingMarketPlace({
                          ...editingMarketPlace,
                          titleAr: e.target.value,
                        })
                      }
                      className="px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      value={editingMarketPlace.title}
                      onChange={(e) =>
                        setEditingMarketPlace({
                          ...editingMarketPlace,
                          title: e.target.value,
                        })
                      }
                      className="px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <textarea
                      rows={3}
                      value={editingMarketPlace.fullDescriptionAr}
                      onChange={(e) =>
                        setEditingMarketPlace({
                          ...editingMarketPlace,
                          fullDescriptionAr: e.target.value,
                        })
                      }
                      className="px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                    />
                    <textarea
                      rows={3}
                      dir="ltr"
                      value={editingMarketPlace.fullDescription}
                      onChange={(e) =>
                        setEditingMarketPlace({
                          ...editingMarketPlace,
                          fullDescription: e.target.value,
                          homeExcerpt: e.target.value,
                        })
                      }
                      className="px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <ImageInputField
                    label="أيقونة القطاع"
                    value={editingMarketPlace.image}
                    onChange={(url) =>
                      setEditingMarketPlace({ ...editingMarketPlace, image: url })
                    }
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        updateSiteState((prev) => ({
                          ...prev,
                          marketPlaces: prev.marketPlaces.map((m) =>
                            m.id === editingMarketPlace.id ? editingMarketPlace : m
                          ),
                        }));
                        setEditingMarketPlace(null);
                        notify('تم حفظ تعديلات قطاع العمل.');
                      }}
                      className="px-4 py-2 text-xs font-semibold bg-[#23838B] text-white rounded cursor-pointer"
                    >
                      حفظ
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingMarketPlace(null)}
                      className="px-4 py-2 text-xs bg-white border border-slate-300 rounded cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {siteState.marketPlaces.map((mp) => (
                  <div
                    key={mp.id}
                    className="bg-white p-4 rounded border border-slate-200 flex items-start gap-4 justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={mp.image}
                        alt={mp.title}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 object-contain shrink-0"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {mp.titleAr} / {mp.title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {mp.fullDescriptionAr}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingMarketPlace(mp)}
                        className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateSiteState((prev) => ({
                            ...prev,
                            marketPlaces: prev.marketPlaces.filter((m) => m.id !== mp.id),
                          }))
                        }
                        className="px-2.5 py-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded cursor-pointer"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. LEGAL PAGES, CUSTOM PAGES & UI TRANSLATIONS TAB */}
          {activeTab === 'pages' && (
            <div className="space-y-6">
              {/* Custom Pages Builder */}
              <div className="bg-white p-6 rounded border border-slate-200 space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3">
                  إنشاء صفحات إضافية مخصصة (Custom Pages Builder)
                </h2>
                <p className="text-xs text-slate-500">
                  أنشئ أي صفحة جديدة (مثل: الشهادات، شركاء النجاح، الفروع) وستظهر تلقائياً في القائمة
                  العلوية أو الفوتر.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={newCustomPage.titleAr}
                    onChange={(e) =>
                      setNewCustomPage({ ...newCustomPage, titleAr: e.target.value })
                    }
                    placeholder="عنوان الصفحة (عربي)"
                    className="px-3 py-2 text-sm border border-slate-300 rounded"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={newCustomPage.title}
                    onChange={(e) =>
                      setNewCustomPage({ ...newCustomPage, title: e.target.value })
                    }
                    placeholder="Page Title (EN)"
                    className="px-3 py-2 text-sm border border-slate-300 rounded"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={newCustomPage.slug}
                    onChange={(e) =>
                      setNewCustomPage({ ...newCustomPage, slug: e.target.value })
                    }
                    placeholder="رابط الصفحة (مثال: certificates)"
                    className="px-3 py-2 text-sm border border-slate-300 rounded"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <textarea
                    rows={3}
                    value={newCustomPage.contentAr}
                    onChange={(e) =>
                      setNewCustomPage({ ...newCustomPage, contentAr: e.target.value })
                    }
                    placeholder="محتوى الصفحة بالعربية..."
                    className="px-3 py-2 text-sm border border-slate-300 rounded"
                  />
                  <textarea
                    rows={3}
                    dir="ltr"
                    value={newCustomPage.content}
                    onChange={(e) =>
                      setNewCustomPage({ ...newCustomPage, content: e.target.value })
                    }
                    placeholder="Page content in English..."
                    className="px-3 py-2 text-sm border border-slate-300 rounded"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={newCustomPage.showInNavbar}
                      onChange={(e) =>
                        setNewCustomPage({ ...newCustomPage, showInNavbar: e.target.checked })
                      }
                    />
                    <span>إظهار في القائمة العلوية (Navbar)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={newCustomPage.showInFooter}
                      onChange={(e) =>
                        setNewCustomPage({ ...newCustomPage, showInFooter: e.target.checked })
                      }
                    />
                    <span>إظهار في روابط الفوتر (Footer)</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      if (!newCustomPage.titleAr.trim() && !newCustomPage.title.trim()) return;
                      const titleAr = newCustomPage.titleAr.trim() || newCustomPage.title.trim();
                      const title = newCustomPage.title.trim() || titleAr;
                      const slug = newCustomPage.slug.trim() || slugifyText(title);
                      const created: CustomPage = {
                        ...newCustomPage,
                        id: `cp-${Date.now()}`,
                        title,
                        titleAr,
                        slug,
                      };
                      updateSiteState((prev) => ({
                        ...prev,
                        customPages: [...prev.customPages, created],
                      }));
                      setNewCustomPage({
                        slug: '',
                        title: '',
                        titleAr: '',
                        content: '',
                        contentAr: '',
                        showInNavbar: true,
                        showInFooter: true,
                      });
                      notify(`تم إنشاء الصفحة "/${slug}" بنجاح.`);
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-[#23838B] text-white rounded cursor-pointer"
                  >
                    + إنشاء الصفحة المخصصة
                  </button>
                </div>

                {editingCustomPage && (
                  <div className="p-4 bg-amber-50/70 rounded border-2 border-[#BE9C6A] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">
                        تعديل الصفحة المخصصة: {editingCustomPage.titleAr}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setEditingCustomPage(null)}
                        className="text-xs text-slate-600 cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={editingCustomPage.titleAr}
                        onChange={(e) =>
                          setEditingCustomPage({ ...editingCustomPage, titleAr: e.target.value })
                        }
                        className="px-3 py-1.5 text-xs border border-slate-300 rounded bg-white"
                      />
                      <input
                        type="text"
                        dir="ltr"
                        value={editingCustomPage.title}
                        onChange={(e) =>
                          setEditingCustomPage({ ...editingCustomPage, title: e.target.value })
                        }
                        className="px-3 py-1.5 text-xs border border-slate-300 rounded bg-white"
                      />
                      <input
                        type="text"
                        dir="ltr"
                        value={editingCustomPage.slug}
                        onChange={(e) =>
                          setEditingCustomPage({ ...editingCustomPage, slug: e.target.value })
                        }
                        className="px-3 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <textarea
                        rows={3}
                        value={editingCustomPage.contentAr}
                        onChange={(e) =>
                          setEditingCustomPage({
                            ...editingCustomPage,
                            contentAr: e.target.value,
                          })
                        }
                        className="px-3 py-1.5 text-xs border border-slate-300 rounded bg-white"
                      />
                      <textarea
                        rows={3}
                        dir="ltr"
                        value={editingCustomPage.content}
                        onChange={(e) =>
                          setEditingCustomPage({
                            ...editingCustomPage,
                            content: e.target.value,
                          })
                        }
                        className="px-3 py-1.5 text-xs border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex items-center gap-1.5 text-xs">
                        <input
                          type="checkbox"
                          checked={editingCustomPage.showInNavbar}
                          onChange={(e) =>
                            setEditingCustomPage({
                              ...editingCustomPage,
                              showInNavbar: e.target.checked,
                            })
                          }
                        />
                        <span>إظهار في Navbar</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs">
                        <input
                          type="checkbox"
                          checked={editingCustomPage.showInFooter}
                          onChange={(e) =>
                            setEditingCustomPage({
                              ...editingCustomPage,
                              showInFooter: e.target.checked,
                            })
                          }
                        />
                        <span>إظهار في Footer</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          updateSiteState((prev) => ({
                            ...prev,
                            customPages: prev.customPages.map((p) =>
                              p.id === editingCustomPage.id ? editingCustomPage : p
                            ),
                          }));
                          setEditingCustomPage(null);
                          notify('تم حفظ تعديلات الصفحة المخصصة.');
                        }}
                        className="px-4 py-1.5 text-xs font-semibold bg-[#23838B] text-white rounded cursor-pointer"
                      >
                        حفظ التعديلات
                      </button>
                    </div>
                  </div>
                )}

                {siteState.customPages.length > 0 && (
                  <div className="pt-3 space-y-2">
                    {siteState.customPages.map((cp) => (
                      <div
                        key={cp.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200"
                      >
                        <div>
                          <span className="font-bold text-sm text-slate-900">
                            {cp.titleAr} ({cp.title})
                          </span>
                          <span className="text-xs font-mono text-slate-500 ms-2">
                            /{cp.slug}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingCustomPage(cp)}
                            className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded cursor-pointer"
                          >
                            تعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigate(`/${cp.slug}`)}
                            className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded cursor-pointer"
                          >
                            معاينة
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateSiteState((prev) => ({
                                ...prev,
                                customPages: prev.customPages.filter((p) => p.id !== cp.id),
                              }))
                            }
                            className="px-2.5 py-1 text-xs text-red-600 bg-red-50 rounded cursor-pointer"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Privacy Policy & Terms Intro Editors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      محتوى سياسة الخصوصية (/privacy-policy)
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        const newSec: LegalSection = {
                          id: `pp-${Date.now()}`,
                          heading: `${siteState.privacyPolicy.sections.length + 1}. New Section`,
                          paragraphs: ['Section paragraph text...'],
                          bullets: [],
                        };
                        updateSiteState((prev) => ({
                          ...prev,
                          privacyPolicy: {
                            ...prev.privacyPolicy,
                            sections: [...prev.privacyPolicy.sections, newSec],
                          },
                        }));
                      }}
                      className="px-2.5 py-1 text-xs font-semibold bg-[#23838B] text-white rounded cursor-pointer"
                    >
                      + إضافة بند
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    dir="ltr"
                    value={siteState.privacyPolicy.intro}
                    onChange={(e) =>
                      updateSiteState((prev) => ({
                        ...prev,
                        privacyPolicy: { ...prev.privacyPolicy, intro: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                  />
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {siteState.privacyPolicy.sections.map((sec: LegalSection) => (
                      <div
                        key={sec.id}
                        className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            dir="ltr"
                            value={sec.heading}
                            onChange={(e) =>
                              updateSiteState((prev) => ({
                                ...prev,
                                privacyPolicy: {
                                  ...prev.privacyPolicy,
                                  sections: prev.privacyPolicy.sections.map((s) =>
                                    s.id === sec.id ? { ...s, heading: e.target.value } : s
                                  ),
                                },
                              }))
                            }
                            className="flex-1 px-2 py-1 text-xs font-bold border border-slate-300 rounded bg-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateSiteState((prev) => ({
                                ...prev,
                                privacyPolicy: {
                                  ...prev.privacyPolicy,
                                  sections: prev.privacyPolicy.sections.filter(
                                    (s) => s.id !== sec.id
                                  ),
                                },
                              }))
                            }
                            className="text-xs text-red-600 px-1.5 cursor-pointer"
                          >
                            حذف
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          dir="ltr"
                          value={sec.paragraphs.join('\n')}
                          onChange={(e) =>
                            updateSiteState((prev) => ({
                              ...prev,
                              privacyPolicy: {
                                ...prev.privacyPolicy,
                                sections: prev.privacyPolicy.sections.map((s) =>
                                  s.id === sec.id
                                    ? { ...s, paragraphs: e.target.value.split('\n') }
                                    : s
                                ),
                              },
                            }))
                          }
                          placeholder="Paragraphs (one per line)"
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                        />
                        <textarea
                          rows={2}
                          dir="ltr"
                          value={(sec.bullets || []).join('\n')}
                          onChange={(e) =>
                            updateSiteState((prev) => ({
                              ...prev,
                              privacyPolicy: {
                                ...prev.privacyPolicy,
                                sections: prev.privacyPolicy.sections.map((s) =>
                                  s.id === sec.id
                                    ? {
                                        ...s,
                                        bullets: e.target.value
                                          ? e.target.value.split('\n')
                                          : [],
                                      }
                                    : s
                                ),
                              },
                            }))
                          }
                          placeholder="Bullet points (optional, one per line)"
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      محتوى الشروط والأحكام (/terms-and-conditions)
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        const newSec: LegalSection = {
                          id: `tc-${Date.now()}`,
                          heading: `${siteState.termsAndConditions.sections.length + 1}. New Section`,
                          paragraphs: ['Section paragraph text...'],
                          bullets: [],
                        };
                        updateSiteState((prev) => ({
                          ...prev,
                          termsAndConditions: {
                            ...prev.termsAndConditions,
                            sections: [...prev.termsAndConditions.sections, newSec],
                          },
                        }));
                      }}
                      className="px-2.5 py-1 text-xs font-semibold bg-[#23838B] text-white rounded cursor-pointer"
                    >
                      + إضافة بند
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    dir="ltr"
                    value={siteState.termsAndConditions.intro}
                    onChange={(e) =>
                      updateSiteState((prev) => ({
                        ...prev,
                        termsAndConditions: {
                          ...prev.termsAndConditions,
                          intro: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                  />
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {siteState.termsAndConditions.sections.map((sec: LegalSection) => (
                      <div
                        key={sec.id}
                        className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            dir="ltr"
                            value={sec.heading}
                            onChange={(e) =>
                              updateSiteState((prev) => ({
                                ...prev,
                                termsAndConditions: {
                                  ...prev.termsAndConditions,
                                  sections: prev.termsAndConditions.sections.map((s) =>
                                    s.id === sec.id ? { ...s, heading: e.target.value } : s
                                  ),
                                },
                              }))
                            }
                            className="flex-1 px-2 py-1 text-xs font-bold border border-slate-300 rounded bg-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateSiteState((prev) => ({
                                ...prev,
                                termsAndConditions: {
                                  ...prev.termsAndConditions,
                                  sections: prev.termsAndConditions.sections.filter(
                                    (s) => s.id !== sec.id
                                  ),
                                },
                              }))
                            }
                            className="text-xs text-red-600 px-1.5 cursor-pointer"
                          >
                            حذف
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          dir="ltr"
                          value={sec.paragraphs.join('\n')}
                          onChange={(e) =>
                            updateSiteState((prev) => ({
                              ...prev,
                              termsAndConditions: {
                                ...prev.termsAndConditions,
                                sections: prev.termsAndConditions.sections.map((s) =>
                                  s.id === sec.id
                                    ? { ...s, paragraphs: e.target.value.split('\n') }
                                    : s
                                ),
                              },
                            }))
                          }
                          placeholder="Paragraphs (one per line)"
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                        />
                        <textarea
                          rows={2}
                          dir="ltr"
                          value={(sec.bullets || []).join('\n')}
                          onChange={(e) =>
                            updateSiteState((prev) => ({
                              ...prev,
                              termsAndConditions: {
                                ...prev.termsAndConditions,
                                sections: prev.termsAndConditions.sections.map((s) =>
                                  s.id === sec.id
                                    ? {
                                        ...s,
                                        bullets: e.target.value
                                          ? e.target.value.split('\n')
                                          : [],
                                      }
                                    : s
                                ),
                              },
                            }))
                          }
                          placeholder="Bullet points (optional, one per line)"
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* UI Dictionary & Labels Editor */}
              <div className="bg-white p-6 rounded border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    قاموس ترجمات القوائم والعناوين والأزرار (UI Translations)
                  </h3>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded">
                    {(['ar', 'en', 'ur', 'hi'] as LanguageCode[]).map((lc) => (
                      <button
                        key={lc}
                        type="button"
                        onClick={() => setTransLang(lc)}
                        className={`px-3 py-1 text-xs font-semibold rounded uppercase cursor-pointer ${
                          transLang === lc
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600'
                        }`}
                      >
                        {lc}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(
                    Object.keys(siteState.uiTranslations[transLang]) as Array<
                      keyof UITranslationSet
                    >
                  ).map((key) => (
                    <div key={key}>
                      <label className="block text-[11px] font-mono text-slate-500 mb-1">
                        {key}
                      </label>
                      <input
                        type="text"
                        value={siteState.uiTranslations[transLang][key]}
                        onChange={(e) =>
                          updateSiteState((prev) => ({
                            ...prev,
                            uiTranslations: {
                              ...prev.uiTranslations,
                              [transLang]: {
                                ...prev.uiTranslations[transLang],
                                [key]: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 10. MESSAGES INBOX & DEVELOPER TOOLS TAB */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              {/* Contact Messages Inbox */}
              <div className="bg-white p-6 rounded border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      صندوق رسائل واستفسارات العملاء ({siteState.contactMessages.length})
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      الرسائل المرسلة من نموذج صفحة "تواصل معنا" (/contact-us).
                    </p>
                  </div>
                </div>

                {siteState.contactMessages.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4">لا توجد رسائل واردة حالياً.</p>
                ) : (
                  <div className="space-y-3">
                    {siteState.contactMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded border ${
                          msg.read
                            ? 'bg-white border-slate-200'
                            : 'bg-teal-50/40 border-[#23838B]'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-bold text-sm text-slate-900">
                            {msg.subject}{' '}
                            {!msg.read && (
                              <span className="text-xs font-normal text-[#23838B] ms-2">
                                · رسالة جديدة
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono text-slate-500 tabular-nums">
                              {msg.submittedAt}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateSiteState((prev) => ({
                                  ...prev,
                                  contactMessages: prev.contactMessages.map((m) =>
                                    m.id === msg.id ? { ...m, read: !m.read } : m
                                  ),
                                }))
                              }
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                            >
                              {msg.read ? 'تعليم كغير مقروء' : 'تعليم كمقروء'}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateSiteState((prev) => ({
                                  ...prev,
                                  contactMessages: prev.contactMessages.filter(
                                    (m) => m.id !== msg.id
                                  ),
                                }))
                              }
                              className="px-2.5 py-1 text-red-600 bg-red-50 hover:bg-red-100 rounded cursor-pointer"
                            >
                              حذف
                            </button>
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-4">
                          <span>المرسل: {msg.userName}</span>
                          <span>البريد: {msg.userEmail}</span>
                          <span dir="ltr">الجوال: {msg.mobileNo}</span>
                        </div>
                        <p className="text-sm text-slate-800 mt-2.5 leading-relaxed">
                          {msg.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Developer Tools: Custom CSS & Full JSON Export/Import & Reset */}
              <div className="bg-white p-6 rounded border border-slate-200 space-y-5">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3">
                  أدوات المطور المتقدمة (CSS مخصص / نسخ احتياطي JSON / استعادة الضبط)
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    حقن كود CSS مخصص (Custom CSS Injection)
                  </label>
                  <textarea
                    rows={4}
                    dir="ltr"
                    value={siteState.theme.customCss}
                    onChange={(e) =>
                      updateSiteState((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, customCss: e.target.value },
                      }))
                    }
                    placeholder="/* أضف أي قواعد CSS مخصصة هنا وستطبق مباشرة على الموقع */"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded bg-slate-900 text-emerald-400"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-3">
                    <h4 className="text-sm font-bold text-slate-800">
                      استيراد قاعدة بيانات الموقع (Import JSON)
                    </h4>
                    <textarea
                      rows={4}
                      dir="ltr"
                      value={jsonInputText}
                      onChange={(e) => setJsonInputText(e.target.value)}
                      placeholder='الصق محتوى ملف JSON هنا لاستيراد الإعدادات والمنتجات...'
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded bg-white"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleImportJson}
                        className="px-4 py-2 text-xs font-semibold bg-[#23838B] text-white rounded cursor-pointer"
                      >
                        تطبيق واستيراد JSON
                      </button>
                      <button
                        type="button"
                        onClick={handleExportJson}
                        className="px-4 py-2 text-xs font-semibold bg-white border border-slate-300 rounded cursor-pointer"
                      >
                        تحميل ملف JSON الحالي
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-red-50/50 rounded border border-red-200 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-red-900">
                        استعادة الضبط الأصلي للموقع (Factory Reset)
                      </h4>
                      <p className="text-xs text-red-700 mt-1 leading-relaxed">
                        يعيد جميع النصوص، الأقسام الـ 15، المنتجات، الألوان، والصور إلى النسخة
                        الأصلية لموقع شركة نسيم العطاء التجارية.
                      </p>
                    </div>
                    <div className="pt-4">
                      {!confirmReset ? (
                        <button
                          type="button"
                          onClick={() => setConfirmReset(true)}
                          className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded cursor-pointer"
                        >
                          استعادة البيانات الأصلية للموقع
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              resetSiteState();
                              setConfirmReset(false);
                              notify('تمت استعادة النسخة الأصلية للموقع بالكامل.');
                            }}
                            className="px-4 py-2 text-xs font-bold bg-red-700 text-white rounded cursor-pointer"
                          >
                            تأكيد الاستعادة الآن
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmReset(false)}
                            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <AdminSecurityAndDeployModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        onNotify={(msg) => notify(msg)}
      />
    </div>
  );
};
