export type LanguageCode = 'en' | 'ar' | 'ur' | 'hi';

export type HeroButtonStyle = 'primary' | 'secondary' | 'white' | 'outline';
export type HeroHorizontalPosition = 'right' | 'center' | 'left';
export type HeroVerticalPosition = 'top' | 'center' | 'bottom';
export type HeroImageFit = 'cover' | 'natural' | 'contain';

export interface HeroSlideButton {
  id: string;
  label: Record<LanguageCode, string>;
  link: string;
  style: HeroButtonStyle;
}

export interface HeroSlide {
  id: string;
  image: string;
  imageFit?: HeroImageFit;
  title: Record<LanguageCode, string>;
  showTitle?: boolean;
  primaryBtnText?: Record<LanguageCode, string>;
  primaryBtnLink?: string;
  secondaryBtnText?: Record<LanguageCode, string>;
  secondaryBtnLink?: string;
  buttons?: HeroSlideButton[];
  contentPosition?: HeroHorizontalPosition;
  buttonsPosition?: HeroHorizontalPosition;
  verticalPosition?: HeroVerticalPosition;
  buttonOffsetY?: number;
  buttonOffsetX?: number;
}

export interface ProductCategory {
  id: string;
  slug: string;
  title: string;
  titleAr: string;
  image: string;
  description: string;
  descriptionAr: string;
  isRtlDescription?: boolean;
  highlightYellow?: boolean;
}

export interface ProductItem {
  id: string;
  title: string;
  titleAr: string;
  price?: string;
  description?: string;
  descriptionAr?: string;
  image: string;
  categorySlugs: string[];
}

export interface MarketPlaceItem {
  id: string;
  title: string;
  titleAr: string;
  image: string;
  homeExcerpt: string;
  fullDescription: string;
  fullDescriptionAr: string;
}

export interface WorkAreaRow {
  id: string;
  no: string;
  area: string;
  areaAr: string;
  description: string;
  descriptionAr: string;
}

export interface ServiceGroup {
  id: string;
  heading: string;
  headingAr: string;
  items: string[];
  itemsAr: string[];
}

export interface AboutPageContent {
  companyBannerTitle: string;
  companyBannerSubtitle: string;
  whoWeAreHeading: string;
  whoWeAreParagraphs: string[];
  visionHeading: string;
  visionText: string;
  missionHeading: string;
  missionText: string;
  valuesHeading: string;
  valuesIntro: string;
  valuesList: string[];
  objectivesHeading: string;
  objectivesIntro: string;
  objectivesList: string[];
  areasHeading: string;
  areasIntro: string;
  areasTable: WorkAreaRow[];
  servicesHeading: string;
  servicesIntro: string;
  serviceGroups: ServiceGroup[];
}

export interface LegalSection {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface LegalPageContent {
  intro: string;
  sections: LegalSection[];
}

export interface CustomPage {
  id: string;
  slug: string;
  title: string;
  titleAr: string;
  content: string;
  contentAr: string;
  showInNavbar: boolean;
  showInFooter: boolean;
}

export interface ContactSubmission {
  id: string;
  userName: string;
  userEmail: string;
  subject: string;
  mobileNo: string;
  message: string;
  submittedAt: string;
  read: boolean;
}

export type HomeSectionKey = 'hero' | 'about' | 'categories' | 'products' | 'marketplaces';

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  lightBgColor: string;
  darkFooterColor: string;
  bgIconUrl: string;
  pageHeaderBgUrl: string;
  logoWidthPx: number;
  showTopBar: boolean;
  showBackToTop: boolean;
  homeSectionsOrder: HomeSectionKey[];
  hiddenHomeSections: HomeSectionKey[];
  customCss: string;
  headingFontFamily?: string;
}

export interface CompanyInfo {
  nameEn: string;
  nameFooter: string;
  nameAr: string;
  addressAr: string;
  email: string;
  phone: string;
  logo: string;
  profileLogo: string;
  mapEmbedUrl: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    linkedin: string;
    instagram: string;
    youtube: string;
  };
}

export interface UITranslationSet {
  followUs: string;
  home: string;
  aboutUs: string;
  products: string;
  productsCategories: string;
  allProducts: string;
  ourAllProducts: string;
  marketPlaces: string;
  ourMarketPlaces: string;
  contactUs: string;
  selectLanguage: string;
  exploreProducts: string;
  ourProducts: string;
  productsCategoriesSubtitle: string;
  ourProductsSubtitle: string;
  ourMarketPlacesSubtitle: string;
  footerAbout: string;
  address: string;
  quickLinks: string;
  privacyPolicy: string;
  termsAndConditions: string;
  allRightReserved: string;
  noProductsAvailable: string;
  callUs: string;
  emailUs: string;
  officeAddress: string;
  yourName: string;
  yourEmail: string;
  subject: string;
  mobileNo: string;
  message: string;
  sendMessage: string;
  contactSubtitle: string;
  pages: string;
}

export interface AdminAuthConfig {
  username: string;
  email: string;
  password: string;
  lastPublishedAt: string;
}

export type StaffPermissionKey =
  | 'overview'
  | 'company'
  | 'theme'
  | 'hero'
  | 'about'
  | 'categories'
  | 'products'
  | 'marketplaces'
  | 'pages'
  | 'messages'
  | 'staff';

export type StaffRolePreset =
  | 'super_admin'
  | 'products_manager'
  | 'content_editor'
  | 'support_agent'
  | 'custom';

export interface StaffMember {
  id: string;
  uid?: string;
  name: string;
  email: string;
  jobTitle: string;
  rolePreset: StaffRolePreset;
  accessCode?: string;
  permissions: StaffPermissionKey[];
  active: boolean;
  addedAt: string;
  addedByEmail?: string;
}

export interface StaffAuditEntry {
  id: string;
  staffName: string;
  staffEmail: string;
  action: string;
  timestamp: string;
}

export interface SiteState {
  company: CompanyInfo;
  theme: ThemeConfig;
  adminAuth: AdminAuthConfig;
  heroSlides: HeroSlide[];
  homeAbout: {
    image: string;
    heading: Record<LanguageCode, string>;
    description: Record<LanguageCode, string>;
    bullets: Record<LanguageCode, string[]>;
  };
  aboutPage: AboutPageContent;
  categories: ProductCategory[];
  products: ProductItem[];
  marketPlaces: MarketPlaceItem[];
  privacyPolicy: LegalPageContent;
  termsAndConditions: LegalPageContent;
  customPages: CustomPage[];
  uiTranslations: Record<LanguageCode, UITranslationSet>;
  contactMessages: ContactSubmission[];
  staffMembers: StaffMember[];
  staffAuditLog: StaffAuditEntry[];
}

