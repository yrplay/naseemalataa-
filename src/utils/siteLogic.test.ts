import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseRoutePath,
  getProductsByCategorySlug,
  isRtlLanguage,
  validateContactForm,
  addProductToState,
  deleteProductFromState,
  addCategoryToState,
  moveArrayItem,
  slugifyText,
  verifyAdminCredentials,
  validateAdminCredentialUpdate,
  hasStaffPermission,
} from './siteLogic';
import { createDefaultSiteState, DEFAULT_ADMIN_AUTH, StaffMember } from '../data/siteData';

test('parseRoutePath resolves main pages, admin route, custom pages, and category slugs accurately', () => {
  assert.equal(parseRoutePath('/').type, 'home');
  assert.equal(parseRoutePath('/admin').type, 'admin');
  assert.equal(parseRoutePath('/about-us').type, 'about-us');
  assert.equal(parseRoutePath('https://naseemalata.sa/market-places').type, 'market-places');
  assert.equal(parseRoutePath('/contact-us').type, 'contact-us');
  assert.equal(parseRoutePath('/privacy-policy').type, 'privacy-policy');
  assert.equal(parseRoutePath('/terms-and-conditions').type, 'terms-and-conditions');

  const catRoute = parseRoutePath('/providing-water-to-drink');
  assert.equal(catRoute.type, 'category');
  if (catRoute.type === 'category') {
    assert.equal(catRoute.slug, 'providing-water-to-drink');
    assert.equal(catRoute.category.title, 'Providing water to drink');
  }

  const customRoute = parseRoutePath(
    '/our-certificates',
    [],
    [
      {
        id: 'cp-1',
        slug: 'our-certificates',
        title: 'Our Certificates',
        titleAr: 'شهاداتنا',
        content: 'ISO 9001 Certified',
        contentAr: 'حاصلون على شهادة الأيزو',
        showInNavbar: true,
        showInFooter: true,
      },
    ]
  );
  assert.equal(customRoute.type, 'custom-page');
});

test('getProductsByCategorySlug returns matching products for providing-water-to-drink and empty for food-baskets', () => {
  const waterProducts = getProductsByCategorySlug('providing-water-to-drink');
  assert.equal(waterProducts.length, 2);
  assert.equal(waterProducts[0].title, 'Fresh Tomato 1');
  assert.equal(waterProducts[1].title, 'Fresh Tomato 2');

  const basketProducts = getProductsByCategorySlug('food-baskets');
  assert.equal(basketProducts.length, 0);

  const allProducts = getProductsByCategorySlug('all');
  assert.equal(allProducts.length, 3);
});

test('CMS CRUD operations add, reorder, and delete products and categories immutably', () => {
  const initial = createDefaultSiteState();
  assert.equal(initial.products.length, 3);

  const withAdded = addProductToState(initial, {
    id: 'prod-new',
    title: 'Premium Sukkari Dates',
    titleAr: 'تمر سكري فاخر',
    image: '/uploads/1782929518_product-1.jpg',
    categorySlugs: ['food-baskets'],
  });
  assert.equal(withAdded.products.length, 4);
  assert.equal(getProductsByCategorySlug('food-baskets', withAdded.products).length, 1);

  const afterDelete = deleteProductFromState(withAdded, 'prod-new');
  assert.equal(afterDelete.products.length, 3);

  const withCategory = addCategoryToState(initial, {
    id: 'cat-new',
    slug: 'dates-and-honey',
    title: 'Dates & Honey',
    titleAr: 'التمور والعسل',
    image: '/uploads/naseem-profile-logo.jpeg',
    description: 'Premium Saudi dates and natural honey.',
    descriptionAr: 'تمور سعودية فاخرة وعسل طبيعي.',
  });
  assert.equal(withCategory.categories.length, 16);

  const reordered = moveArrayItem(['a', 'b', 'c'], 0, 'down');
  assert.deepEqual(reordered, ['b', 'a', 'c']);
  assert.equal(slugifyText('Dates & Honey 2026'), 'dates-honey-2026');
});

test('isRtlLanguage identifies Arabic and Urdu as RTL and English/Hindi as LTR', () => {
  assert.equal(isRtlLanguage('ar'), true);
  assert.equal(isRtlLanguage('ur'), true);
  assert.equal(isRtlLanguage('en'), false);
  assert.equal(isRtlLanguage('hi'), false);
});

