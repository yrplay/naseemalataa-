import React, { useState, useEffect } from 'react';
import { LanguageCode } from './data/siteData';
import { SiteProvider, useSite } from './context/SiteContext';
import {
  getProductsByCategorySlug,
  isRtlLanguage,
  parseRoutePath,
} from './utils/siteLogic';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PageHeader } from './components/PageHeader';
import { CategoriesSection } from './components/CategoriesSection';
import { ProductsSection } from './components/ProductsSection';
import { MarketPlacesSection } from './components/MarketPlacesSection';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { LegalPage } from './pages/LegalPage';
import { AdminDashboard } from './pages/AdminDashboard';

function AppRoutes() {
  const { siteState, isAdminAuthenticated, logoutAdmin } = useSite();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [language, setLanguage] = useState<LanguageCode>('en');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const route = parseRoutePath(
    currentPath,
    siteState.categories,
    siteState.customPages
  );

  useEffect(() => {
    if (route.type === 'admin') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
      return;
    }
    const rtl = isRtlLanguage(language);
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, route.type]);

  const [quickBarCollapsed, setQuickBarCollapsed] = useState<boolean>(false);

  const handleNavigate = (path: string) => {
    const cleanFull = path.startsWith('/') ? path : `/${path}`;
    const [pathnameOnly] = cleanFull.split('?');
    window.history.pushState({}, '', cleanFull);
    setCurrentPath(pathnameOnly || '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (route.type === 'admin') {
    return <AdminDashboard onNavigate={handleNavigate} />;
  }

  const t = siteState.uiTranslations[language];

  const getContextualAdminTab = (): { tab: string; labelAr: string } => {
    switch (route.type) {
      case 'about-us':
        return { tab: 'about', labelAr: 'تعديل صفحة من نحن' };
      case 'products-categories':
        return { tab: 'categories', labelAr: 'إدارة الأقسام (15)' };
      case 'all-products':
        return { tab: 'products', labelAr: 'إدارة وإضافة المنتجات' };
      case 'category':
        return {
          tab: `products&cat=${route.slug}`,
          labelAr: `+ إضافة منتج في قسم "${route.category.titleAr}"`,
        };
      case 'market-places':
        return { tab: 'marketplaces', labelAr: 'إدارة قطاعات العمل' };
      case 'contact-us':
        return { tab: 'company', labelAr: 'تعديل بيانات التواصل' };
      case 'privacy-policy':
      case 'terms-and-conditions':
      case 'custom-page':
        return { tab: 'pages', labelAr: 'تعديل الصفحات والسياسات' };
      default:
        return { tab: 'overview', labelAr: 'لوحة تحكم الأدمن الشاملة' };
    }
  };

  const quickEditTarget = getContextualAdminTab();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar
        currentPath={currentPath}
        onNavigate={handleNavigate}
        language={language}
        onLanguageChange={setLanguage}
      />

      <main className="flex-grow">
        {route.type === 'home' && (
          <HomePage language={language} onNavigate={handleNavigate} />
        )}

        {route.type === 'about-us' && (
          <AboutPage language={language} onNavigate={handleNavigate} />
        )}

        {route.type === 'products-categories' && (
          <div>
            <PageHeader
              title={t.productsCategories}
              breadcrumbActive={t.productsCategories}
              language={language}
              onNavigate={handleNavigate}
            />
            <CategoriesSection
              categories={siteState.categories}
              language={language}
              onNavigate={handleNavigate}
            />
          </div>
        )}

        {route.type === 'all-products' && (
          <div>
            <PageHeader
              title={t.ourAllProducts}
              breadcrumbActive={t.ourAllProducts}
              language={language}
              onNavigate={handleNavigate}
            />
            <ProductsSection
              products={siteState.products}
              language={language}
              heading={t.ourAllProducts}
              subtitle={t.ourProductsSubtitle}
            />
          </div>
        )}

        {route.type === 'category' && (
          <div>
            <PageHeader
              title={`${
                language === 'ar' ? route.category.titleAr : route.category.title
              } ${t.products}`}
              breadcrumbActive={`${
                language === 'ar' ? route.category.titleAr : route.category.title
              } ${t.products}`}
              language={language}
              onNavigate={handleNavigate}
            />
            <ProductsSection
              products={getProductsByCategorySlug(route.slug, siteState.products)}
              language={language}
              heading={`${
                language === 'ar' ? route.category.titleAr : route.category.title
              } ${t.products}`}
              subtitle={
                language === 'ar'
                  ? route.category.descriptionAr
                  : route.category.description
              }
              alignStart={true}
            />
          </div>
        )}

        {route.type === 'market-places' && (
          <div>
            <PageHeader
              title={t.ourMarketPlaces}
              breadcrumbActive={t.ourMarketPlaces}
              language={language}
              onNavigate={handleNavigate}
            />
            <MarketPlacesSection
              marketPlaces={siteState.marketPlaces}
              language={language}
              useFullDescription={true}
            />
          </div>
        )}

        {route.type === 'contact-us' && (
          <ContactPage language={language} onNavigate={handleNavigate} />
        )}

        {route.type === 'privacy-policy' && (
          <LegalPage
            mode="privacy-policy"
            language={language}
            onNavigate={handleNavigate}
          />
        )}

        {route.type === 'terms-and-conditions' && (
          <LegalPage
            mode="terms-and-conditions"
            language={language}
            onNavigate={handleNavigate}
          />
        )}

        {route.type === 'custom-page' && (
          <div>
            <PageHeader
              title={language === 'ar' ? route.page.titleAr : route.page.title}
              breadcrumbActive={
                language === 'ar' ? route.page.titleAr : route.page.title
              }
              language={language}
              onNavigate={handleNavigate}
            />
            <section
              style={{ backgroundColor: siteState.theme.lightBgColor || '#F7F8FC' }}
              className="w-full bg-icon py-24"
            >
              <div className="max-w-[1320px] mx-auto px-6">
                <div className="bg-white text-start p-6 xl:p-12 shadow-[0_0_45px_rgba(0,0,0,0.03)] space-y-4">
                  <h2 className="text-[2rem] font-bold text-[#BE9C6A]">
                    {language === 'ar' ? route.page.titleAr : route.page.title}
                  </h2>
                  <div className="naseem-p whitespace-pre-line leading-relaxed">
                    {language === 'ar'
                      ? route.page.contentAr || route.page.content
                      : route.page.content || route.page.contentAr}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <Footer language={language} onNavigate={handleNavigate} />

      {/* Contextual Quick-Edit Admin Bar (Bottom-Start) */}
      <div
        dir="rtl"
        className="fixed bottom-5 start-5 z-40 flex items-center gap-1.5 bg-slate-900/95 text-white px-3 py-2 rounded shadow-lg border border-slate-700 text-xs"
      >
        {!quickBarCollapsed ? (
          isAdminAuthenticated ? (
            <>
              <button
                type="button"
                onClick={() => handleNavigate(`/admin?tab=${quickEditTarget.tab}`)}
                className="flex items-center gap-2 font-semibold text-white hover:text-[#BE9C6A] transition-colors cursor-pointer"
              >
                <i className="fa fa-sliders-h text-[#23838B]"></i>
                <span>{quickEditTarget.labelAr}</span>
              </button>
              <span className="text-slate-600 mx-1">|</span>
              <button
                type="button"
                onClick={() => handleNavigate('/admin')}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                لوحة التحكم
              </button>
              <span className="text-slate-600 mx-1">|</span>
              <button
                type="button"
                onClick={() => logoutAdmin()}
                className="text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              >
                خروج
              </button>
              <button
                type="button"
                onClick={() => setQuickBarCollapsed(true)}
                aria-label="تصغير شريط الأدمن"
                className="ms-1.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <i className="fa fa-times"></i>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleNavigate('/admin')}
                className="flex items-center gap-2 font-semibold text-white hover:text-[#BE9C6A] transition-colors cursor-pointer"
              >
                <i className="fa fa-lock text-[#BE9C6A]"></i>
                <span>دخول الأدمن</span>
              </button>
              <button
                type="button"
                onClick={() => setQuickBarCollapsed(true)}
                aria-label="تصغير زر الأدمن"
                className="ms-1.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <i className="fa fa-times"></i>
              </button>
            </>
          )
        ) : (
          <button
            type="button"
            onClick={() => setQuickBarCollapsed(false)}
            aria-label="فتح شريط الأدمن السريع"
            className="flex items-center gap-1.5 font-semibold text-white cursor-pointer"
          >
            <i className="fa fa-cog text-[#23838B]"></i>
            <span>الأدمن</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SiteProvider>
      <AppRoutes />
    </SiteProvider>
  );
}