export const COMPANY_INFO: CompanyInfo = {
  nameEn: 'Naseem Al-Ataa Trading Company',
  nameFooter: 'Naseem Alatta Trading Company',
  nameAr: 'شركة نسيم العطاء التجارية',
  addressAr: 'المملكة العربية السعودية - مكة المكرمة -حي الملك فهد',
  email: 'info@naseemalata.sa',
  phone: '+966555433512',
  logo: '/admin_css/logo.png',
  profileLogo: '/uploads/naseem-profile-logo.jpeg',
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3001156.4288297426!2d-78.01371936852176!3d42.72876761954724!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4ccc4bf0f123a5a9%3A0xddcfc6c1de189567!2sNew%20York%2C%20USA!5e0!3m2!1sen!2sbd!4v1603794290143!5m2!1sen!2sbd',
  socialLinks: {
    facebook: '#facebook',
    twitter: '#twitter',
    linkedin: '#linkedin',
    instagram: '#instagram',
    youtube: '#youtube',
  },
};

export const DEFAULT_THEME: ThemeConfig = {
  primaryColor: '#23838B',
  secondaryColor: '#BE9C6A',
  lightBgColor: '#F7F8FC',
  darkFooterColor: '#111111',
  bgIconUrl: '/front_css/img/bg-icon.png',
  pageHeaderBgUrl: '/front_css/img/carousel-1.jpg',
  logoWidthPx: 350,
  showTopBar: true,
  showBackToTop: true,
  homeSectionsOrder: ['hero', 'about', 'categories', 'products', 'marketplaces'],
  hiddenHomeSections: [],
  customCss: '',
  headingFontFamily: 'LIFTA SWASH V3',
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    image: '/front_css/img/carousel-1.jpg',
    title: {
      en: 'Quality You Can Trust',
      ar: 'جودة يمكنك الوثوق بها',
      ur: 'معیار جس پر آپ بھروسہ کر سکتے ہیں',
      hi: 'गुणवत्ता जिस पर आप भरोसा कर सकते हैं',
    },
    showTitle: true,
    primaryBtnLink: '/all-products',
    secondaryBtnLink: '/products-categories',
    contentPosition: 'right',
    buttonsPosition: 'right',
    verticalPosition: 'center',
    buttonOffsetY: 0,
    buttonOffsetX: 0,
    buttons: [
      {
        id: 'btn-1-1',
        label: {
          en: 'Products',
          ar: 'المنتجات',
          ur: 'مصنوعات',
          hi: 'उत्पाद',
        },
        link: '/all-products',
        style: 'primary',
      },
      {
        id: 'btn-1-2',
        label: {
          en: 'Products Categories',
          ar: 'أقسام المنتجات',
          ur: 'مصنوعات کی اقسام',
          hi: 'उत्पाद श्रेणियाँ',
        },
        link: '/products-categories',
        style: 'secondary',
      },
    ],
  },
  {
    id: 'slide-2',
    image: '/front_css/img/carousel-2.jpg',
    title: {
      en: 'Delivering Quality, Building Trust',
      ar: 'نقدم الجودة، ونبني الثقة',
      ur: 'معیار کی فراہمی، اعتماد کی تعمیر',
      hi: 'गुणवत्ता प्रदान करना, विश्वास बनाना',
    },
    showTitle: true,
    primaryBtnLink: '/all-products',
    secondaryBtnLink: '/products-categories',
    contentPosition: 'right',
    buttonsPosition: 'right',
    verticalPosition: 'center',
    buttonOffsetY: 0,
    buttonOffsetX: 0,
    buttons: [
      {
        id: 'btn-2-1',
        label: {
          en: 'Products',
          ar: 'المنتجات',
          ur: 'مصنوعات',
          hi: 'उत्पाद',
        },
        link: '/all-products',
        style: 'primary',
      },
      {
        id: 'btn-2-2',
        label: {
          en: 'Products Categories',
          ar: 'أقسام المنتجات',
          ur: 'مصنوعات کی اقسام',
          hi: 'उत्पाद श्रेणियाँ',
        },
        link: '/products-categories',
        style: 'secondary',
      },
    ],
  },
];

export const HOME_ABOUT = {
  image: '/front_css/img/about.jpg',
  heading: {
    en: 'Quality Food, Global Trading Excellence',
    ar: 'أغذية عالية الجودة، تميز في التجارة العالمية',
    ur: 'معیاری خوراک، عالمی تجارت میں برتری',
    hi: 'गुणवत्तापूर्ण भोजन, वैश्विक व्यापार उत्कृष्टता',
  },
  description: {
    en: 'We are a trusted food trading company specializing in sourcing, importing, exporting, and distributing premium-quality food products worldwide. With a commitment to quality, reliability, and customer satisfaction, we supply fresh, frozen, and packaged foods to supermarkets, restaurants, hotels, retailers, and businesses through efficient global logistics and competitive wholesale solutions.',
    ar: 'نحن شركة تجارة أغذية موثوقة متخصصة في توفير واستيراد وتصدير وتوزيع المنتجات الغذائية عالية الجودة في جميع أنحاء العالم. مع التزامنا بالجودة والموثوقية ورضا العملاء، نقوم بتوريد الأغذية الطازجة والمجمدة والمعبأة للسوبر ماركت والمطاعم والفنادق وتجار التجزئة والشركات من خلال خدمات لوجستية عالمية فعالة وحلول جملة تنافسية.',
    ur: 'ہم ایک قابل اعتماد فوڈ ٹریڈنگ کمپنی ہیں جو دنیا بھر میں اعلیٰ معیار کی غذائی مصنوعات کی سورسنگ، درآمد، برآمد اور تقسیم میں مہارت رکھتی ہے۔',
    hi: 'हम एक विश्वसनीय खाद्य व्यापार कंपनी हैं जो दुनिया भर में प्रीमियम गुणवत्ता वाले खाद्य उत्पादों की सोर्सिंग, आयात, निर्यात और वितरण में विशेषज्ञता रखती है।',
  },
  bullets: {
    en: [
      'Delivering Freshness, Building Trust Worldwide.',
      'Quality Food, Trusted Partnerships, Global Success.',
      'From Farm to Market, Excellence in Every Shipment.',
      'Connecting the World with Premium Food Products.',
      'Your Reliable Partner in Global Food Trading.',
    ],
    ar: [
      'تقديم الطزاجة وبناء الثقة في جميع أنحاء العالم.',
      'غذاء عالي الجودة، شراكات موثوقة، نجاح عالمي.',
      'من المزرعة إلى السوق، التميز في كل شحنة.',
      'ربط العالم بالمنتجات الغذائية الفاخرة.',
      'شريكك الموثوق في تجارة الأغذية العالمية.',
    ],
    ur: [
      'دنیا بھر میں تازگی کی فراہمی اور اعتماد کی تعمیر۔',
      'معیاری خوراک، قابل اعتماد شراکت داری، عالمی کامیابی۔',
      'کھیت سے مارکیٹ تک، ہر کھیپ میں برتری۔',
      'پریمیم فوڈ پروڈکٹس کے ساتھ دنیا کو جوڑنا۔',
      'عالمی فوڈ ٹریڈنگ میں آپ کا قابل اعتماد ساتھی۔',
    ],
    hi: [
      'दुनिया भर में ताजगी पहुंचाना और विश्वास बनाना।',
      'गुणवत्तापूर्ण भोजन, विश्वसनीय साझेदारी, वैश्विक सफलता।',
      'खेत से बाजार तक, हर शिपमेंट में उत्कृष्टता।',
      'प्रीमियम खाद्य उत्पादों के साथ दुनिया को जोड़ना।',
      'वैश्विक खाद्य व्यापार में आपका विश्वसनीय भागीदार।',
    ],
  },
};

