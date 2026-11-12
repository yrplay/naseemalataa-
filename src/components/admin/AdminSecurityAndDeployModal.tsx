import React, { useState } from 'react';
import { useSite } from '../../context/SiteContext';
import { DEFAULT_ADMIN_AUTH } from '../../data/siteData';
import { validateAdminCredentialUpdate } from '../../utils/siteLogic';

interface AdminSecurityAndDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (msg: string) => void;
}

export const AdminSecurityAndDeployModal: React.FC<AdminSecurityAndDeployModalProps> = ({
  isOpen,
  onClose,
  onNotify,
}) => {
  const { siteState, updateSiteState } = useSite();
  const currentAuth = siteState.adminAuth || DEFAULT_ADMIN_AUTH;

  const [username, setUsername] = useState(currentAuth.username);
  const [email, setEmail] = useState(currentAuth.email);
  const [password, setPassword] = useState(currentAuth.password);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateAdminCredentialUpdate(username, email, password);
    if (!check.valid) {
      setError(check.error || 'بيانات غير صالحة');
      return;
    }
    setError('');
    updateSiteState((prev) => ({
      ...prev,
      adminAuth: {
        ...(prev.adminAuth || DEFAULT_ADMIN_AUTH),
        username: username.trim(),
        email: email.trim(),
        password,
      },
    }));
    onNotify('تم تحديث بيانات تسجيل دخول الأدمن بنجاح.');
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded border border-slate-200 max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-lg font-bold text-slate-900">
            إعدادات دخول الأدمن ودليل النشر على الإنترنت
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="px-3 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
          >
            إغلاق ✕
          </button>
        </div>

        {/* 1. Admin Credentials Form */}
        <form
          onSubmit={handleSaveCredentials}
          className="p-4 bg-slate-50 rounded border border-slate-200 space-y-4"
        >
          <h3 className="text-sm font-bold text-slate-900">
            1. بيانات تسجيل الدخول الخاصة بالأدمن (/admin)
          </h3>
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                اسم المستخدم
              </label>
              <input
                type="text"
                dir="ltr"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                البريد الإلكتروني للأدمن
              </label>
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                كلمة المرور الجديدة
              </label>
              <input
                type="text"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold bg-[#23838B] hover:bg-[#1a666d] text-white rounded cursor-pointer"
          >
            حفظ بيانات الدخول الجديدة
          </button>
        </form>

        {/* 2. Step-by-Step Deployment Guide */}
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <h3 className="text-sm font-bold text-slate-900">
            2. كيف تنشر الموقع والتعديلات للعملاء؟ (3 طرق متاحة)
          </h3>

          <div className="p-4 rounded border border-slate-200 space-y-2">
            <div className="font-bold text-[#23838B] text-sm">
              أ) النشر الفوري المباشر عبر المنصة (بنقرة زر واحدة)
            </div>
            <p>
              من أعلى يمين شاشة Google AI Studio، اضغط على زر <strong>Deploy</strong> أو{' '}
              <strong>Share / Publish</strong>، وسيتم نشر الموقع مباشرة على خوادم Google Cloud Run
              برابط عام جاهز للمشاركة مع العملاء.
            </p>
          </div>

          <div className="p-4 rounded border border-slate-200 space-y-2">
            <div className="font-bold text-[#23838B] text-sm">
              ب) تثبيت التعديلات للزوار على كافة الأجهزة
            </div>
            <p>
              التعديلات التي تجريها داخل لوحة التحكم تُحفظ تلقائياً في متصفحك وتظهر لك فوراً عند
              الضغط على زر <strong>"نشر التعديلات (Publish)"</strong>. وإذا أردت تثبيت تعديلاتك
              الجديدة لتكون هي البيانات الافتراضية الثابتة في الكود المصدري لكل زائر جديد من أي جهاز:
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                اضغط على زر <strong>"تصدير نسخة احتياطية (JSON)"</strong> من القائمة الجانبية.
              </li>
              <li>
                أو أرسل ملف الـ JSON هنا في المحادثة واطلب "اعتماد هذه البيانات كبيانات افتراضية"
                ليتم دمجها مباشرة داخل الكود المصدري.
              </li>
            </ol>
          </div>

          <div className="p-4 rounded border border-slate-200 space-y-2">
            <div className="font-bold text-[#23838B] text-sm">
              ج) الرفع على استضافة خارجية أو ربط الدومين الرسمي (naseemalata.sa)
            </div>
            <p>
              يمكنك تحميل الكود المصدري للمشروع كاملاً (ZIP / GitHub) وتشغيل الأمر{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono" dir="ltr">
                npm run build
              </code>{' '}
              لإنتاج مجلد{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono" dir="ltr">
                dist
              </code>{' '}
              الجاهز للرفع على أي استضافة (Vercel، Netlify، Hostinger، أو لوحة cPanel الخاصة بالدومين).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
