import React, { useState } from 'react';
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
    loginAdmin,
    setVisitorPreviewMode,
    cloudAdminUser,
  } = useSite();

  // Add / Edit form state
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rolePreset, setRolePreset] = useState<StaffRolePreset>('products_manager');
  const [jobTitle, setJobTitle] = useState(STAFF_ROLE_PRESETS.products_manager.defaultTitleAr);
  const [accessCode, setAccessCode] = useState('');
  const [permissions, setPermissions] = useState<StaffPermissionKey[]>(
    STAFF_ROLE_PRESETS.products_manager.permissions
  );
  const [active, setActive] = useState(true);
  const [showAccessCodeMap, setShowAccessCodeMap] = useState<Record<string, boolean>>({});

  const resetForm = () => {
    setEditingStaffId(null);
    setName('');
    setEmail('');
    setRolePreset('products_manager');
    setJobTitle(STAFF_ROLE_PRESETS.products_manager.defaultTitleAr);
    setAccessCode('');
    setPermissions([...STAFF_ROLE_PRESETS.products_manager.permissions]);
    setActive(true);
  };

  const handlePresetChange = (preset: StaffRolePreset) => {
    setRolePreset(preset);
    setJobTitle(STAFF_ROLE_PRESETS[preset].defaultTitleAr);
    if (preset !== 'custom') {
      setPermissions([...STAFF_ROLE_PRESETS[preset].permissions]);
    }
  };

  const togglePermission = (permKey: StaffPermissionKey) => {
    setPermissions((prev) => {
      const exists = prev.includes(permKey);
      const next = exists ? prev.filter((k) => k !== permKey) : [...prev, permKey];
      setRolePreset('custom');
      return next;
    });
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName || !cleanEmail || !cleanEmail.includes('@')) {
      onNotify('يرجى إدخال اسم الموظف وبريده الإلكتروني بشكل صحيح.', 'danger');
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
                email: isPrimaryOwner ? SUPER_ADMIN_EMAIL : cleanEmail,
                rolePreset: isPrimaryOwner ? 'super_admin' : rolePreset,
                jobTitle: jobTitle.trim() || STAFF_ROLE_PRESETS[rolePreset].defaultTitleAr,
                accessCode: accessCode.trim(),
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
        name: cleanName,
        email: cleanEmail,
        rolePreset,
        jobTitle: jobTitle.trim() || STAFF_ROLE_PRESETS[rolePreset].defaultTitleAr,
        accessCode: accessCode.trim() || 'Naseem@2026',
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
    setEditingStaffId(member.id);
    setName(member.name);
    setEmail(member.email);
    setRolePreset(member.rolePreset);
    setJobTitle(member.jobTitle);
    setAccessCode(member.accessCode || '');
    setPermissions([...member.permissions]);
    setActive(member.active);
  };

  const handleToggleActive = (member: StaffMember) => {
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

  const handleDeleteStaff = (member: StaffMember) => {
    if (member.email.toLowerCase() === SUPER_ADMIN_EMAIL) {
      onNotify('لا يمكن حذف المالك الرئيسي للنظام.', 'danger');
      return;
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

  const handleCopyLink = (path: string, label: string) => {
    const fullUrl = `${window.location.origin}${path}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
    }
    onNotify(`تم نسخ رابط ${label}: ${fullUrl}`, 'info');
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://naseemalata.sa';

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
                onNavigate('/');
              }}
              className="bg-[#f39200] hover:bg-[#d98200] text-white font-extrabold px-4 py-3 rounded-2xl text-xs transition shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <i className="fas fa-eye"></i>
              <span>معاينة الموقع كزائر (بدون أي أدوات أدمن)</span>
            </button>
          </div>
        </div>

        {/* Links comparison cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#4ad295]">
                <i className="fas fa-globe"></i>
                <span>الواجهة العامة للعملاء والزوار (صفر أدوات أدمن)</span>
              </div>
              <div className="text-sm font-mono font-bold text-white truncate mt-1" dir="ltr">
                {originUrl}/
              </div>
              <p className="text-[11px] text-white/70 mt-1">
                الرابط المخصص للعملاء، لا يحتوي على أي إشارة أو زر للوحة التحكم.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopyLink('/', 'واجهة العملاء العامة')}
              className="bg-white/15 hover:bg-white/25 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer flex items-center gap-1.5"
            >
              <i className="fas fa-copy"></i>
              <span>نسخ</span>
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-extrabold text-amber-300">
                <i className="fas fa-user-lock"></i>
                <span>بوابة دخول الأدمنز والموظفين المستقلة</span>
              </div>
              <div className="text-sm font-mono font-bold text-white truncate mt-1" dir="ltr">
                {originUrl}/admin &nbsp;|&nbsp; /portal &nbsp;|&nbsp; /staff
              </div>
              <p className="text-[11px] text-white/70 mt-1">
                أرسل هذا الرابط للموظفين لتسجيل الدخول بإيميلاتهم وصلاحياتهم المحددة.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopyLink('/admin', 'بوابة الموظفين والأدمن')}
              className="bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 border border-amber-400/30 px-3.5 py-2.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer flex items-center gap-1.5"
            >
              <i className="fas fa-copy"></i>
              <span>نسخ رابط البوابة</span>
            </button>
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

          <form onSubmit={handleSaveStaff} className="space-y-4">
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

              <div>
                <label className="block text-xs font-extrabold text-gray-700 mb-1.5">
                  كود الدخول المباشر (أو يدخل عبر Google)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="مثال: Staff@2025"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#2c8c5e] focus:outline-none text-sm font-mono"
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
              className="w-full bg-[#2c8c5e] hover:bg-[#23704b] text-white font-extrabold py-3.5 rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <i className={`fas ${editingStaffId ? 'fa-save' : 'fa-user-check'}`}></i>
              <span>
                {editingStaffId
                  ? 'حفظ تعديلات الموظف ومزامنتها'
                  : 'إضافة الموظف وتفعيل صلاحياته السحابية'}
              </span>
            </button>
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
                            {member.accessCode && (
                              <button
                                type="button"
                                onClick={() =>
                                  setShowAccessCodeMap((prev) => ({
                                    ...prev,
                                    [member.id]: !prev[member.id],
                                  }))
                                }
                                className="text-[11px] font-mono bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded-lg text-gray-700 cursor-pointer"
                                title="إظهار/إخفاء كود الدخول المباشر"
                              >
                                <i className="fas fa-key ml-1 text-amber-600"></i>
                                {showCode ? member.accessCode : '•••••• (إظهار الكود)'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        {member.active && !isCurrentSession && (
                          <button
                            type="button"
                            onClick={() => {
                              loginAdmin(member);
                              onNotify(
                                `تم التبديل لمعاينة اللوحة بصلاحيات "${member.name}" (${member.jobTitle}).`,
                                'info'
                              );
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1"
                            title="تجربة اللوحة كما تظهر لهذا الموظف"
                          >
                            <i className="fas fa-user-check"></i>
                            <span>تجربة صلاحياته</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => startEditStaff(member)}
                          className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <i className="fas fa-pen"></i>
                          <span>تعديل</span>
                        </button>
                        {!isPrimaryOwner && (
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