test('validateContactForm rejects empty or invalid inputs and accepts valid submissions', () => {
  const invalid = validateContactForm({
    userName: '',
    userEmail: 'not-an-email',
    subject: '',
    mobileNo: '123',
    message: 'Hi',
  });
  assert.equal(invalid.valid, false);

  const valid = validateContactForm({
    userName: 'Ahmad Al-Harbi',
    userEmail: 'ahmad@example.com',
    subject: 'Wholesale Inquiry',
    mobileNo: '+966555433512',
    message: 'We would like to request a quote for 500 food baskets in Makkah.',
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});

test('verifyAdminCredentials accepts username or email with matching password and rejects invalid credentials', () => {
  assert.equal(verifyAdminCredentials('admin', 'Naseem@2026', DEFAULT_ADMIN_AUTH), true);
  assert.equal(
    verifyAdminCredentials('info@naseemalata.sa', 'Naseem@2026', DEFAULT_ADMIN_AUTH),
    true
  );
  assert.equal(verifyAdminCredentials('admin', 'wrongpass', DEFAULT_ADMIN_AUTH), false);
  assert.equal(verifyAdminCredentials('unknown', 'Naseem@2026', DEFAULT_ADMIN_AUTH), false);

  assert.equal(
    validateAdminCredentialUpdate('admin', 'info@naseemalata.sa', 'NewPass123').valid,
    true
  );
  assert.equal(validateAdminCredentialUpdate('ab', 'info@naseemalata.sa', 'NewPass123').valid, false);
  assert.equal(validateAdminCredentialUpdate('admin', 'bad-email', 'NewPass123').valid, false);
  assert.equal(validateAdminCredentialUpdate('admin', 'info@naseemalata.sa', '123').valid, false);
});

test('getProductsByCategorySlug matches sibling categories with identical Arabic titles and URL-encoded slugs', () => {
  const state = createDefaultSiteState();
  // Add a product to school-bags-ar (cat-9: الحقائب المدرسية)
  const withSchoolBag = addProductToState(state, {
    id: 'prod-bag-1',
    title: 'Complete School Bag',
    titleAr: 'حقيبة مدرسية متكاملة',
    image: '/uploads/1782929518_product-1.jpg',
    categorySlugs: ['school-bags-ar'],
  });

  // Visiting /school-bags (cat-13: الحقائب المدرسية) should also return the product!
  const matchedInSibling = getProductsByCategorySlug(
    'school-bags',
    withSchoolBag.products,
    withSchoolBag.categories
  );
  assert.equal(matchedInSibling.length, 1);
  assert.equal(matchedInSibling[0].titleAr, 'حقيبة مدرسية متكاملة');

  // URL-encoded Arabic category route should resolve properly
  const withArabicCat = addCategoryToState(withSchoolBag, {
    id: 'cat-arabic',
    slug: 'تمور-مكة',
    title: 'Makkah Dates',
    titleAr: 'تمور مكة',
    image: '/uploads/naseem-profile-logo.jpeg',
    description: 'Dates',
    descriptionAr: 'تمور',
  });
  const encodedPath = `/${encodeURIComponent('تمور-مكة')}`;
  const resolved = parseRoutePath(encodedPath, withArabicCat.categories, []);
  assert.equal(resolved.type, 'category');
  if (resolved.type === 'category') {
    assert.equal(resolved.category.titleAr, 'تمور مكة');
  }
});

test('Staff RBAC enforces granular permissions without local password authentication', () => {
  assert.equal(parseRoutePath('/portal').type, 'admin');
  assert.equal(parseRoutePath('/staff').type, 'admin');

  const staff: StaffMember = {
    id: 'staff-emp-1',
    uid: 'firebase-user-123',
    name: 'خالد العتيبي',
    email: 'khalid@naseemalata.sa',
    jobTitle: 'مسؤول المنتجات والأقسام',
    rolePreset: 'products_manager',
    permissions: ['overview', 'categories', 'products'],
    active: true,
    addedAt: '2026-11-12',
  };
  assert.equal(hasStaffPermission(staff, 'products'), true);
  assert.equal(hasStaffPermission(staff, 'categories'), true);
  assert.equal(hasStaffPermission(staff, 'staff'), false);
  assert.equal(hasStaffPermission(staff, 'theme'), false);
  assert.equal(hasStaffPermission({ ...staff, active: false }, 'products'), false);
  assert.equal(hasStaffPermission({ ...staff, rolePreset: 'super_admin', permissions: ['overview'] }, 'staff'), false);
});
