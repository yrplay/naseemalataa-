import React, { useState, useEffect } from 'react';
import { LanguageCode } from '../data/siteData';
import { useSite } from '../context/SiteContext';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
  language,
  onLanguageChange,
}) => {
  const { siteState } = useSite();
  const { company, theme, uiTranslations, customPages } = siteState;
  const t = uiTranslations[language];

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 45);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    onNavigate(path);
    setMobileMenuOpen(false);
    setProductsDropdownOpen(false);
  };

  const navCustomPages = customPages.filter((p) => p.showInNavbar);

  return (
    <header
      className={`fixed left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? `bg-white shadow-md top-0 ${theme.showTopBar ? 'lg:-top-[45px]' : ''}`
          : 'top-0 bg-transparent'
      }`}
    >
      {/* Top Bar */}
      {theme.showTopBar && (
        <div className="hidden lg:flex items-center justify-between px-12 h-[45px] border-b border-[#BE9C6A] text-sm">
          <div className="flex items-center space-x-6 rtl:space-x-reverse text-[#BE9C6A]">
            <small className="text-[13px] text-[#BE9C6A] flex items-center">
              <i className="fa fa-map-marker-alt text-[#23838B] me-2"></i>
              <span>{company.addressAr}</span>
            </small>
            <small className="text-[13px] text-[#BE9C6A] flex items-center">
              <i className="fa fa-envelope text-[#23838B] me-2"></i>
              <a href={`mailto:${company.email}`} className="text-[#BE9C6A] hover:underline">
                {company.email}
              </a>
            </small>
            <small className="text-[13px] text-[#BE9C6A] flex items-center">
              <i className="fa fa-envelope text-[#23838B] me-2"></i>
              <a href={`tel:${company.phone}`} className="text-[#BE9C6A] hover:underline">
                {company.phone}
              </a>
            </small>
          </div>

          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <small className="text-[13px] text-[#BE9C6A]">{t.followUs}</small>
            <a
              href={company.socialLinks.facebook || '#facebook'}
              onClick={(e) => {
                if (!company.socialLinks.facebook || company.socialLinks.facebook.startsWith('#')) {
                  e.preventDefault();
                }
              }}
              aria-label="Facebook"
              className="text-[#23838B] hover:opacity-80 transition"
            >
              <i className="fab fa-facebook-f"></i>
            </a>
            <a
              href={company.socialLinks.twitter || '#twitter'}
              onClick={(e) => {
                if (!company.socialLinks.twitter || company.socialLinks.twitter.startsWith('#')) {
                  e.preventDefault();
                }
              }}
              aria-label="Twitter"
              className="text-[#23838B] hover:opacity-80 transition"
            >
              <i className="fab fa-twitter"></i>
            </a>
            <a
              href={company.socialLinks.linkedin || '#linkedin'}
              onClick={(e) => {
                if (!company.socialLinks.linkedin || company.socialLinks.linkedin.startsWith('#')) {
                  e.preventDefault();
                }
              }}
              aria-label="LinkedIn"
              className="text-[#23838B] hover:opacity-80 transition"
            >
              <i className="fab fa-linkedin-in"></i>
            </a>
            <a
              href={company.socialLinks.instagram || '#instagram'}
              onClick={(e) => {
                if (
                  !company.socialLinks.instagram ||
                  company.socialLinks.instagram.startsWith('#')
                ) {
                  e.preventDefault();
                }
              }}
              aria-label="Instagram"
              className="text-[#23838B] hover:opacity-80 transition"
            >
              <i className="fab fa-instagram"></i>
            </a>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex flex-wrap items-center justify-between px-4 lg:px-12 py-2 lg:py-0">
        <a
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          className="flex items-center py-1"
        >
          <img
            src={company.logo}
            alt="Logo"
            width={theme.logoWidthPx || 350}
            referrerPolicy="no-referrer"
            style={{ maxWidth: `${theme.logoWidthPx || 350}px` }}
            className="w-[230px] sm:w-[300px] lg:w-auto h-auto object-contain"
          />
        </a>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
          className="lg:hidden p-2 border border-gray-300 rounded text-gray-600 hover:text-[#23838B]"
        >
          <i className="fa fa-bars text-xl"></i>
        </button>

        <div
          className={`${
            mobileMenuOpen
              ? 'block bg-white mt-2 border-t border-gray-100 p-4 rounded shadow-lg'
              : 'hidden'
          } w-full lg:w-auto lg:flex lg:items-center lg:bg-transparent lg:mt-0 lg:border-0 lg:p-0 lg:shadow-none ms-auto`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center">
            <a
              href="/"
              onClick={(e) => handleLinkClick(e, '/')}
              className={`py-2.5 lg:py-[25px] lg:px-[15px] font-medium transition-colors whitespace-nowrap ${
                currentPath === '/' ? 'text-[#23838B]' : 'text-[#BE9C6A] hover:text-[#23838B]'
              }`}
            >
              {t.home}
            </a>

            <a
              href="/about-us"
              onClick={(e) => handleLinkClick(e, '/about-us')}
              className={`py-2.5 lg:py-[25px] lg:px-[15px] font-medium transition-colors whitespace-nowrap ${
                currentPath === '/about-us'
                  ? 'text-[#23838B]'
                  : 'text-[#BE9C6A] hover:text-[#23838B]'
              }`}
            >
              {t.aboutUs}
            </a>

            {/* Products Dropdown */}
            <div
              className="relative group"
              onMouseEnter={() => setProductsDropdownOpen(true)}
              onMouseLeave={() => setProductsDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
                aria-expanded={productsDropdownOpen}
                className={`w-full text-start py-2.5 lg:py-[25px] lg:px-[15px] font-medium transition-colors flex items-center justify-between lg:justify-start whitespace-nowrap cursor-pointer ${
                  currentPath === '/products-categories' || currentPath === '/all-products'
                    ? 'text-[#23838B]'
                    : 'text-[#BE9C6A] hover:text-[#23838B]'
                }`}
              >
                <span>{t.products}</span>
                <i className="fa fa-angle-down ms-2 text-xs text-[#BE9C6A]"></i>
              </button>

              <div
                className={`${
                  productsDropdownOpen ? 'block opacity-100 visible' : 'hidden opacity-0 invisible'
                } lg:absolute start-0 top-full bg-white min-w-[200px] py-2 rounded shadow-md border border-gray-100 transition-all duration-300 z-50`}
              >
                <a
                  href="/products-categories"
                  onClick={(e) => handleLinkClick(e, '/products-categories')}
                  className="block px-4 py-2 text-[#BE9C6A] hover:bg-[#BE9C6A] hover:text-[#23838B] transition-colors whitespace-nowrap"
                >
                  {t.productsCategories}
                </a>
                <a
                  href="/all-products"
                  onClick={(e) => handleLinkClick(e, '/all-products')}
                  className="block px-4 py-2 text-[#BE9C6A] hover:bg-[#BE9C6A] hover:text-[#23838B] transition-colors whitespace-nowrap"
                >
                  {t.allProducts}
                </a>
              </div>
            </div>

            <a
              href="/market-places"
              onClick={(e) => handleLinkClick(e, '/market-places')}
              className={`py-2.5 lg:py-[25px] lg:px-[15px] font-medium transition-colors whitespace-nowrap ${
                currentPath === '/market-places'
                  ? 'text-[#23838B]'
                  : 'text-[#BE9C6A] hover:text-[#23838B]'
              }`}
            >
              {t.marketPlaces}
            </a>

            {navCustomPages.map((cp) => (
              <a
                key={cp.id}
                href={`/${cp.slug}`}
                onClick={(e) => handleLinkClick(e, `/${cp.slug}`)}
                className={`py-2.5 lg:py-[25px] lg:px-[15px] font-medium transition-colors whitespace-nowrap ${
                  currentPath === `/${cp.slug}`
                    ? 'text-[#23838B]'
                    : 'text-[#BE9C6A] hover:text-[#23838B]'
                }`}
              >
                {language === 'ar' ? cp.titleAr : cp.title}
              </a>
            ))}

            <a
              href="/contact-us"
              onClick={(e) => handleLinkClick(e, '/contact-us')}
              className={`py-2.5 lg:py-[25px] lg:px-[15px] font-medium transition-colors whitespace-nowrap ${
                currentPath === '/contact-us'
                  ? 'text-[#23838B]'
                  : 'text-[#BE9C6A] hover:text-[#23838B]'
              }`}
            >
              {t.contactUs}
            </a>

            <div className="py-2.5 lg:py-[25px] lg:px-[15px] flex items-center">
              <select
                aria-label="Select Language"
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
                className="lang-select"
              >
                <option value="en">English</option>
                <option value="ar">Arabic</option>
                <option value="ur">Urdu</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