export const DEFAULT_ABOUT_PAGE: AboutPageContent = {
  companyBannerTitle: 'شركة نسيم العطا التجارية',
  companyBannerSubtitle: 'شريكك في تنفيذ المشاريع ، حلول شاملة لتوافق تطلعاتك',
  whoWeAreHeading: 'من نحن؟',
  whoWeAreParagraphs: [
    'تأسست شركة نسيم الأعمال في ١١ ديسمبر ٢٠١٦، ومقرها الرئيسي في مكة المكرمة. تتخصص الشركة في تنفيذ المشاريع، بالإضافة إلى تقديم الحلول والخدمات طوال الفترة المختلفة.',
    'لدينا خبرة واسعة في تنفيذ المشاريع السنوية والموسمية. تشمل خدماتنا الشاملة للتجهيز والتوريد والتوزيع والتنفيذ الميداني، الشركات العامة والشركات تدعم المشاريع وقطاعات الحج والعمرة والضيافة.',
    'نسعى لبناء شراكات مبتكرة من خلال تقديم حلول مرنة ومبتكرة - ترتكز على الجودة والكفاءة والالتزام - لتلبية متطلباتهم الخاصة وإنشاء قيمة مضافة لأعمالهم. بصفتنا شركة رائدة في تصدير واستيراد المواد الغذائية، نفخر بالعمل مع الفنادق وشركات التموين ومصانع الأغذية ومتاجر التجزئة والموزعين والجهات الحكومية في مختلف أنحاء العالم. وقد بنينا سمعتنا على الجودة والنزاهة والشفافية والشراكات التي تدوم طويلاً.',
  ],
  visionHeading: 'رؤيتنا',
  visionText:
    'أن نكون الخيار الأول لتنفيذ المشاريع وتوفير الحلول والخدمات المتكاملة في مختلف القطاعات.',
  missionHeading: 'مهمتنا',
  missionText:
    'تنفيذ وإدارة المشاريع، وتقديم حلول وخدمات متكاملة عبر مختلف القطاعات - بكفاءة وجودة وابتكار - لضمان رضا العملاء، وتطوير قدرات الموظفين، وخلق قيمة مستدامة.',
  valuesHeading: 'قيمنا المؤسسية',
  valuesIntro:
    'نؤمن بأن استدامة الأعمال ونجاحها يرتكزان على مجموعة من القيم التي توجه أعمالنا وقراراتنا وعلاقاتنا مع عملائنا وشركائنا.',
  valuesList: [
    'الكفاءة',
    'الإنتاجية',
    'الموثوقية',
    'المرونة',
    'الطموح',
    'الابتكار',
    'الجودة',
    'الاستجابة',
  ],
  objectivesHeading: 'أهدافنا',
  objectivesIntro:
    'We strive for leadership and excellence in our operations through the following objectives:',
  objectivesList: [
    '1. Project execution and management: Carried out with efficiency and professionalism, in accordance with standards of quality and excellence.',
    '2. Achieving client satisfaction: By providing integrated solutions and services that meet client needs and exceed their expectations.',
    '3. Expanding the scope of our business and services: Entering new markets and sectors to foster growth and broaden our reach.',
    '4. Building sustainable strategic partnerships: Based on trust, credibility, and mutual interests.',
    '5. Developing innovative solutions and services: Designed to keep pace with market changes and address the evolving needs of our clients.',
    '6. Enhancing operational efficiency and productivity: Through performance optimization and the best possible use of resources.',
    '7. Attracting and developing human talent: While fostering a work environment that encourages creativity and excellence.',
    '8. Ensuring profitability and financial sustainability: To strengthen the company’s continuity and its capacity for growth and competitiveness.',
  ],
  areasHeading: 'Our Areas of Work',
  areasIntro:
    'We provide comprehensive solutions across various sectors, focusing on five key areas designed to meet client needs and support the efficient, professional execution of their projects.',
  areasTable: [
    {
      id: 'area-1',
      no: '1',
      area: 'Project Execution and Management',
      areaAr: 'تنفيذ وإدارة المشاريع',
      description:
        'Planning, preparing, implementing, and managing annual and seasonal projects for various sectors.',
      descriptionAr: 'تخطيط وتجهيز وتنفيذ وإدارة المشاريع السنوية والموسمية لمختلف القطاعات.',
    },
    {
      id: 'area-2',
      no: '2',
      area: 'General Trading and Supplies',
      areaAr: 'التجارة العامة والتوريدات',
      description:
        'Sourcing and supplying materials, products, provisions, and equipment tailored to client requirements.',
      descriptionAr: 'تأمين وتوريد المواد والمنتجات والتموينات والمعدات حسب متطلبات العملاء.',
    },
    {
      id: 'area-3',
      no: '3',
      area: 'Catering and Provisions',
      areaAr: 'الإعاشة والتموين',
      description:
        'Providing food supplies, meals, and catering essentials for Hajj and Umrah companies, commercial kitchens, and other relevant entities.',
      descriptionAr:
        'توفير الإمدادات الغذائية والوجبات ومستلزمات الإعاشة لشركات الحج والعمرة والمطابخ التجارية والجهات ذات العلاقة.',
    },
    {
      id: 'area-4',
      no: '4',
      area: 'Charitable and Community Projects',
      areaAr: 'المشاريع الخيرية والمجتمعية',
      description:
        'Executing initiatives for charitable organizations, non-profits, and donor entities—including food baskets, water distribution, Iftar meals, clothing, and more.',
      descriptionAr:
        'تنفيذ المبادرات للجمعيات الخيرية والجهات غير الربحية والمانحة بما يشمل السلال الغذائية وسقيا الماء وإفطار الصائمين والكسوة وغيرها.',
    },
    {
      id: 'area-5',
      no: '5',
      area: 'Operational and Logistical Support Services',
      areaAr: 'خدمات الدعم التشغيلي واللوجستي',
      description:
        'Offering warehousing, preparation, distribution, and field execution services to support client projects and business operations.',
      descriptionAr:
        'تقديم خدمات التخزين والتجهيز والتوزيع والتنفيذ الميداني لدعم مشاريع العملاء وعملياتهم التشغيلية.',
    },
  ],
  servicesHeading: 'Our Services',
  servicesIntro:
    'Naseem Al-Ataa Trading Company offers a diverse range of integrated services tailored to the needs of various sectors—encompassing planning, preparation, and procurement, through to execution, distribution, and delivery—all in accordance with client requirements and agreed-upon quality standards.',
  serviceGroups: [
    {
      id: 'srv-1',
      heading: 'I. Project Implementation and Management',
      headingAr: 'أولاً: تنفيذ وإدارة المشاريع',
      items: [
        '1. Planning and executing annual and seasonal projects.',
        '2. Managing projects and overseeing their implementation phases.',
        '3. Preparing sites and facilities in accordance with project requirements.',
        '4. Organizing operational processes and conducting field monitoring.',
        '5. Managing the delivery and distribution processes for beneficiaries.',
      ],
      itemsAr: [
        '1. تخطيط وتنفيذ المشاريع السنوية والموسمية.',
        '2. إدارة المشاريع والإشراف على مراحل تنفيذها.',
        '3. تجهيز المواقع والمرافق وفق متطلبات المشروع.',
        '4. تنظيم العمليات التشغيلية والمتابعة الميدانية.',
        '5. إدارة عمليات التسليم والتوزيع للمستفيدين.',
      ],
    },
  ],
};

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: 'cat-1',
    slug: 'food-baskets',
    title: 'Food baskets',
    titleAr: 'السلال الغذائية',
    image: '/uploads/naseem-profile-logo.jpeg',
    description: 'Procuring, preparing, and distributing food baskets to families and beneficiaries.',
    descriptionAr: 'تأمين وتجهيز وتوزيع السلال الغذائية للأسر والمستفيدين.',
  },
  {
    id: 'cat-2',
    slug: 'providing-water-to-drink',
    title: 'Providing water to drink',
    titleAr: 'سقيا الماء',
    image: '/uploads/naseem-profile-logo.jpeg',
    description: 'Implementing water supply projects and distributing water in the targeted locations',
    descriptionAr: 'تنفيذ مشاريع سقيا الماء وتوزيع المياه في المواقع المستهدفة',
  },
  {
    id: 'cat-3',
    slug: 'iftar-for-those-fasting',
    title: 'Iftar for those fasting',
    titleAr: 'إفطار الصائمين',
    image: '/uploads/naseem-profile-logo.jpeg',
    description: 'تجهيز وتوزيع وجبات الإفطار خلال شهر رمضان',
    descriptionAr: 'تجهيز وتوزيع وجبات الإفطار خلال شهر رمضان',
    isRtlDescription: true,
  },
  {
    id: 'cat-4',
    slug: 'pilgrim-s-food',
    title: "Pilgrim's Food",
    titleAr: 'إطعام الحجاج والمعتمرين',
    image: '/uploads/naseem-profile-logo.jpeg',
    description: 'تجهيز وتوزيع الوجبات لضيوف الرحمن',
    descriptionAr: 'تجهيز وتوزيع الوجبات لضيوف الرحمن',
    isRtlDescription: true,
  },
  {
    id: 'cat-5',
    slug: 'spices-herbs',
    title: 'Spices & Herbs',
    titleAr: 'التوابل والأعشاب',
    image: '/uploads/1782760009_spice.png',
    description:
      'Discover our extensive collection of premium spices and herbs including black pepper, turmeric, cumin, coriander, cinnamon, cloves, cardamom, paprika, oregano, thyme, rosemary, basil, and many other aromatic ingredients. Carefully',
    descriptionAr:
      'اكتشف مجموعتنا الواسعة من التوابل والأعشاب الفاخرة بما في ذلك الفلفل الأسود والكركم والكمون والكزبرة والقرفة والقرنفل والهيل والبابريكا والزعتر وإكليل الجبل والريحان والعديد من المكونات العطرية الأخرى.',
  },
  {
    id: 'cat-6',
    slug: 'pulses-lentils',
    title: 'Pulses & Lentils',
    titleAr: 'البقوليات والعدس',
    image: '/uploads/1782760001_heart.png',
    description:
      'Our Pulses & Lentils category features chickpeas, red lentils, green lentils, black beans, kidney beans, mung beans, peas, and other nutritious legumes. Rich in protein, fiber, vitamins, and minerals,',
    descriptionAr:
      'تضم فئة البقوليات والعدس لدينا الحمص والعدس الأحمر والعدس الأخضر والفاصوليا السوداء والفاصوليا الحمراء والبازلاء وغيرها من البقوليات المغذية الغنية بالبروتين والألياف والفيتامينات والمعادن.',
  },
  {
    id: 'cat-7',
    slug: 'cooking-oils',
    title: 'Cooking Oils',
    titleAr: 'زيوت الطبخ',
    image: '/uploads/1782759991_olive-oil.png',
    description:
      'We offer a complete range of premium cooking oils including sunflower oil, soybean oil, olive oil, canola oil, palm oil, corn oil, coconut oil, and blended edible oils. Our',
    descriptionAr:
      'نقدم مجموعة متكاملة من زيوت الطبخ الفاخرة بما في ذلك زيت عباد الشمس وزيت فول الصويا وزيت الزيتون وزيت الكانولا وزيت النخيل وزيت الذرة وزيت جوز الهند وزيوت الطعام المخلوطة.',
  },
  {
    id: 'cat-8',
    slug: 'seasonal-gifts-ar',
    title: 'الهدايا والمستلزمات الموسمية',
    titleAr: 'الهدايا والمستلزمات الموسمية',
    image: '/uploads/naseem-profile-logo.jpeg',
    description: 'تجهيز وتوزيع الهدايا والحقائب للمستفيدين',
    descriptionAr: 'تجهيز وتوزيع الهدايا والحقائب للمستفيدين',
    isRtlDescription: true,
  },
  {
    id: 'cat-9',
    slug: 'school-bags-ar',
    title: 'الحقائب المدرسية',
    titleAr: 'الحقائب المدرسية',
    image: '/uploads/naseem-profile-logo.jpeg',
    description: 'تجهيز وتوزيع الحقائب والمستلزمات الدراسية.',
    descriptionAr: 'تجهيز وتوزيع الحقائب والمستلزمات الدراسية.',
    isRtlDescription: true,
  },
  {
    id: 'cat-10',
    slug: 'winter-clothing-ar',
    title: 'الكسوة الشتوية',
    titleAr: 'الكسوة الشتوية',
    image: '/uploads/naseem-profile-logo.jpeg',
    description: 'توفير وتوزيع الملابس والمستلزمات الشتوية',
    descriptionAr: 'توفير وتوزيع الملابس والمستلزمات الشتوية',
    isRtlDescription: true,
  },
  {
    id: 'cat-11',
    slug: 'zakat-al-fitr',
    title: 'زكاة الفطر',
    titleAr: 'زكاة الفطر',
    image: '/uploads/naseem-profile-logo.jpeg',
    description: 'تجهيز وتوزيع المواد الغذائية للمستحقين وفق متطلبات الجهات المنظمة',
    descriptionAr: 'تجهيز وتوزيع المواد الغذائية للمستحقين وفق متطلبات الجهات المنظمة',
    isRtlDescription: true,
  },
  {
    id: 'cat-12',
    slug: 'winter-clothing',
    title: 'Winter Clothing',
    titleAr: 'الكسوة الشتوية',
    image: '/uploads/naseem-profile-logo.jpeg',
    description: 'Providing and distributing winter clothing and supplies',
    descriptionAr: 'توفير وتوزيع الملابس والمستلزمات الشتوية',
    isRtlDescription: true,
  },
  {
    id: 'cat-13',
    slug: 'school-bags',
    title: 'School bags',
    titleAr: 'الحقائب المدرسية',
    image: '/uploads/naseem-profile-logo.jpeg',
    description: 'Preparing and distributing school bags and supplies',
    descriptionAr: 'تجهيز وتوزيع الحقائب والمستلزمات المدرسية',
    highlightYellow: true,
  },
  {
    id: 'cat-14',
    slug: 'seasonal-gifts-and-supplies',
    title: 'Seasonal Gifts and Supplies',
    titleAr: 'الهدايا والمستلزمات الموسمية',
    image: '/uploads/naseem-profile-logo.jpeg',
    description: 'Preparing and distributing gifts and bags to beneficiaries',
    descriptionAr: 'تجهيز وتوزيع الهدايا والحقائب للمستفيدين',
  },
  {
    id: 'cat-15',
    slug: 'community-initiatives',
    title: 'Community Initiatives',
    titleAr: 'المبادرات المجتمعية',
    image: '/uploads/naseem-profile-logo.jpeg',
    description:
      'Implementing charitable and community programs and initiatives in collaboration with the beneficiary entities',
    descriptionAr: 'تنفيذ البرامج والمبادرات الخيرية والمجتمعية بالتعاون مع الجهات المستفيدة',
    isRtlDescription: true,
  },
];

