import React, { useState } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import {
  ALL_STAFF_PERMISSIONS,
  STAFF_ROLE_PRESETS,
  StaffMember,
  StaffPermissionKey,
  StaffRolePreset,
} from '../../data/siteData';
import { useSite } from '../../context/SiteContext';

interface StaffManagementPanelProps {
  onNotify: (msg: string, type?: 'success' | 'info' | 'danger') => void;
  onNavigate: (path: string) => void;
}

const SUPER_ADMIN_EMAIL = 'yr.play.com@gmail.com';

const STAFF_PERMISSION_CATALOG: Array<{
  key: StaffPermissionKey;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    key: 'overview',
    label: 'نظرة عامة والإحصائيات',
    description: 'الاطلاع على ملخص وأرقام الموقع السريعة',
    icon: 'fa-chart-pie',
  },
  {
    key: 'products',
    label: 'إدارة المنتجات',
    description: 'إضافة وتعديل وحذف المنتجات والأسعار والصور',
    icon: 'fa-box-open',
  },
  {
    key: 'categories',
    label: 'أقسام المنتجات',
    description: 'إنشاء وتعديل وترتيب الأقسام الـ 15 والأقسام الجديدة',
    icon: 'fa-th-large',
  },
  {
    key: 'marketplaces',
    label: 'قطاعات العمل (Market Places)',
    description: 'إدارة قطاعات التوريد والسوبرماركت والفنادق والإعاشة',
    icon: 'fa-store',
  },
  {
    key: 'hero',
    label: 'السلايدر الرئيسي (Hero)',
    description: 'تعديل صور وعناوين وأزرار العرض الترويجي بالرئيسية',
    icon: 'fa-images',
  },
  {
    key: 'about',
    label: 'نبذة الشركة وصفحة من نحن',
    description: 'تحديث النبذة التعريفية والرؤية والرسالة ومجالات العمل',
    icon: 'fa-info-circle',
  },
  {
    key: 'company',
    label: 'الهوية وبيانات التواصل',
    description: 'تعديل الشعار وأرقام التواصل والعنوان وروابط التواصل',
    icon: 'fa-building',
  },
  {
    key: 'theme',
    label: 'المظهر والألوان وترتيب الرئيسية',
    description: 'تخصيص الألوان وإظهار/إخفاء وترتيب أقسام الواجهة',
    icon: 'fa-palette',
  },
  {
    key: 'pages',
    label: 'الصفحات والسياسات والترجمات',
    description: 'إدارة الصفحات المخصصة والسياسات والترجمات بـ 4 لغات',
    icon: 'fa-file-alt',
  },
  {
    key: 'messages',
    label: 'رسائل العملاء وأدوات النسخ الاحتياطي',
    description: 'قراءة رسائل نموذج تواصل معنا وتصدير/استيراد البيانات',
    icon: 'fa-envelope-open-text',
  },
  {
    key: 'staff',
    label: 'إدارة الموظفين والصلاحيات (RBAC)',
    description: 'إضافة أدمنز وموظفين جدد وتحديد صلاحياتهم وسجل النشاط',
    icon: 'fa-users-cog',
  },
];

