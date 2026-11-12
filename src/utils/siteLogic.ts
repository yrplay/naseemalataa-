import {
  CustomPage,
  LanguageCode,
  PRODUCT_CATEGORIES,
  PRODUCTS_LIST,
  ProductCategory,
  ProductItem,
  SiteState,
} from '../data/siteData';

export type PageRoute =
  | { type: 'home' }
  | { type: 'admin' }
  | { type: 'about-us' }
  | { type: 'products-categories' }
  | { type: 'all-products' }
  | { type: 'market-places' }
  | { type: 'contact-us' }
  | { type: 'privacy-policy' }
  | { type: 'terms-and-conditions' }
  | { type: 'category'; slug: string; category: ProductCategory }
  | { type: 'custom-page'; slug: string; page: CustomPage };

export function parseRoutePath(
  rawPath: string,
  categories: ProductCategory[] = PRODUCT_CATEGORIES,
  customPages: CustomPage[] = []
): PageRoute {
  const clean = rawPath.replace(/^https?:\/\/naseemalata\.sa/i, '').split('?')[0].split('#')[0];
  const normalized = clean.replace(/^\/+|\/+$/g, '').toLowerCase();

  if (!normalized || normalized === 'home') {
    return { type: 'home' };
  }
  if (normalized === 'admin' || normalized.startsWith('admin/')) {
    return { type: 'admin' };
  }
  if (normalized === 'about-us') {
    return { type: 'about-us' };
  }
  if (normalized === 'products-categories') {
    return { type: 'products-categories' };
  }
  if (normalized === 'all-products') {
    return { type: 'all-products' };
  }
  if (normalized === 'market-places') {
    return { type: 'market-places' };
  }
  if (normalized === 'contact-us') {
    return { type: 'contact-us' };
  }
  if (normalized === 'privacy-policy') {
    return { type: 'privacy-policy' };
  }
  if (normalized === 'terms-and-conditions') {
    return { type: 'terms-and-conditions' };
  }

  const matchedCustomPage = customPages.find(
    (p) => p.slug.replace(/^\/+|\/+$/g, '').toLowerCase() === normalized
  );
  if (matchedCustomPage) {
    return { type: 'custom-page', slug: matchedCustomPage.slug, page: matchedCustomPage };
  }

  const matchedCategory = categories.find(
    (cat) => cat.slug.toLowerCase() === normalized
  );
  if (matchedCategory) {
    return { type: 'category', slug: matchedCategory.slug, category: matchedCategory };
  }

  return { type: 'home' };
}

export function getProductsByCategorySlug(
  slug: string,
  products: ProductItem[] = PRODUCTS_LIST
): ProductItem[] {
  const cleanSlug = slug.trim().toLowerCase();
  if (!cleanSlug || cleanSlug === 'all') {
    return products;
  }
  return products.filter((item) =>
    item.categorySlugs.some((s) => s.toLowerCase() === cleanSlug)
  );
}

export function isRtlLanguage(lang: LanguageCode): boolean {
  return lang === 'ar' || lang === 'ur';
}

export function slugifyText(text: string): string {
  const cleaned = text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return cleaned || `item-${Date.now()}`;
}

export function moveArrayItem<T>(list: T[], index: number, direction: 'up' | 'down'): T[] {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || index >= list.length || targetIndex < 0 || targetIndex >= list.length) {
    return list;
  }
  const copy = [...list];
  const [removed] = copy.splice(index, 1);
  copy.splice(targetIndex, 0, removed);
  return copy;
}

export function addProductToState(state: SiteState, product: ProductItem): SiteState {
  return {
    ...state,
    products: [product, ...state.products],
  };
}

export function updateProductInState(state: SiteState, updated: ProductItem): SiteState {
  return {
    ...state,
    products: state.products.map((p) => (p.id === updated.id ? updated : p)),
  };
}

export function deleteProductFromState(state: SiteState, productId: string): SiteState {
  return {
    ...state,
    products: state.products.filter((p) => p.id !== productId),
  };
}

export function addCategoryToState(state: SiteState, category: ProductCategory): SiteState {
  return {
    ...state,
    categories: [...state.categories, category],
  };
}

export function updateCategoryInState(state: SiteState, updated: ProductCategory): SiteState {
  return {
    ...state,
    categories: state.categories.map((c) => (c.id === updated.id ? updated : c)),
  };
}

export function deleteCategoryFromState(state: SiteState, categoryId: string): SiteState {
  return {
    ...state,
    categories: state.categories.filter((c) => c.id !== categoryId),
  };
}

export interface ContactFormInput {
  userName: string;
  userEmail: string;
  subject: string;
  mobileNo: string;
  message: string;
}

export interface ContactValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof ContactFormInput, string>>;
}

export function validateContactForm(input: ContactFormInput): ContactValidationResult {
  const errors: Partial<Record<keyof ContactFormInput, string>> = {};

  if (!input.userName || input.userName.trim().length < 2) {
    errors.userName = 'Please enter your name.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!input.userEmail || !emailRegex.test(input.userEmail.trim())) {
    errors.userEmail = 'Please enter a valid email address.';
  }

  if (!input.subject || input.subject.trim().length < 2) {
    errors.subject = 'Please enter a subject.';
  }

  if (!input.mobileNo || input.mobileNo.trim().length < 6) {
    errors.mobileNo = 'Please enter a valid mobile number.';
  }

  if (!input.message || input.message.trim().length < 5) {
    errors.message = 'Please enter a message (at least 5 characters).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function verifyAdminCredentials(
  identifier: string,
  password: string,
  authConfig: { username: string; email: string; password: string }
): boolean {
  const cleanId = identifier.trim().toLowerCase();
  const validId =
    cleanId === authConfig.username.trim().toLowerCase() ||
    cleanId === authConfig.email.trim().toLowerCase();
  return validId && password === authConfig.password;
}

export function validateAdminCredentialUpdate(
  username: string,
  email: string,
  newPassword: string
): { valid: boolean; error?: string } {
  if (!username || username.trim().length < 3) {
    return { valid: false, error: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل.' };
  }
  if (!email || !email.includes('@')) {
    return { valid: false, error: 'يرجى إدخال بريد إلكتروني صحيح.' };
  }
  if (!newPassword || newPassword.length < 6) {
    return { valid: false, error: 'كلمة المرور يجب أن تكون 6 خانات على الأقل.' };
  }
  return { valid: true };
}