export const PRODUCTS_LIST: ProductItem[] = [
  {
    id: 'prod-1',
    title: 'Fresh Tomato 1',
    titleAr: 'طماطم طازجة 1',
    image: '/uploads/1782929518_product-1.jpg',
    categorySlugs: ['providing-water-to-drink'],
  },
  {
    id: 'prod-2',
    title: 'Fresh Tomato 2',
    titleAr: 'طماطم طازجة 2',
    image: '/uploads/1782929518_product-1.jpg',
    categorySlugs: ['providing-water-to-drink'],
  },
  {
    id: 'prod-3',
    title: 'Fresh Tomato 3',
    titleAr: 'طماطم طازجة 3',
    image: '/uploads/naseem-profile-logo.jpeg',
    categorySlugs: [],
  },
];

export const MARKET_PLACES: MarketPlaceItem[] = [
  {
    id: 'mp-1',
    title: 'Supermarkets',
    titleAr: 'السوبر ماركت',
    image: '/uploads/1782762418_supermarket.png',
    homeExcerpt:
      'We supply supermarkets with premium-quality fresh, frozen, packaged, and organic food products through reliable wholesale distribution. Our consistent inventory, competitive pricing, and efficient logistics help supermarkets maintain fully stocked',
    fullDescription:
      'We supply supermarkets with premium-quality fresh, frozen, packaged, and organic food products through reliable wholesale distribution. Our consistent inventory, competitive pricing, and efficient logistics help supermarkets maintain fully stocked shelves while ensuring customers receive fresh and safe food products every day.',
    fullDescriptionAr:
      'نزود محلات السوبر ماركت بمنتجات غذائية طازجة ومجمدة ومعبأة وعضوية عالية الجودة من خلال توزيع الجملة الموثوق. يساعد مخزوننا المستمر وأسعارنا التنافسية وخدماتنا اللوجستية الفعالة السوبر ماركت في الحفاظ على أرفف مجهزة بالكامل مع ضمان حصول العملاء على منتجات غذائية طازجة وآمنة كل يوم.',
  },
  {
    id: 'mp-2',
    title: 'Restaurants',
    titleAr: 'المطاعم',
    image: '/uploads/1782762411_restaurant.png',
    homeExcerpt:
      'We provide restaurants with high-quality ingredients including fresh produce, meat, seafood, dairy products, spices, cooking oils, grains, and frozen foods. Our dependable supply chain, flexible ordering options, and timely',
    fullDescription:
      'We provide restaurants with high-quality ingredients including fresh produce, meat, seafood, dairy products, spices, cooking oils, grains, and frozen foods. Our dependable supply chain, flexible ordering options, and timely deliveries enable restaurants to serve exceptional meals while maintaining consistent quality and operational efficiency.',
    fullDescriptionAr:
      'نقدم للمطاعم مكونات عالية الجودة تشمل المنتجات الطازجة واللحوم والمأكولات البحرية ومنتجات الألبان والتوابل وزيوت الطبخ والحبوب والأغذية المجمدة. تمكن سلسلة التوريد الموثوقة وخيارات الطلب المرنة والتسليم في الوقت المناسب المطاعم من تقديم وجبات استثنائية.',
  },
  {
    id: 'mp-3',
    title: 'Hotels',
    titleAr: 'الفنادق',
    image: '/uploads/1782762403_5-stars.png',
    homeExcerpt:
      'Our hotel food supply solutions include premium fruits, vegetables, dairy products, beverages, seafood, meat, poultry, frozen foods, and specialty ingredients. We understand the hospitality industrys high standards and deliver fresh,',
    fullDescription:
      'Our hotel food supply solutions include premium fruits, vegetables, dairy products, beverages, seafood, meat, poultry, frozen foods, and specialty ingredients. We understand the hospitality industrys high standards and deliver fresh, hygienically packed products that support outstanding guest dining experiences.',
    fullDescriptionAr:
      'تشمل حلول توريد الأغذية للفنادق لدينا الفواكه والخضروات الفاخرة ومنتجات الألبان والمشروبات والمأكولات البحرية واللحوم والدواجن والأغذية المجمدة والمكونات المتخصصة التي تلبي أعلى معايير الضيافة.',
  },
  {
    id: 'mp-4',
    title: 'Catering Companies',
    titleAr: 'شركات التموين والإعاشة',
    image: '/uploads/1782762397_catering.png',
    homeExcerpt:
      'We partner with catering companies by supplying bulk food products for weddings, corporate events, educational institutions, and private functions. Our wide product range, dependable logistics, and customized packaging ensure catering',
    fullDescription:
      'We partner with catering companies by supplying bulk food products for weddings, corporate events, educational institutions, and private functions. Our wide product range, dependable logistics, and customized packaging ensure catering businesses receive quality ingredients on schedule for events of every size.',
    fullDescriptionAr:
      'نتشارك مع شركات التموين والإعاشة من خلال توريد المنتجات الغذائية بالجملة للمناسبات والفعاليات والمؤسسات التعليمية والحج والعمرة، مع ضمان الجودة والالتزام بالمواعيد.',
  },
  {
    id: 'mp-5',
    title: 'Food Manufacturers',
    titleAr: 'مصانع الأغذية',
    image: '/uploads/1782762390_food-processing.png',
    homeExcerpt:
      'We supply food manufacturers with premium raw materials including grains, spices, oils, sugar, salt, dairy ingredients, pulses, frozen products, and specialty food ingredients. Our reliable sourcing, quality assurance, and',
    fullDescription:
      'We supply food manufacturers with premium raw materials including grains, spices, oils, sugar, salt, dairy ingredients, pulses, frozen products, and specialty food ingredients. Our reliable sourcing, quality assurance, and consistent supply support efficient food production and manufacturing operations.',
    fullDescriptionAr:
      'نزود مصانع الأغذية بالمواد الخام الفاخرة بما في ذلك الحبوب والتوابل والزيوت والسكر والملح ومكونات الألبان والبقوليات والمنتجات المجمدة لدعم عمليات الإنتاج والتصنيع الغذائي بكفاءة.',
  },
  {
    id: 'mp-6',
    title: 'Retail Stores',
    titleAr: 'متاجر التجزئة',
    image: '/uploads/1782762384_shopping-online.png',
    homeExcerpt:
      'Our wholesale food distribution services help retail stores offer customers premium-quality food products at competitive prices. From packaged foods and beverages to fresh produce and organic products, we provide',
    fullDescription:
      'Our wholesale food distribution services help retail stores offer customers premium-quality food products at competitive prices. From packaged foods and beverages to fresh produce and organic products, we provide dependable supply solutions that improve inventory management and customer satisfaction.',
    fullDescriptionAr:
      'تساعد خدمات توزيع الأغذية بالجملة لدينا متاجر التجزئة على تقديم منتجات غذائية عالية الجودة للعملاء بأسعار تنافسية، من الأغذية المعبأة والمشروبات إلى المنتجات الطازجة والعضوية.',
  },
  {
    id: 'mp-7',
    title: 'Government Supply',
    titleAr: 'التوريد الحكومي',
    image: '/uploads/1782762362_lorry.png',
    homeExcerpt:
      'We provide reliable food supply solutions for government departments, public institutions, schools, relief programs, and community organizations. Our procurement process follows strict quality standards, ensuring safe, nutritious, and high-quality',
    fullDescription:
      'We provide reliable food supply solutions for government departments, public institutions, schools, relief programs, and community organizations. Our procurement process follows strict quality standards, ensuring safe, nutritious, and high-quality food products are delivered efficiently and on time.',
    fullDescriptionAr:
      'نقدم حلول توريد غذائية موثوقة للجهات الحكومية والمؤسسات العامة والمدارس وبرامج الإغاثة والجمعيات المجتمعية وفق معايير جودة صارمة لضمان تسليم منتجات غذائية آمنة ومغذية في الوقت المحدد.',
  },
  {
    id: 'mp-8',
    title: 'Healthcare Sector',
    titleAr: 'قطاع الرعاية الصحية',
    image: '/uploads/1782762354_healthcare.png',
    homeExcerpt:
      'We support hospitals, healthcare facilities, clinics, and medical institutions with safe, nutritious, and hygienically packaged food products. Our strict quality control, certified sourcing, and dependable logistics ensure healthcare providers',
    fullDescription:
      'We support hospitals, healthcare facilities, clinics, and medical institutions with safe, nutritious, and hygienically packaged food products. Our strict quality control, certified sourcing, and dependable logistics ensure healthcare providers receive fresh and reliable food supplies that meet high safety and nutritional standards.',
    fullDescriptionAr:
      'ندعم المستشفيات ومرافق الرعاية الصحية والعيادات والمؤسسات الطبية بمنتجات غذائية آمنة ومغذية ومعبأة صحياً تلبي أعلى معايير السلامة والتغذية.',
  },
];