export const StaffManagementPanel: React.FC<StaffManagementPanelProps> = ({
  onNotify,
  onNavigate,
}) => {
  const {
    siteState,
    updateSiteState,
    currentStaffMember,
    logoutAdmin,
    setVisitorPreviewMode,
    cloudAdminUser,
  } = useSite();

  // Add / Edit form state
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [uid, setUid] = useState('');
  const [rolePreset, setRolePreset] = useState<StaffRolePreset>('products_manager');
  const [jobTitle, setJobTitle] = useState(STAFF_ROLE_PRESETS.products_manager.defaultTitleAr);
  const [permissions, setPermissions] = useState<StaffPermissionKey[]>(
    STAFF_ROLE_PRESETS.products_manager.permissions
  );
  const [active, setActive] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const isSuperAdmin = Boolean(
    currentStaffMember?.rolePreset === 'super_admin' ||
      currentStaffMember?.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL ||
      cloudAdminUser?.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL
  );

  const detectedOrigin =
    typeof window !== 'undefined' &&
    window.location.origin &&
    !window.location.origin.includes('localhost')
      ? window.location.origin
      : 'https://ais-pre-vy4x6ad46ozqfzkgy5fd2x-472643680131.europe-west1.run.app';

  const [customDomainUrl, setCustomDomainUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('naseem_custom_domain_url');
      if (saved) return saved;
      if (!window.location.origin.includes('localhost')) {
        return window.location.origin;
      }
    }
    return detectedOrigin;
  });

  const cleanBaseUrl = (customDomainUrl.trim() || detectedOrigin).replace(/\/+$/, '');
  const visitorRealUrl = `${cleanBaseUrl}/`;
  const adminPortalRealUrl = `${cleanBaseUrl}/admin`;
  const universalPortalRealUrl = `${cleanBaseUrl}/?portal=staff`;

  const resetForm = () => {
    setEditingStaffId(null);
    setName('');
    setEmail('');
    setUid('');
    setRolePreset('products_manager');
    setJobTitle(STAFF_ROLE_PRESETS.products_manager.defaultTitleAr);
    setPermissions([...STAFF_ROLE_PRESETS.products_manager.permissions]);
    setActive(true);
  };

  const handlePresetChange = (preset: StaffRolePreset) => {
    if (!isSuperAdmin) return;
    setRolePreset(preset);
    setJobTitle(STAFF_ROLE_PRESETS[preset].defaultTitleAr);
    if (preset !== 'custom') {
      setPermissions([...STAFF_ROLE_PRESETS[preset].permissions]);
    }
  };

  const togglePermission = (permKey: StaffPermissionKey) => {
    if (!isSuperAdmin) return;
    setPermissions((prev) => {
      const exists = prev.includes(permKey);
      const next = exists ? prev.filter((k) => k !== permKey) : [...prev, permKey];
      setRolePreset('custom');
      return next;
    });
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      onNotify('عذراً، تعديل قائمة الإيميلات المصرح لها والصلاحيات متاح لمدير النظام الكامل (Super Admin) فقط.', 'danger');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanUid = uid.trim();

    if (!cleanName || !cleanEmail || !cleanEmail.includes('@') || !/^[a-zA-Z0-9_-]{1,128}$/.test(cleanUid)) {
      onNotify('يرجى إدخال الاسم والبريد الإلكتروني ومعرّف Firebase UID الصحيح للحساب.', 'danger');
      return;
    }

    if (permissions.length === 0) {
      onNotify('يرجى تحديد صلاحية واحدة على الأقل للموظف.', 'danger');
      return;
    }

    const duplicate = siteState.staffMembers.find(
      (m) => m.email.trim().toLowerCase() === cleanEmail && m.id !== editingStaffId
    );
    if (duplicate) {
      onNotify('هذا البريد الإلكتروني مسجل مسبقاً ضمن قائمة الموظفين.', 'danger');
      return;
    }

    if (editingStaffId) {
      const isPrimaryOwner = cleanEmail === SUPER_ADMIN_EMAIL;
      const finalPermissions: StaffPermissionKey[] = isPrimaryOwner
        ? [...ALL_STAFF_PERMISSIONS]
        : permissions;

      updateSiteState((prev) => ({
        ...prev,
        staffMembers: prev.staffMembers.map((member) =>
          member.id === editingStaffId
            ? {
                ...member,
                name: cleanName,
                uid: cleanUid,
                email: isPrimaryOwner ? SUPER_ADMIN_EMAIL : cleanEmail,
                rolePreset: isPrimaryOwner ? 'super_admin' : rolePreset,
                jobTitle: jobTitle.trim() || STAFF_ROLE_PRESETS[rolePreset].defaultTitleAr,
                permissions: finalPermissions,
                active: isPrimaryOwner ? true : active,
              }
            : member
        ),
      }));
      onNotify(`تم تحديث بيانات وصلاحيات "${cleanName}" ومزامنتها سحابياً بنجاح!`);
      resetForm();
    } else {
      const newMember: StaffMember = {
        id: 'staff-' + Date.now(),
        uid: cleanUid,
        name: cleanName,
        email: cleanEmail,
        rolePreset,
        jobTitle: jobTitle.trim() || STAFF_ROLE_PRESETS[rolePreset].defaultTitleAr,
        permissions,
        active,
        addedAt: new Date().toLocaleDateString('ar-SA'),
      };

      updateSiteState((prev) => ({
        ...prev,
        staffMembers: [...prev.staffMembers, newMember],
      }));
      onNotify(`تمت إضافة "${cleanName}" (${cleanEmail}) وتفعيل صلاحياته فوراً!`);
      resetForm();
    }
  };

  const startEditStaff = (member: StaffMember) => {
    if (!isSuperAdmin) {
      onNotify('تعديل بيانات الموظفين متاح لمدير النظام الكامل (Super Admin) فقط.', 'danger');
      return;
    }
    setEditingStaffId(member.id);
    setName(member.name);
    setEmail(member.email);
    setUid(member.uid || '');
    setRolePreset(member.rolePreset);
    setJobTitle(member.jobTitle);
    setPermissions([...member.permissions]);
    setActive(member.active);
  };

  const handleToggleActive = (member: StaffMember) => {
    if (!isSuperAdmin) {
      onNotify('تعديل حالة الموظفين متاح لمدير النظام الكامل (Super Admin) فقط.', 'danger');
      return;
    }
    if (member.email.toLowerCase() === SUPER_ADMIN_EMAIL) {
      onNotify('لا يمكن إيقاف حساب المالك الرئيسي للنظام.', 'danger');
      return;
    }
    updateSiteState((prev) => ({
      ...prev,
      staffMembers: prev.staffMembers.map((m) =>
        m.id === member.id ? { ...m, active: !m.active } : m
      ),
    }));
    onNotify(
      member.active
        ? `تم إيقاف حساب "${member.name}" مؤقتاً.`
        : `تم إعادة تفعيل حساب "${member.name}" بنجاح!`
    );
  };

  const handleDeleteStaff = async (member: StaffMember) => {
    if (!isSuperAdmin) {
      onNotify('حذف الموظفين متاح لمدير النظام الكامل (Super Admin) فقط.', 'danger');
      return;
    }
    if (member.email.toLowerCase() === SUPER_ADMIN_EMAIL) {
      onNotify('لا يمكن حذف المالك الرئيسي للنظام.', 'danger');
      return;
    }
    if (member.uid && auth.currentUser?.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL) {
      try {
        await deleteDoc(doc(db, 'staff_profiles', member.uid));
      } catch {
        onNotify('تعذر حذف سجل الموظف من قاعدة البيانات الخاصة. لم يتم حذف السجل محلياً.', 'danger');
        return;
      }
    }
    updateSiteState((prev) => ({
      ...prev,
      staffMembers: prev.staffMembers.filter((m) => m.id !== member.id),
    }));
    if (editingStaffId === member.id) {
      resetForm();
    }
    onNotify(`تم حذف حساب "${member.name}" وإلغاء وصوله للوحة التحكم.`, 'danger');
  };

  const handleCopyFullUrl = (fullUrl: string, label: string, key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
    }
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2500);
    onNotify(`تم نسخ رابط ${label}: ${fullUrl}`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* 1. Architecture Separation Banner: Visitor vs Staff Portal */}
      <div className="bg-gradient-to-l from-[#12261e] via-[#1c392d] to-[#234738] rounded-3xl p-6 text-white shadow-xl border border-[#2c8c5e]/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[#4ad295]/20 border border-[#4ad295]/40 text-[#4ad295] px-3 py-1 rounded-full text-xs font-extrabold">
              <i className="fas fa-shield-check"></i>
              <span>عزل كامل 100% بين واجهة العملاء وبوابة الموظفين</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold">
              فصل واجهة الزوار عن بوابة الإدارة ونظام صلاحيات الموظفين (RBAC)
            </h2>
            <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
              تظهر الواجهة العامة للعملاء والزوار بدون أي أزرار تحكم أو روابط إدارة مخفية نهائياً. بينما يدخل
              الأدمنز والموظفون عبر رابط البوابة المستقل (سواء عبر تسجيل الدخول بحساب Google للبريد المعتمد أو عبر
              البريد وكود الدخول المخصص لكل موظف)، وتفتح لكل موظف الأقسام المحددة له فقط.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setVisitorPreviewMode(true);
                onNavigate('/?view=visitor');
              }}
              className="bg-[#f39200] hover:bg-[#d98200] text-white font-extrabold px-4 py-3 rounded-2xl text-xs transition shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <i className="fas fa-eye"></i>
              <span>معاينة الموقع كزائر (بدون أي أدوات أدمن)</span>
            </button>
          </div>
        </div>

        {/* Links comparison cards (CSS selector 1 & CSS selector 2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-5 border-t border-white/10">
          {/* Card 1: Public Visitor Link */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15 flex flex-col justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#4ad295]">
                  <i className="fas fa-globe"></i>
                  <span>1. رابط الواجهة العامة للعملاء والزوار (صفر أدوات أدمن)</span>
                </div>
                <span className="text-[10px] bg-[#4ad295]/20 text-[#4ad295] px-2 py-0.5 rounded-full font-bold">
                  رابط فعلي حي
                </span>
              </div>

              <a
                href="/?view=visitor"
                onClick={(e) => {
                  e.preventDefault();
                  setVisitorPreviewMode(true);
                  onNavigate('/?view=visitor');
                }}
                dir="ltr"
                className="block w-full bg-black/25 hover:bg-black/35 border border-white/15 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono font-bold text-[#4ad295] underline decoration-[#4ad295]/50 break-all transition cursor-pointer"
                title="اضغط لفتح واجهة الزوار الحية الآن"
              >
                {visitorRealUrl}
              </a>

              <p className="text-[11px] text-white/75">
                اضغط على الرابط أعلاه لفتحه مباشرة كزائر، أو انسخه لمشاركته مع العملاء (لا يظهر فيه أي زر للوحة التحكم).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href="/?view=visitor"
                onClick={(e) => {
                  e.preventDefault();
                  setVisitorPreviewMode(true);
                  onNavigate('/?view=visitor');
                }}
                className="bg-[#4ad295] hover:bg-[#3bc184] text-[#0f241c] px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5"
              >
                <i className="fas fa-external-link-alt"></i>
                <span>فتح واجهة الزوار الآن</span>
              </a>
              <button
                type="button"
                onClick={() =>
                  handleCopyFullUrl(visitorRealUrl, 'واجهة العملاء العامة', 'visitor-main')
                }
                className="bg-white/15 hover:bg-white/25 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <i className={`fas ${copiedKey === 'visitor-main' ? 'fa-check text-[#4ad295]' : 'fa-copy'}`}></i>
                <span>{copiedKey === 'visitor-main' ? 'تم نسخ الرابط ✓' : 'نسخ رابط الزوار'}</span>
              </button>
            </div>
          </div>

          {/* Card 2: Staff & Admin Portal Link */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15 flex flex-col justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-amber-300">
                  <i className="fas fa-user-lock"></i>
                  <span>2. رابط بوابة دخول الأدمنز والموظفين المستقلة</span>
                </div>
                <span className="text-[10px] bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full font-bold">
                  بوابة الموظفين
                </span>
              </div>

              <div className="space-y-1.5">
                <a
                  href="/admin"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/admin');
                  }}
                  dir="ltr"
                  className="block w-full bg-black/25 hover:bg-black/35 border border-amber-400/25 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono font-bold text-amber-300 underline decoration-amber-300/50 break-all transition cursor-pointer"
                  title="الرابط المباشر لبوابة دخول الموظفين والأدمن"
                >
                  {adminPortalRealUrl}
                </a>
                <div className="flex items-center justify-between gap-2 text-[11px] text-white/75 px-1">
                  <span>رابط بديل يعمل على جميع الاستضافات:</span>
                  <a
                    href="/?portal=staff"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/?portal=staff');
                    }}
                    dir="ltr"
                    className="font-mono text-amber-200 hover:underline"
                  >
                    {universalPortalRealUrl}
                  </a>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  logoutAdmin();
                  onNavigate('/admin');
                }}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5"
                title="تسجيل الخروج الحالي وفتح شاشة دخول الموظفين لتجربتها"
              >
                <i className="fas fa-sign-in-alt"></i>
                <span>فتح شاشة دخول الموظفين</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleCopyFullUrl(adminPortalRealUrl, 'بوابة الموظفين (/admin)', 'portal-admin')
                }
                className="bg-amber-500/30 hover:bg-amber-500/40 text-amber-100 border border-amber-400/30 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <i className={`fas ${copiedKey === 'portal-admin' ? 'fa-check text-emerald-300' : 'fa-copy'}`}></i>
                <span>{copiedKey === 'portal-admin' ? 'تم النسخ ✓' : 'نسخ رابط /admin'}</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleCopyFullUrl(universalPortalRealUrl, 'بوابة الموظفين (?portal=staff)', 'portal-query')
                }
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
              >
                <i className={`fas ${copiedKey === 'portal-query' ? 'fa-check text-emerald-300' : 'fa-link'}`}></i>
                <span>{copiedKey === 'portal-query' ? 'تم النسخ ✓' : 'نسخ ?portal=staff'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Optional Domain Customizer Bar so links match Vercel / Custom Domain */}
        <div className="mt-3 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-white/80">
          <div className="flex items-center gap-2">
            <i className="fas fa-link text-[#4ad295]"></i>
            <span>نطاق الموقع المعتمد لتوليد الروابط أعلاه (يمكنك وضع رابط Vercel أو الدومين الرسمي):</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="url"
              dir="ltr"
              value={customDomainUrl}
              onChange={(e) => {
                setCustomDomainUrl(e.target.value);
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem('naseem_custom_domain_url', e.target.value);
                }
              }}
              placeholder="https://naseemalata.sa"
              className="bg-black/30 border border-white/20 rounded-xl px-3 py-1.5 text-xs font-mono text-white w-64 sm:w-80 focus:outline-none focus:border-[#4ad295]"
            />
            {typeof window !== 'undefined' && !window.location.origin.includes('localhost') && customDomainUrl !== window.location.origin && (
              <button
                type="button"
                onClick={() => {
                  setCustomDomainUrl(window.location.origin);
                  window.localStorage.setItem('naseem_custom_domain_url', window.location.origin);
                }}
                className="text-[11px] bg-white/15 hover:bg-white/25 px-2.5 py-1.5 rounded-xl font-bold cursor-pointer"
              >
                الرابط الحالي
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Grid: Add/Edit Staff Member Form + Staff List */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Form Column (5 cols) */}
        <div className="xl:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2c8c5e]/10 text-[#2c8c5e] flex items-center justify-center font-bold">
                <i className={`fas ${editingStaffId ? 'fa-user-edit' : 'fa-user-plus'}`}></i>
              </div>
              <div>
                <h3 className="font-extrabold text-gray-800 text-base">
                  {editingStaffId ? 'تعديل صلاحيات وبيانات الموظف' : 'إضافة أدمن أو موظف جديد بالإيميل'}
                </h3>
                <p className="text-[11px] text-gray-400">
                  حدّد البريد الإلكتروني والدور الوظيفي والأقسام المسموح له بتعديلها
                </p>
              </div>
            </div>
            {editingStaffId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-bold text-gray-500 hover:text-gray-800 bg-gray-100 px-3 py-1.5 rounded-xl cursor-pointer"
              >
                إلغاء التعديل
              </button>
            )}
          </div>

          {!isSuperAdmin && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold leading-relaxed flex items-start gap-2.5">
              <i className="fas fa-lock text-amber-600 mt-0.5"></i>
              <span>
                إضافة أو تعديل أو حذف الإيميلات المصرح لها (authorizedEmails) مقصور على مدير النظام الكامل (Super Admin) فقط وفق قواعد الحماية السحابية.
              </span>
            </div>
          )}

          <form onSubmit={handleSaveStaff} className="space-y-4">
            <fieldset disabled={!isSuperAdmin} className="space-y-4 disabled:opacity-60">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-extrabold text-gray-700 mb-1.5">
                  اسم الموظف / المسؤول *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أحمد محمد"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#2c8c5e] focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-700 mb-1.5">
                  Firebase UID للحساب *
                </label>
                <input type="text" required dir="ltr" value={uid} onChange={(e) => setUid(e.target.value)}
                  placeholder="انسخ UID من Firebase Authentication"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#2c8c5e] focus:outline-none text-sm font-mono" />
                <p className="text-[10px] text-gray-400 mt-1">أنشئ حساب الموظف في Firebase Authentication أولاً، ثم أدخل UID المطابق لبريده</p>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-gray-700 mb-1.5">
                  البريد الإلكتروني (للدخول) *
                </label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  disabled={
                    Boolean(editingStaffId) && email.trim().toLowerCase() === SUPER_ADMIN_EMAIL
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@naseemalata.sa"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#2c8c5e] focus:outline-none text-sm font-mono disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Role Presets */}
            <div>
              <label className="block text-xs font-extrabold text-gray-700 mb-1.5">
                قالب الدور الوظيفي السريع
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(STAFF_ROLE_PRESETS) as StaffRolePreset[]).map((presetKey) => {
                  const preset = STAFF_ROLE_PRESETS[presetKey];
                  const isSelected = rolePreset === presetKey;
                  return (
                    <button
                      key={presetKey}
                      type="button"
                      onClick={() => handlePresetChange(presetKey)}
                      className={`p-2.5 rounded-xl border text-right transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#2c8c5e]/10 border-[#2c8c5e] text-[#1f6b47]'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-xs font-extrabold flex items-center justify-between">
                        <span>{preset.defaultTitleAr}</span>
                        {isSelected && <i className="fas fa-check-circle text-[#2c8c5e]"></i>}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">
                        {preset.labelAr}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-extrabold text-gray-700 mb-1.5">
                  المسمى الوظيفي الظاهر في اللوحة
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="مثال: مسؤول المنتجات والمخزون"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#2c8c5e] focus:outline-none text-sm"
                />
              </div>


            </div>

            {/* Granular Permissions Matrix */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-extrabold text-gray-700">
                  الصلاحيات التفصيلية (الأقسام التي تفتح للموظف فقط) ({permissions.length} من{' '}
                  {ALL_STAFF_PERMISSIONS.length})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPermissions([...ALL_STAFF_PERMISSIONS]);
                      setRolePreset('super_admin');
                    }}
                    className="text-[11px] font-bold text-[#2c8c5e] hover:underline cursor-pointer"
                  >
                    تحديد الكل
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPermissions(['overview', 'products', 'categories']);
                      setRolePreset('products_manager');
                    }}
                    className="text-[11px] font-bold text-gray-500 hover:underline cursor-pointer"
                  >
                    المنتجات فقط
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded-2xl border border-gray-200">
                {STAFF_PERMISSION_CATALOG.map((perm) => {
                  const checked = permissions.includes(perm.key);
                  return (
                    <label
                      key={perm.key}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                        checked
                          ? 'bg-white border-[#2c8c5e] shadow-xs'
                          : 'bg-transparent border-gray-200/70 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePermission(perm.key)}
                        className="mt-1 accent-[#2c8c5e] w-4 h-4 rounded cursor-pointer"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-gray-800">
                          <i className={`fas ${perm.icon} text-[#2c8c5e] text-[11px]`}></i>
                          <span>{perm.label}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 leading-tight mt-0.5">
                          {perm.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={!isSuperAdmin}
              className="w-full bg-[#2c8c5e] hover:bg-[#23704b] disabled:bg-gray-300 text-white font-extrabold py-3.5 rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:cursor-not-allowed"
            >
              <i className={`fas ${editingStaffId ? 'fa-save' : 'fa-user-check'}`}></i>
              <span>
                {editingStaffId
                  ? 'حفظ تعديلات الموظف ومزامنتها'
                  : 'إضافة الموظف وتفعيل صلاحياته السحابية'}
              </span>
            </button>
            </fieldset>
          </form>
        </div>

        {/* Staff Directory & Impersonation / RBAC Preview Column (7 cols) */}
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-gray-800 text-base flex items-center gap-2">
                  <i className="fas fa-users-cog text-[#2c8c5e]"></i>
                  <span>قائمة الأدمنز والموظفين المعتمدين ({siteState.staffMembers.length})</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  يمكن لأي موظف في القائمة تسجيل الدخول من جهازه عبر Google (بنفس إيميله) أو عبر إيميله وكود
                  الدخول.
                </p>
              </div>
              {currentStaffMember && (
                <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>الجلسة الحالية: {currentStaffMember.name}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {siteState.staffMembers.map((member) => {
                const isPrimaryOwner = member.email.toLowerCase() === SUPER_ADMIN_EMAIL;
                const isCurrentSession =
                  currentStaffMember?.email.toLowerCase() === member.email.toLowerCase();
                const showCode = Boolean(showAccessCodeMap[member.id]);

                return (
                  <div
                    key={member.id}
                    className={`rounded-2xl p-4 border transition ${
                      !member.active
                        ? 'bg-gray-50 border-gray-200 opacity-70'
                        : isCurrentSession
                        ? 'bg-emerald-50/40 border-[#2c8c5e] shadow-xs'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-white shrink-0 ${
                            isPrimaryOwner
                              ? 'bg-gradient-to-br from-[#1b362b] to-[#2c8c5e]'
                              : member.active
                              ? 'bg-[#2c8c5e]'
                              : 'bg-gray-400'
                          }`}
                        >
                          <i
                            className={`fas ${
                              isPrimaryOwner ? 'fa-crown' : 'fa-user-shield'
                            }`}
                          ></i>
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-gray-800 text-sm">
                              {member.name}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                isPrimaryOwner
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-[#2c8c5e]/10 text-[#2c8c5e]'
                              }`}
                            >
                              {member.jobTitle}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                member.active
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {member.active ? 'نشط' : 'موقوف'}
                            </span>
                            {isCurrentSession && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                حسابك النشط حالياً
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="font-mono font-bold text-gray-700" dir="ltr">
                              <i className="far fa-envelope ml-1 text-gray-400"></i>
                              {member.email}
                            </span>

                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => startEditStaff(member)}
                            className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                          >
                            <i className="fas fa-pen"></i>
                            <span>تعديل</span>
                          </button>
                        )}
                        {isSuperAdmin && !isPrimaryOwner && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleActive(member)}
                              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                                member.active
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {member.active ? 'إيقاف' : 'تفعيل'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(member)}
                              className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold transition cursor-pointer"
                              title="حذف الموظف"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Permissions Badges */}
                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-gray-400 ml-1">
                        الأقسام المسموحة ({member.permissions.length}):
                      </span>
                      {STAFF_PERMISSION_CATALOG.filter((p) =>
                        member.permissions.includes(p.key)
                      ).map((perm) => (
                        <span
                          key={perm.key}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-700"
                        >
                          <i className={`fas ${perm.icon} text-[#2c8c5e] text-[9px]`}></i>
                          <span>{perm.label}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Staff Activity & Audit Log */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-gray-800 text-base flex items-center gap-2">
                  <i className="fas fa-history text-[#f39200]"></i>
                  <span>سجل نشاط وتعديلات الموظفين (Audit Log)</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  يوثّق النظام تلقائياً اسم وبريد الموظف الذي قام بأي تعديل مع الوقت والتاريخ
                </p>
              </div>
              {siteState.staffAuditLog && siteState.staffAuditLog.length > 0 && (
                <span className="text-xs font-bold text-gray-400">
                  آخر {siteState.staffAuditLog.length} عملية
                </span>
              )}
            </div>

            {!siteState.staffAuditLog || siteState.staffAuditLog.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                <i className="fas fa-clipboard-check text-2xl mb-2 block text-gray-300"></i>
                سيظهر هنا سجل العمليات والتعديلات فور قيام الموظفين بأي تحديث.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {siteState.staffAuditLog.slice(0, 15).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#2c8c5e]/10 text-[#2c8c5e] flex items-center justify-center shrink-0">
                        <i className="fas fa-check text-[10px]"></i>
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-800 truncate">{entry.action}</div>
                        <div className="text-[10px] text-gray-500">
                          بواسطة: <span className="font-bold">{entry.staffName}</span> (
                          <span className="font-mono" dir="ltr">
                            {entry.staffEmail}
                          </span>
                          )
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono shrink-0" dir="ltr">
                      {entry.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {cloudAdminUser && (
              <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
                <span>
                  حساب Google المتصل سحابياً:{' '}
                  <strong className="font-mono text-gray-700" dir="ltr">
                    {cloudAdminUser.email}
                  </strong>
                </span>
                <span className="text-emerald-600 font-bold">
                  <i className="fas fa-cloud-upload-alt ml-1"></i>
                  مزامنة الصلاحيات نشطة
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
