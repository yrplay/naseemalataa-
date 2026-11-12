import React, { useState, useEffect } from 'react';
import { LanguageCode } from '../data/siteData';
import { useSite } from '../context/SiteContext';

interface FooterProps {
  language: LanguageCode;
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ language, onNavigate }) => {
  const { siteState, isAdminAuthenticated, visitorPreviewMode } = useSite();
  const { company, theme, uiTranslations, customPages } = siteState;
  const t = uiTranslations[language];

  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    onNavigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerCustomPages = customPages.filter((p) => p.showInFooter);

  return (
    <>
      <footer
        style={{ backgroundColor: theme.darkFooterColor || '#111111' }}
        className="w-full text-[#999999] mt-12 pt-12"
      >
        <div className="max-w-[1320px] mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
            {/* Brand & Summary */}
            <div className="lg:col-span-6">
              <a
                href="/"
                onClick={(e) => handleNav(e, '/')}
                className="inline-block mb-3"
              >
                <img
                  src={company.logo}
                  alt="Logo"
                  width={theme.logoWidthPx || 350}
                  referrerPolicy="no-referrer"
                  className="w-[280px] sm:w-[350px] h-auto"
                />
              </a>
              <p className="naseem-p mb-4 leading-relaxed">{t.footerAbout}</p>
              <div className="flex items-center pt-2 space-x-1.5 rtl:space-x-reverse">
                <a
                  href={company.socialLinks.twitter || '#twitter'}
                  onClick={(e) => {
                    if (
                      !company.socialLinks.twitter ||
                      company.socialLinks.twitter.startsWith('#')
                    ) {
                      e.preventDefault();
                    }
                  }}
                  aria-label="Footer Twitter"
                  className="w-[38px] h-[38px] rounded-full border border-white/80 flex items-center justify-center text-[#23838B] hover:bg-white transition-colors"
                >
                  <i className="fab fa-twitter"></i>
                </a>
                <a
                  href={company.socialLinks.facebook || '#facebook'}
                  onClick={(e) => {
                    if (
                      !company.socialLinks.facebook ||
                      company.socialLinks.facebook.startsWith('#')
                    ) {
                      e.preventDefault();
                    }
                  }}
                  aria-label="Footer Facebook"
                  className="w-[38px] h-[38px] rounded-full border border-white/80 flex items-center justify-center text-[#23838B] hover:bg-white transition-colors"
                >
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a
                  href={company.socialLinks.youtube || '#youtube'}
                  onClick={(e) => {
                    if (
                      !company.socialLinks.youtube ||
                      company.socialLinks.youtube.startsWith('#')
                    ) {
                      e.preventDefault();
                    }
                  }}
                  aria-label="Footer YouTube"
                  className="w-[38px] h-[38px] rounded-full border border-white/80 flex items-center justify-center text-[#23838B] hover:bg-white transition-colors"
                >
                  <i className="fab fa-youtube"></i>
                </a>
                <a
                  href={company.socialLinks.linkedin || '#linkedin'}
                  onClick={(e) => {
                    if (
                      !company.socialLinks.linkedin ||
                      company.socialLinks.linkedin.startsWith('#')
                    ) {
                      e.preventDefault();
                    }
                  }}
                  aria-label="Footer LinkedIn"
                  className="w-[38px] h-[38px] rounded-full border border-white/80 flex items-center justify-center text-[#23838B] hover:bg-white transition-colors"
                >
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>

            {/* Address */}
            <div className="lg:col-span-3">
              <h4 className="text-[1.5rem] font-semibold text-[#BE9C6A] mb-6">{t.address}</h4>
              <p className="mb-3 flex items-start text-[#BE9C6A]">
                <i className="fa fa-map-marker-alt text-[#23838B] me-3 mt-1"></i>
                <span>{company.addressAr}</span>
              </p>
              <p className="mb-3 flex items-center">
                <i className="fa fa-phone-alt text-[#23838B] me-3"></i>
                <a href={`tel:${company.phone}`} className="text-[#BE9C6A] hover:underline">
                  {company.phone}
                </a>
              </p>
              <p className="mb-3 flex items-center">
                <i className="fa fa-envelope text-[#23838B] me-3"></i>
                <a href={`mailto:${company.email}`} className="text-[#BE9C6A] hover:underline">
                  {company.email}
                </a>
              </p>
            </div>

            {/* Quick Links */}
            <div className="lg:col-span-3">
              <h4 className="text-[1.5rem] font-semibold text-[#BE9C6A] mb-6">{t.quickLinks}</h4>
              <div className="space-y-2">
                <a
                  href="/about-us"
                  onClick={(e) => handleNav(e, '/about-us')}
                  className="footer-link flex items-center"
                >
                  <i className="fa fa-angle-right text-[#999999] me-2.5 text-sm"></i>
                  <span>{t.aboutUs}</span>
                </a>
                <a
                  href="/contact-us"
                  onClick={(e) => handleNav(e, '/contact-us')}
                  className="footer-link flex items-center"
                >
                  <i className="fa fa-angle-right text-[#999999] me-2.5 text-sm"></i>
                  <span>{t.contactUs}</span>
                </a>
                <a
                  href="/privacy-policy"
                  onClick={(e) => handleNav(e, '/privacy-policy')}
                  className="footer-link flex items-center"
                >
                  <i className="fa fa-angle-right text-[#999999] me-2.5 text-sm"></i>
                  <span>{t.privacyPolicy}</span>
                </a>
                <a
                  href="/terms-and-conditions"
                  onClick={(e) => handleNav(e, '/terms-and-conditions')}
                  className="footer-link flex items-center"
                >
                  <i className="fa fa-angle-right text-[#999999] me-2.5 text-sm"></i>
                  <span>{t.termsAndConditions}</span>
                </a>
                {footerCustomPages.map((cp) => (
                  <a
                    key={cp.id}
                    href={`/${cp.slug}`}
                    onClick={(e) => handleNav(e, `/${cp.slug}`)}
                    className="footer-link flex items-center"
                  >
                    <i className="fa fa-angle-right text-[#999999] me-2.5 text-sm"></i>
                    <span>{language === 'ar' ? cp.titleAr : cp.title}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="w-full border-t border-white/10 py-[25px] text-[15px]">
          <div className="max-w-[1320px] mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="text-center md:text-start">
                &copy;{' '}
                <a
                  href="/"
                  onClick={(e) => handleNav(e, '/')}
                  className="text-[#F7F8FC] hover:text-[#23838B] transition-colors"
                >
                  {company.nameFooter}
                </a>
                , {t.allRightReserved}
              </div>
              {isAdminAuthenticated && !visitorPreviewMode && (
                <div>
                  <a
                    href="/admin"
                    onClick={(e) => handleNav(e, '/admin')}
                    className="text-xs text-[#BE9C6A] hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <i className="fa fa-cog"></i>
                    <span>لوحة تحكم الموظفين والأدمن</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      {theme.showBackToTop && (
        <a
          href="#top"
          onClick={scrollToTop}
          aria-label="Back to top"
          className={`fixed end-[30px] bottom-[30px] z-50 w-[48px] h-[48px] rounded-full bg-[#23838B] hover:bg-[#1b6970] text-white flex items-center justify-center shadow-lg transition-all duration-300 ${
            showBackToTop ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
          }`}
        >
          <i className="bi bi-arrow-up text-xl"></i>
        </a>
      )}
    </>
  );
};