export const DEFAULT_PRIVACY_POLICY: LegalPageContent = {
  intro:
    'Welcome to Al Naseem Al Atta. We value your privacy and are committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, store, disclose, and protect your information when you visit our website or use our services. By accessing our website, you agree to the practices described in this Privacy Policy.',
  sections: [
    {
      id: 'priv-1',
      heading: 'Information We Collect',
      paragraphs: [
        'We may collect personal and business information when you interact with our website or contact our team. The information we collect may include your name, company name, email address, phone number, country, business address, shipping information, billing information, and any details you provide through contact forms, quotation requests, or customer support inquiries.',
        'We may also collect technical information automatically, including your IP address, browser type, operating system, device information, pages visited, referring website, visit duration, and browsing behavior. This information helps us improve website performance, security, and user experience.',
      ],
    },
    {
      id: 'priv-2',
      heading: 'How We Use Your Information',
      paragraphs: [
        'The information we collect is used to provide and improve our services, respond to inquiries, prepare quotations, process orders, manage customer accounts, arrange deliveries, communicate important updates, provide customer support, and improve our website.',
        'We never sell your personal information to third parties.',
      ],
      bullets: [
        'Process import and export inquiries.',
        'Respond to product and pricing requests.',
        'Deliver requested products and services.',
        'Verify customer identity.',
        'Improve customer experience.',
        'Maintain business relationships.',
        'Send important service notifications.',
        'Comply with legal obligations.',
        'Prevent fraud and unauthorized activities.',
        'Improve website functionality.',
        'Conduct internal analysis and reporting.',
      ],
    },
    {
      id: 'priv-3',
      heading: 'Cookies and Tracking Technologies',
      paragraphs: [
        'Our website uses cookies and similar technologies to improve functionality and provide a better browsing experience. Cookies help us remember user preferences, analyze website traffic, improve navigation, and enhance security.',
      ],
    },
    {
      id: 'priv-4',
      heading: 'Information Sharing',
      paragraphs: [
        'We only share information when necessary to provide our services or comply with legal obligations, including shipping companies, freight forwarders, customs brokers, payment processors, logistics partners, and government authorities when legally required.',
      ],
    },
    {
      id: 'priv-5',
      heading: 'Data Security',
      paragraphs: [
        'Protecting customer information is a top priority. We implement appropriate technical, administrative, and organizational security measures designed to protect personal information against unauthorized access, disclosure, alteration, or destruction.',
      ],
    },
    {
      id: 'priv-6',
      heading: 'Contact Us',
      paragraphs: [
        'If you have any questions regarding this Privacy Policy, your personal information, or our privacy practices, please contact us.',
      ],
    },
  ],
};

