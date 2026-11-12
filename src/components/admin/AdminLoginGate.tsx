import React, { useState } from 'react';
import { useSite } from '../../context/SiteContext';
import { DEFAULT_ADMIN_AUTH, StaffMember } from '../../data/siteData';
import { authenticateStaffLogin } from '../../utils/siteLogic';

interface AdminLoginGateProps {
  onLoginSuccess: (staff?: StaffMember) => void;
  onNavigateHome: () => void;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({
  onLoginSuccess,
  onNavigateHome,
}) => {
  const { siteState, signInWithGoogleAdmin, cloudSyncError } = useSite();
  const authConfig = siteState.adminAuth || DEFAULT_ADMIN_AUTH;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = authenticateStaffLogin(
      identifier,
      password,
      siteState.staffMembers,
      authConfig
    );
    if (res.staff) {
      setErrorMsg('');
      onLoginSuccess(res.staff);
    } else {
      setErrorMsg(res.error || 'بيانات الدخول غير صحيحة.');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    const res = await signInWithGoogleAdmin();
    setIsGoogleLoading(false);
    if (res.ok) {
      onLoginSuccess();
    } else {
      setErrorMsg(
        res.error ||
          'تعذر تسجيل الدخول عبر Google. تأكد من أن بريدك الإلكتروني مضاف ضمن قائمة الموظفين والأدمنز المعتمدين.'
      );
    }
  };

  const handleFillDefault = () => {
    setIdentifier('yr.play.com@gmail.com');
    setPassword(authConfig.password);
    setErrorMsg('');
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#F7F8FC] bg-icon flex flex-col justify-center items-center px-4 py-12"
    >
      <div className="w-full max-w-[460px] bg-white rounded border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-8">
        <div className="text-center mb-6">
          <img
            src={siteState.company.logo}
            alt="Logo"
            referrerPolicy="no-referrer"
            className="h-14 w-auto mx-auto mb-4 object-contain"
          />
          <span className="inline-block px-3 py-1 rounded bg-teal-50 text-[#23838B] text-[11px] font-bold mb-2 border border-teal-200">
            بوابة الموظفين والإدارة المستقلة
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            تسجيل دخول الأدمن والموظفين
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            شركة نسيم العطاء التجارية · يفتح لكل موظف صلاحيات أقسامه المحددة فقط
          </p>
        </div>

        {/* Cloud Sync Google Login Button */}
        <div className="mb-5 p-3.5 rounded bg-teal-50/80 border border-teal-200 space-y-2">
          <div className="text-xs font-bold text-slate-800">
            1. الدخول السحابي بالإيميل عبر Google (للأدمن والموظفين المضافين):
          </div>
          <button
            type="button"
            disabled={isGoogleLoading}
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 bg-[#23838B] hover:bg-[#1a666d] text-white font-semibold text-xs rounded flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
          >
            <i className="fab fa-google text-sm"></i>
            <span>
              {isGoogleLoading
                ? 'جاري التحقق من البريد والصلاحيات السحابية...'
                : 'تسجيل الدخول بحساب Google المعتمد'}
            </span>
          </button>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            يتحقق النظام تلقائياً من بريدك الإلكتروني ويفتح لك الأقسام المخصصة لمهامك مع مزامنة فورية على جميع الأجهزة.
          </p>
        </div>

        {(errorMsg || cloudSyncError) && (
          <div
            role="alert"
            className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs font-medium break-words"
          >
            {errorMsg || cloudSyncError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin_identifier"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              2. أو الدخول ببريد الموظف وكود الدخول الخاص به
            </label>
            <input
              id="admin_identifier"
              type="text"
              required
              dir="ltr"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="employee@gmail.com أو yr.play.com@gmail.com"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#23838B]"
            />
          </div>

          <div>
            <label
              htmlFor="admin_password"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              كلمة المرور / كود الدخول للموظف
            </label>
            <div className="relative" dir="ltr">
              <input
                id="admin_password"
                type={showPassword ? 'text' : 'password'}
                required
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-10 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#23838B]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded transition-colors cursor-pointer"
          >
            دخول إلى بوابة العمل
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
          <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>دخول سريع للمالك (المدير العام):</span>
              <button
                type="button"
                onClick={handleFillDefault}
                className="text-[#23838B] hover:underline font-semibold cursor-pointer"
              >
                تعبئة تلقائية
              </button>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px]" dir="ltr">
              <span>Email: yr.play.com@gmail.com</span>
              <span>Pass: {authConfig.password}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateHome}
            className="w-full py-2 text-xs font-medium text-slate-600 hover:text-[#23838B] transition-colors cursor-pointer"
          >
            &rarr; العودة إلى واجهة الزوار الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
};
