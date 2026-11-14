import React, { useState, useEffect } from 'react';
import { LanguageCode } from '../data/siteData';
import { useSite } from '../context/SiteContext';
import { authenticateStaffLogin, findStaffByEmail } from '../utils/siteLogic';

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
  const {
    siteState,
    isAdminAuthenticated,
    currentStaffMember,
    signedInVisitorEmail,
    loginVisitorEmail,
    visitorPreviewMode,
    setVisitorPreviewMode,
    loginAdmin,
    logoutAdmin,
    signInWithGoogleAdmin,
  } = useSite();
  const { company, theme, uiTranslations, customPages } = siteState;
  const t = uiTranslations[language];

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);

  // Sign-In Modal State
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [authNotice, setAuthNotice] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);

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

  // Show Dashboard button ONLY when authenticated as an active Admin/Staff member and not in visitor preview mode
  const showAdminDashboardButton = Boolean(
    isAdminAuthenticated && currentStaffMember && !visitorPreviewMode
  );

  const handleGoogleSignIn = async () => {
    setAuthNotice(null);
    setGoogleBusy(true);
    const res = await signInWithGoogleAdmin(true);
    setGoogleBusy(false);

    if (res.ok) {
      setAuthNotice({
        type: 'success',
        text: `مرحباً بك! تم التحقق من بريدك المعتمد (${res.email}) وتفعيل زر لوحة التحكم.`,
      });
      setTimeout(() => {
        setLoginModalOpen(false);
        setAuthNotice(null);
      }, 900);
    } else if (res.isVisitor) {
      setAuthNotice({
        type: 'info',
        text: `تم تسجيل الدخول بحساب (${res.email}). يمكنك تصفح الموقع بشكل طبيعي.`,
      });
      setTimeout(() => {
        setLoginModalOpen(false);
        setAuthNotice(null);
      }, 1400);
    } else if (res.error) {
      setAuthNotice({
        type: 'error',
        text: res.error,
      });
    }
  };

  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthNotice(null);
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthNotice({
        type: 'error',
        text: 'يرجى إدخال بريد إلكتروني صحيح (Gmail أو بريد العمل).',
      });
      return;
    }

    const matchedStaff = findStaffByEmail(cleanEmail, siteState.staffMembers);
    const isOwner = cleanEmail === 'yr.play.com@gmail.com';

    if (isOwner || (matchedStaff && matchedStaff.active)) {
      // If password field is not shown yet and staff member has an access code, prompt or verify
      if (passwordInput.trim()) {
        const result = authenticateStaffLogin(
          cleanEmail,
          passwordInput,
          siteState.staffMembers,
          siteState.adminAuth
        );
        if (result.staff) {
          loginAdmin(result.staff);
          setEmailInput('');
          setPasswordInput('');
          setShowPasswordField(false);
          setLoginModalOpen(false);
          return;
        }
        setAuthNotice({
          type: 'error',
          text: result.error || 'كود الدخول غير مطابق لهذا البريد.',
        });
        return;
      }

      // If no password entered yet, check if they have a required accessCode or allow quick staff email recognition
      if (matchedStaff && (!matchedStaff.accessCode || matchedStaff.accessCode.trim() === '')) {
        loginAdmin(matchedStaff);
        setEmailInput('');
        setLoginModalOpen(false);
        return;
      }

      setShowPasswordField(true);
      setAuthNotice({
        type: 'info',
        text: 'هذا البريد مسجل ضمن قائمة الأدمنز/الموظفين. أدخل كود الدخول الخاص بك أو اضغط على زر Google أعلاه.',
      });
      return;
    }

    // Regular visitor email (not in staffMembers): sign in as normal visitor without showing any admin buttons
    loginVisitorEmail(cleanEmail);
    setEmailInput('');
    setPasswordInput('');
    setShowPasswordField(false);
    setLoginModalOpen(false);
  };

  return (
    <>
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
                  if (
                    !company.socialLinks.facebook ||
                    company.socialLinks.facebook.startsWith('#')
                  ) {
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
                  if (
                    !company.socialLinks.linkedin ||
                    company.socialLinks.linkedin.startsWith('#')
                  ) {
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
                className={`py-2.5 lg:py-[25px] lg:px-[14px] font-medium transition-colors whitespace-nowrap ${
                  currentPath === '/' ? 'text-[#23838B]' : 'text-[#BE9C6A] hover:text-[#23838B]'
                }`}
              >
                {t.home}
              </a>

              <a
                href="/about-us"
                onClick={(e) => handleLinkClick(e, '/about-us')}
                className={`py-2.5 lg:py-[25px] lg:px-[14px] font-medium transition-colors whitespace-nowrap ${
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
                  className={`w-full text-start py-2.5 lg:py-[25px] lg:px-[14px] font-medium transition-colors flex items-center justify-between lg:justify-start whitespace-nowrap cursor-pointer ${
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
                className={`py-2.5 lg:py-[25px] lg:px-[14px] font-medium transition-colors whitespace-nowrap ${
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
                  className={`py-2.5 lg:py-[25px] lg:px-[14px] font-medium transition-colors whitespace-nowrap ${
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
                className={`py-2.5 lg:py-[25px] lg:px-[14px] font-medium transition-colors whitespace-nowrap ${
                  currentPath === '/contact-us'
                    ? 'text-[#23838B]'
                    : 'text-[#BE9C6A] hover:text-[#23838B]'
                }`}
              >
                {t.contactUs}
              </a>

              <div className="py-2.5 lg:py-[25px] lg:px-[10px] flex items-center">
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

              {/* Auth & Conditional Admin Dashboard Controls */}
              <div className="py-2.5 lg:py-[18px] lg:ps-2 flex flex-wrap items-center gap-2">
                {showAdminDashboardButton && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate('/admin');
                    }}
                    className="bg-[#23838B] hover:bg-[#1a666d] text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-full transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    <i className="fa fa-sliders-h"></i>
                    <span>{language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</span>
                  </button>
                )}

                {showAdminDashboardButton && currentStaffMember ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthNotice(null);
                      setLoginModalOpen(true);
                    }}
                    title="إدارة الحساب أو تبديل حساب Google"
                    className="border border-[#BE9C6A] text-[#BE9C6A] hover:bg-[#BE9C6A] hover:text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <i className="fa fa-user-check text-[#23838B]"></i>
                    <span>{currentStaffMember.name}</span>
                  </button>
                ) : signedInVisitorEmail && !visitorPreviewMode ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthNotice(null);
                      setLoginModalOpen(true);
                    }}
                    className="border border-[#BE9C6A]/60 text-[#BE9C6A] hover:border-[#23838B] hover:text-[#23838B] text-xs font-medium px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <i className="fa fa-user"></i>
                    <span dir="ltr">{signedInVisitorEmail.split('@')[0]}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthNotice(null);
                      if (visitorPreviewMode) {
                        setVisitorPreviewMode(false);
                      }
                      setLoginModalOpen(true);
                    }}
                    className="border border-[#BE9C6A] text-[#BE9C6A] hover:bg-[#23838B] hover:border-[#23838B] hover:text-white text-xs sm:text-sm font-medium px-4 py-1.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <i className="fa fa-sign-in-alt"></i>
                    <span>{language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Sign-In & Account Switcher Modal */}
      {loginModalOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLoginModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <img
                  src={company.logo}
                  alt="Logo"
                  referrerPolicy="no-referrer"
                  className="h-9 w-auto object-contain"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: '"Cairo", sans-serif' }}>
                    تسجيل الدخول وتبديل الحساب
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    الحسابات المضافة في قائمة الأدمنز يظهر لها زر لوحة التحكم تلقائياً
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLoginModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <i className="fa fa-times"></i>
              </button>
            </div>

            {/* Current Session Info if already signed in */}
            {(currentStaffMember || signedInVisitorEmail) && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800">
                    {currentStaffMember ? (
                      <span className="text-emerald-700">
                        <i className="fa fa-check-circle me-1"></i>
                        مسجل كأدمن/موظف: {currentStaffMember.name}
                      </span>
                    ) : (
                      <span className="text-slate-700">حساب زائر نشط</span>
                    )}
                  </div>
                  <div className="text-xs font-mono text-slate-500 truncate mt-0.5" dir="ltr">
                    {currentStaffMember?.email || signedInVisitorEmail}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {currentStaffMember && (
                    <button
                      type="button"
                      onClick={() => {
                        setLoginModalOpen(false);
                        onNavigate('/admin');
                      }}
                      className="px-3 py-1.5 bg-[#23838B] text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      لوحة التحكم
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      logoutAdmin();
                      setAuthNotice({
                        type: 'info',
                        text: 'تم تسجيل الخروج بنجاح.',
                      });
                    }}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    خروج
                  </button>
                </div>
              </div>
            )}

            {authNotice && (
              <div
                className={`p-3 rounded-xl text-xs font-medium border ${
                  authNotice.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : authNotice.type === 'error'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                {authNotice.text}
              </div>
            )}

            {/* 1. Google / Another Gmail Sign-In */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={googleBusy}
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 bg-[#23838B] hover:bg-[#1a666d] disabled:opacity-60 text-white font-bold rounded-xl transition flex items-center justify-center gap-2.5 text-sm shadow-sm cursor-pointer"
              >
                <i className="fab fa-google text-base"></i>
                <span>
                  {googleBusy
                    ? 'جاري فتح اختيار حساب Google...'
                    : currentStaffMember || signedInVisitorEmail
                    ? 'تبديل إلى حساب Google أو Gmail آخر'
                    : 'تسجيل الدخول بحساب Google أو Gmail آخر'}
                </span>
              </button>
              <p className="text-[11px] text-slate-500 text-center">
                يفتح نافذة اختيار حساب جوجل أو إضافة حساب Gmail آخر. إذا كان الإيميل مضافاً في قائمة الأدمنز سيظهر لك زر «لوحة التحكم» فوراً.
              </p>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-semibold">
                أو الدخول المباشر بالبريد الإلكتروني
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* 2. Direct Email / Gmail Login */}
            <form onSubmit={handleEmailSignIn} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  البريد الإلكتروني (Gmail أو إيميل العمل)
                </label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    const found = findStaffByEmail(e.target.value, siteState.staffMembers);
                    if (
                      found ||
                      e.target.value.trim().toLowerCase() === 'yr.play.com@gmail.com'
                    ) {
                      setShowPasswordField(true);
                    }
                  }}
                  placeholder="example@gmail.com"
                  className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:outline-none focus:border-[#23838B]"
                />
              </div>

              {showPasswordField && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    كلمة المرور / كود الدخول للموظف أو الأدمن
                  </label>
                  <input
                    type="password"
                    dir="ltr"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="أدخل كود الدخول المخصص لإيميلك"
                    className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:outline-none focus:border-[#23838B]"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer"
              >
                متابعة بالبريد الإلكتروني
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