export const DEFAULT_TERMS_CONDITIONS: LegalPageContent = {
  intro:
    'Welcome to Al Naseem Al Atta. These Terms and Conditions ("Terms") govern your access to and use of our website, products, and services. By visiting our website, requesting quotations, placing orders, or engaging in business with us, you agree to comply with these Terms.',
  sections: [
    {
      id: 'term-1',
      heading: 'Acceptance of Terms',
      paragraphs: [
        'By accessing this website, you acknowledge that you have read, understood, and agreed to these Terms and Conditions. These Terms apply to all visitors, customers, suppliers, distributors, business partners, and users of our website and services.',
      ],
    },
    {
      id: 'term-2',
      heading: 'About Our Company',
      paragraphs: [
        'Naseem Al-Ataa Trading Company is a professional food trading company specializing in the sourcing, import, export, wholesale distribution, and supply of premium-quality food products. We serve supermarkets, restaurants, hotels, catering companies, food manufacturers, retail stores, government institutions, healthcare facilities, wholesalers, and distributors in domestic and international markets.',
      ],
    },
    {
      id: 'term-3',
      heading: 'Products and Services',
      paragraphs: ['We offer a wide range of food products, including but not limited to:'],
      bullets: [
        'Fresh Fruits & Fresh Vegetables',
        'Frozen Foods & Rice & Grains',
        'Spices & Herbs',
        'Pulses & Lentils',
        'Cooking Oils, Sugar & Salt',
        'Dairy Products, Meat & Poultry, Seafood',
        'Beverages, Canned Foods, Dry Fruits & Nuts, Organic Products',
      ],
    },
    {
      id: 'term-4',
      heading: 'Quotations, Orders & Pricing',
      paragraphs: [
        'All quotations provided by our company are subject to product availability, market prices, shipping costs, currency exchange rates, and supplier confirmation. Orders are considered confirmed only after written acceptance by our company and, where applicable, receipt of the agreed payment or deposit.',
      ],
    },
    {
      id: 'term-5',
      heading: 'Shipping and Delivery',
      paragraphs: [
        'We work with trusted logistics providers to deliver products efficiently and securely. Delivery schedules are estimated based on supplier production, shipping routes, customs clearance, and transportation conditions.',
      ],
    },
  ],
};

