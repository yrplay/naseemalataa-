import {
  CustomPage,
  DEFAULT_STAFF_MEMBERS,
  LanguageCode,
  PRODUCT_CATEGORIES,
  PRODUCTS_LIST,
  ProductCategory,
  ProductItem,
  SiteState,
  StaffMember,
  StaffPermissionKey,
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

export function safeDecodeUri(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function parseRoutePath(
  rawPath: string,
  categories: ProductCategory[] = PRODUCT_CATEGORIES,
  customPages: CustomPage[] = []
): PageRoute {
  const decoded = safeDecodeUri(rawPath);
  const withoutDomain = decoded.replace(/^https?:\/\/[^/]+/i, '');

  // Check query string or hash for portal/admin triggers
  const queryPart = withoutDomain.includes('?') ? withoutDomain.split('?')[1].split('#')[0] : '';
  const hashPart = withoutDomain.includes('#') ? withoutDomain.split('#')[1] : '';
  const searchParams = new URLSearchParams(queryPart);
  const portalParam = (searchParams.get('portal') || searchParams.get('mode') || '').toLowerCase();
  const normalizedHash = hashPart.replace(/^\/+|\/+$/g, '').trim().toLowerCase();

  if (
    portalParam === 'admin' ||
    portalParam === 'staff' ||
    searchParams.get('admin') === '1' ||
    normalizedHash === 'admin' ||
    normalizedHash === 'portal' ||
    normalizedHash === 'staff'
  ) {
    return { type: 'admin' };
  }

  const clean = withoutDomain.split('?')[0].split('#')[0];
  const normalized = clean.replace(/^\/+|\/+$/g, '').trim().toLowerCase();

  if (!normalized || normalized === 'home') {
    return { type: 'home' };
  }
  if (
    normalized === 'admin' ||
    normalized.startsWith('admin/') ||
    normalized === 'portal' ||
    normalized.startsWith('portal/') ||
    normalized === 'staff' ||
    normalized.startsWith('staff/')
  ) {
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
    (p) => safeDecodeUri(p.slug).replace(/^\/+|\/+$/g, '').trim().toLowerCase() === normalized
  );
  if (matchedCustomPage) {
    return { type: 'custom-page', slug: matchedCustomPage.slug, page: matchedCustomPage };
  }

  const matchedCategory = categories.find(
    (cat) =>
      safeDecodeUri(cat.slug).replace(/^\/+|\/+$/g, '').trim().toLowerCase() === normalized ||
      cat.id.toLowerCase() === normalized
  );
  if (matchedCategory) {
    return { type: 'category', slug: matchedCategory.slug, category: matchedCategory };
  }

  return { type: 'home' };
}

export function getProductsByCategorySlug(
  slug: string,
  products: ProductItem[] = PRODUCTS_LIST,
  categories: ProductCategory[] = PRODUCT_CATEGORIES
): ProductItem[] {
  const cleanSlug = safeDecodeUri(slug).replace(/^\/+|\/+$/g, '').trim().toLowerCase();
  if (!cleanSlug || cleanSlug === 'all') {
    return products;
  }

  // Find target category and any sibling categories with identical Arabic or English names
  const targetCategory = categories.find(
    (c) =>
      safeDecodeUri(c.slug).replace(/^\/+|\/+$/g, '').trim().toLowerCase() === cleanSlug ||
      c.id.toLowerCase() === cleanSlug
  );

  const matchingKeys = new Set<string>([cleanSlug]);
  if (targetCategory) {
    matchingKeys.add(targetCategory.slug.trim().toLowerCase());
    matchingKeys.add(targetCategory.id.trim().toLowerCase());
    if (targetCategory.titleAr.trim()) {
      matchingKeys.add(targetCategory.titleAr.trim().toLowerCase());
    }
    if (targetCategory.title.trim()) {
      matchingKeys.add(targetCategory.title.trim().toLowerCase());
    }

    // Also include sibling categories that share the exact same titleAr or title
    categories.forEach((sib) => {
      const sameAr =
        sib.titleAr.trim() !== '' &&
        sib.titleAr.trim() === targetCategory.titleAr.trim();
      const sameEn =
        sib.title.trim() !== '' &&
        sib.title.trim().toLowerCase() === targetCategory.title.trim().toLowerCase();
      if (sameAr || sameEn) {
        matchingKeys.add(sib.slug.trim().toLowerCase());
        matchingKeys.add(sib.id.trim().toLowerCase());
      }
    });
  }

  return products.filter((item) =>
    Array.isArray(item.categorySlugs) &&
    item.categorySlugs.some((s) => {
      const norm = safeDecodeUri(String(s)).replace(/^\/+|\/+$/g, '').trim().toLowerCase();
      return matchingKeys.has(norm);
    })
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
  const existing = state.categories.find((c) => c.id === updated.id);
  const oldSlug = existing?.slug?.trim().toLowerCase();
  const newSlug = updated.slug.trim();

  return {
    ...state,
    categories: state.categories.map((c) => (c.id === updated.id ? updated : c)),
    products:
      oldSlug && newSlug && oldSlug !== newSlug.toLowerCase()
        ? state.products.map((p) => ({
            ...p,
            categorySlugs: p.categorySlugs.map((s) =>
              s.trim().toLowerCase() === oldSlug ? newSlug : s
            ),
          }))
        : state.products,
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

export function findStaffByEmail(
  email: string,
  staffMembers: StaffMember[] = DEFAULT_STAFF_MEMBERS
): StaffMember | undefined {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return undefined;
  return staffMembers.find((s) => s.email.trim().toLowerCase() === cleanEmail);
}

export function hasStaffPermission(
  staff: StaffMember | null,
  permission: StaffPermissionKey
): boolean {
  if (!staff || !staff.active) return false;
  return Array.isArray(staff.permissions) && staff.permissions.includes(permission);
}