export const UI_TRANSLATIONS: Record<LanguageCode, UITranslationSet> = {
  en: {
    followUs: 'Follow us:',
    home: 'Home',
    aboutUs: 'About Us',
    products: 'Products',
    productsCategories: 'Products Categories',
    allProducts: 'All Products',
    ourAllProducts: 'Our All Products',
    marketPlaces: 'Market Places',
    ourMarketPlaces: 'Our Market Places',
    contactUs: 'Contact Us',
    selectLanguage: 'Select Language',
    exploreProducts: 'Explore Products',
    ourProducts: 'Our Products',
    productsCategoriesSubtitle:
      'Explore our premium range of fresh, frozen, organic, and packaged food products sourced from trusted global suppliers.',
    ourProductsSubtitle:
      'Discover premium-quality food products sourced globally, ensuring freshness, safety, exceptional taste, and reliable wholesale supply.',
    ourMarketPlacesSubtitle:
      'Serving supermarkets, restaurants, hotels, retailers, manufacturers, government institutions, and healthcare sectors with premium food solutions.',
    footerAbout:
      'We are a trusted food trading company specializing in sourcing, importing, exporting, and distributing premium-quality food products worldwide.',
    address: 'Address',
    quickLinks: 'Quick Links',
    privacyPolicy: 'Privacy Policy',
    termsAndConditions: 'Terms & Conditions',
    allRightReserved: 'All Right Reserved.',
    noProductsAvailable: 'No products available.',
    callUs: 'Call Us',
    emailUs: 'Email Us',
    officeAddress: 'Office Address',
    yourName: 'Your Name',
    yourEmail: 'Your Email',
    subject: 'Subject',
    mobileNo: 'Mobile No.',
    message: 'Message',
    sendMessage: 'Send Message',
    contactSubtitle:
      "Connect with our dedicated team today for reliable support, expert guidance, and personalized solutions. We're committed to answering your questions and helping your business succeed every step of the way.",
    pages: 'Pages',
  },
  ar: {
    followUs: 'تابعنا:',
    home: 'الرئيسية',
    aboutUs: 'من نحن',
    products: 'المنتجات',
    productsCategories: 'أقسام المنتجات',
    allProducts: 'جميع المنتجات',
    ourAllProducts: 'جميع منتجاتنا',
    marketPlaces: 'قطاعات العمل',
    ourMarketPlaces: 'قطاعات عملنا',
    contactUs: 'تواصل معنا',
    selectLanguage: 'اختر اللغة',
    exploreProducts: 'استكشف المنتجات',
    ourProducts: 'منتجاتنا',
    productsCategoriesSubtitle:
      'استكشف مجموعتنا المتميزة من المنتجات الغذائية الطازجة والمجمدة والعضوية والمعبأة من موردين عالميين موثوقين.',
    ourProductsSubtitle:
      'اكتشف منتجات غذائية عالية الجودة يتم توفيرها عالمياً لضمان الطزاجة والسلامة والطعم الاستثنائي والتوريد الموثوق بالجملة.',
    ourMarketPlacesSubtitle:
      'نخدم السوبر ماركت والمطاعم والفنادق ومتاجر التجزئة والمصانع والمؤسسات الحكومية وقطاعات الرعاية الصحية بحلول غذائية متميزة.',
    footerAbout:
      'نحن شركة تجارة أغذية موثوقة متخصصة في توفير واستيراد وتصدير وتوزيع المنتجات الغذائية عالية الجودة في جميع أنحاء العالم.',
    address: 'العنوان',
    quickLinks: 'روابط سريعة',
    privacyPolicy: 'سياسة الخصوصية',
    termsAndConditions: 'الشروط والأحكام',
    allRightReserved: 'جميع الحقوق محفوظة.',
    noProductsAvailable: 'لا توجد منتجات متاحة حالياً.',
    callUs: 'اتصل بنا',
    emailUs: 'راسلنا عبر البريد',
    officeAddress: 'عنوان المكتب',
    yourName: 'الاسم الكامل',
    yourEmail: 'البريد الإلكتروني',
    subject: 'الموضوع',
    mobileNo: 'رقم الجوال',
    message: 'الرسالة',
    sendMessage: 'إرسال الرسالة',
    contactSubtitle:
      'تواصل مع فريقنا المختص اليوم للحصول على دعم موثوق وإرشاد متخصص وحلول مصممة لاحتياجاتك. نحن ملتزمون بالإجابة على استفساراتك ومساعدة أعمالك على النجاح.',
    pages: 'الصفحات',
  },
  ur: {
    followUs: 'ہمیں فالو کریں:',
    home: 'ہوم',
    aboutUs: 'ہمارے بارے میں',
    products: 'مصنوعات',
    productsCategories: 'مصنوعات کی اقسام',
    allProducts: 'تمام مصنوعات',
    ourAllProducts: 'ہماری تمام مصنوعات',
    marketPlaces: 'مارکیٹ پلیسز',
    ourMarketPlaces: 'ہمارے مارکیٹ پلیسز',
    contactUs: 'رابطہ کریں',
    selectLanguage: 'زبان منتخب کریں',
    exploreProducts: 'مصنوعات دیکھیں',
    ourProducts: 'ہماری مصنوعات',
    productsCategoriesSubtitle:
      'قابل اعتماد عالمی سپلائرز سے حاصل کردہ تازہ، منجمد، آرگینک اور پیک شدہ غذائی مصنوعات کی ہماری پریمیم رینج دریافت کریں۔',
    ourProductsSubtitle:
      'عالمی سطح پر حاصل کردہ اعلیٰ معیار کی غذائی مصنوعات دریافت کریں جو تازگی، حفاظت اور بہترین ذائقہ کو یقینی بناتی ہیں۔',
    ourMarketPlacesSubtitle:
      'سپر مارکیٹس، ریستوران، ہوٹل، ریٹیلرز، مینوفیکچررز، سرکاری اداروں اور ہیلتھ کیئر سیکٹرز کو پریمیم فوڈ سلوشنز فراہم کرنا۔',
    footerAbout:
      'ہم ایک قابل اعتماد فوڈ ٹریڈنگ کمپنی ہیں جو دنیا بھر میں اعلیٰ معیار کی غذائی مصنوعات کی سورسنگ، درآمد، برآمد اور تقسیم میں مہارت رکھتی ہے۔',
    address: 'پتہ',
    quickLinks: 'فوری لنکس',
    privacyPolicy: 'پرائیویسی پالیسی',
    termsAndConditions: 'شرائط و ضوابط',
    allRightReserved: 'جملہ حقوق محفوظ ہیں۔',
    noProductsAvailable: 'کوئی پروڈکٹ دستیاب نہیں ہے۔',
    callUs: 'ہمیں کال کریں',
    emailUs: 'ای میل کریں',
    officeAddress: 'دفتر کا پتہ',
    yourName: 'آپ کا نام',
    yourEmail: 'آپ کا ای میل',
    subject: 'موضوع',
    mobileNo: 'موبائل نمبر',
    message: 'پیغام',
    sendMessage: 'پیغام بھیجیں',
    contactSubtitle:
      'قابل اعتماد سپورٹ اور بہترین حل کے لیے آج ہی ہماری ٹیم سے رابطہ کریں۔',
    pages: 'صفحات',
  },
  hi: {
    followUs: 'हमें फॉलो करें:',
    home: 'होम',
    aboutUs: 'हमारे बारे में',
    products: 'उत्पाद',
    productsCategories: 'उत्पाद श्रेणियाँ',
    allProducts: 'सभी उत्पाद',
    ourAllProducts: 'हमारे सभी उत्पाद',
    marketPlaces: 'मार्केट प्लेस',
    ourMarketPlaces: 'हमारे मार्केट प्लेस',
    contactUs: 'संपर्क करें',
    selectLanguage: 'भाषा चुनें',
    exploreProducts: 'उत्पाद देखें',
    ourProducts: 'हमारे उत्पाद',
    productsCategoriesSubtitle:
      'विश्वसनीय वैश्विक आपूर्तिकर्ताओं से प्राप्त ताज़ा, फ्रोजन, जैविक और पैक किए गए खाद्य उत्पादों की हमारी प्रीमियम रेंज देखें।',
    ourProductsSubtitle:
      'विश्व स्तर पर प्राप्त प्रीमियम गुणवत्ता वाले खाद्य उत्पादों की खोज करें।',
    ourMarketPlacesSubtitle:
      'सुपरमार्केट, रेस्तरां, होटल, खुदरा विक्रेताओं, निर्माताओं, सरकारी संस्थानों और स्वास्थ्य सेवा क्षेत्रों को प्रीमियम खाद्य समाधान प्रदान करना।',
    footerAbout:
      'हम एक विश्वसनीय खाद्य व्यापार कंपनी हैं जो दुनिया भर में प्रीमियम गुणवत्ता वाले खाद्य उत्पादों की सोर्सिंग, आयात, निर्यात और वितरण में विशेषज्ञता रखती है।',
    address: 'पता',
    quickLinks: 'त्वरित लिंक',
    privacyPolicy: 'गोपनीयता नीति',
    termsAndConditions: 'नियम एवं शर्तें',
    allRightReserved: 'सर्वाधिकार सुरक्षित।',
    noProductsAvailable: 'कोई उत्पाद उपलब्ध नहीं है।',
    callUs: 'हमें कॉल करें',
    emailUs: 'हमें ईमेल करें',
    officeAddress: 'कार्यालय का पता',
    yourName: 'आपका नाम',
    yourEmail: 'आपका ईमेल',
    subject: 'विषय',
    mobileNo: 'मोबाइल नंबर',
    message: 'संदेश',
    sendMessage: 'संदेश भेजें',
    contactSubtitle:
      'विश्वसनीय समर्थन और व्यक्तिगत समाधानों के लिए आज ही हमारी समर्पित टीम से जुड़ें।',
    pages: 'पेज',
  },
};

export const ALL_STAFF_PERMISSIONS: StaffPermissionKey[] = [
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
  'staff',
];

export const STAFF_ROLE_PRESETS: Record<
  StaffRolePreset,
  { labelAr: string; defaultTitleAr: string; permissions: StaffPermissionKey[] }
> = {
  super_admin: {
    labelAr: 'مدير عام كامل الصلاحيات (Super Admin)',
    defaultTitleAr: 'مدير عام النظام',
    permissions: [...ALL_STAFF_PERMISSIONS],
  },
  products_manager: {
    labelAr: 'مسؤول المنتجات والأقسام والقطاعات',
    defaultTitleAr: 'مسؤول إدارة المنتجات والأقسام',
    permissions: ['overview', 'categories', 'products', 'marketplaces'],
  },
  content_editor: {
    labelAr: 'محرر محتوى الواجهة والصفحات والسلايدر',
    defaultTitleAr: 'محرر المحتوى والصفحات',
    permissions: ['overview', 'company', 'theme', 'hero', 'about', 'pages'],
  },
  support_agent: {
    labelAr: 'مسؤول خدمة العملاء ورسائل التواصل',
    defaultTitleAr: 'مسؤول خدمة العملاء',
    permissions: ['overview', 'messages'],
  },
  custom: {
    labelAr: 'صلاحيات مخصصة (تحديد يدوي)',
    defaultTitleAr: 'موظف إداري',
    permissions: ['overview', 'products'],
  },
};

export const DEFAULT_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'staff-owner',
    name: 'المدير العام (المالك)',
    email: 'yr.play.com@gmail.com',
    jobTitle: 'المدير العام ومالك النظام (Super Admin)',
    rolePreset: 'super_admin',
    accessCode: 'Naseem@2026',
    permissions: [...ALL_STAFF_PERMISSIONS],
    active: true,
    addedAt: '2026-11-12',
    addedByEmail: 'yr.play.com@gmail.com',
  },
];

export const DEFAULT_ADMIN_AUTH: AdminAuthConfig = {
  username: 'admin',
  email: 'info@naseemalata.sa',
  password: 'Naseem@2026',
  lastPublishedAt: '2026-11-12 09:00 AM',
};

export function createDefaultSiteState(): SiteState {
  return JSON.parse(
    JSON.stringify({
      company: COMPANY_INFO,
      theme: DEFAULT_THEME,
      adminAuth: DEFAULT_ADMIN_AUTH,
      heroSlides: HERO_SLIDES,
      homeAbout: HOME_ABOUT,
      aboutPage: DEFAULT_ABOUT_PAGE,
      categories: PRODUCT_CATEGORIES,
      products: PRODUCTS_LIST,
      marketPlaces: MARKET_PLACES,
      privacyPolicy: DEFAULT_PRIVACY_POLICY,
      termsAndConditions: DEFAULT_TERMS_CONDITIONS,
      customPages: [],
      uiTranslations: UI_TRANSLATIONS,
      contactMessages: [
        {
          id: 'msg-seed-1',
          userName: 'مؤسسة الهدى الخيرية',
          userEmail: 'procurement@alhuda.org.sa',
          subject: 'طلب توريد 2,500 سلة غذائية ومياه شرب لموسم رمضان',
          mobileNo: '+966501234567',
          message:
            'السلام عليكم ورحمة الله، نرغب في الحصول على عرض سعر رسمي لتجهيز وتوزيع 2,500 سلة غذائية و5,000 كرتون مياه شرب في مكة المكرمة.',
          submittedAt: '2026-11-11 09:30 AM',
          read: false,
        },
      ],
      staffMembers: DEFAULT_STAFF_MEMBERS,
      staffAuditLog: [
        {
          id: 'audit-seed-1',
          staffName: 'المدير العام (المالك)',
          staffEmail: 'yr.play.com@gmail.com',
          action: 'تأسيس النظام وتفعيل إدارة الموظفين والصلاحيات السحابية',
          timestamp: '2026-11-12 09:00 AM',
        },
      ],
    })
  );
}
