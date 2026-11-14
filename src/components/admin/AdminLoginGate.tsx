import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useSite } from '../../context/SiteContext';
import { StaffMember } from '../../data/siteData';
import { authenticateStaffLogin, findStaffByEmail } from '../../utils/siteLogic';

export interface AdminLoginGateProps {
  children?: React.ReactNode;
  onLoginSuccess?: (staff?: StaffMember) => void;
  onNavigateHome?: () => void;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({
  children,
  onLoginSuccess,
  onNavigateHome,
}) => {
  const { siteState, signInWithGoogleAdmin } = useSite();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [googleBusy, setGoogleBusy] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        if (isMounted) {
          setUser(null);
          setIsAuthorized(false);
          setChecking(false);
        }
        return;
      }

      try {
        const cleanEmail = (currentUser.email || '').trim().toLowerCase();
        const isOwner = cleanEmail === 'yr.play.com@gmail.com';

        // 1. Check /admins/{uid} in Firestore
        let isSuperAdminDoc = false;
        try {
          const adminRef = doc(db, 'admins', currentUser.uid);
          const adminSnap = await getDoc(adminRef);
          isSuperAdminDoc = adminSnap.exists();
        } catch {
          // ignore if offline
        }

        // 2. Check authorizedEmails in /site_content/main
        let isInRemoteAuthorizedEmails = false;
        try {
          const mainContentRef = doc(db, 'site_content', 'main');
          const mainSnap = await getDoc(mainContentRef);
          if (mainSnap.exists()) {
            const data = mainSnap.data();
            if (Array.isArray(data.authorizedEmails) && cleanEmail) {
              isInRemoteAuthorizedEmails = data.authorizedEmails
                .map((e: unknown) => String(e).trim().toLowerCase())
                .includes(cleanEmail);
            }
          }
        } catch {
          // ignore if offline
        }

        const matchedStaff = findStaffByEmail(cleanEmail, siteState.staffMembers);
        const isLocalActiveStaff = Boolean(matchedStaff && matchedStaff.active);

        if (isOwner || isSuperAdminDoc || isInRemoteAuthorizedEmails || isLocalActiveStaff) {
          if (isMounted) {
            setUser(currentUser);
            setIsAuthorized(true);
            setError('');
            onLoginSuccess?.(matchedStaff || undefined);
          }
        } else {
          await signOut(auth);
          if (isMounted) {
            setUser(null);
            setIsAuthorized(false);
            setError('هذا الحساب غير مصرح له بالدخول إلى لوحة الإدارة.');
          }
        }
      } catch (err) {
        console.error('Error verifying staff permissions:', err);
        if (isMounted) {
          setUser(null);
          setIsAuthorized(false);
          setError('تعذر التحقق من صلاحيات الحساب، تأكد من إعدادات قاعدة البيانات.');
        }
      } finally {
        if (isMounted) {
          setChecking(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [siteState.staffMembers, onLoginSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // First verify against authorized staff members and access codes
    const staffAuth = authenticateStaffLogin(
      email,
      password,
      siteState.staffMembers,
      siteState.adminAuth
    );

    if (staffAuth.staff) {
      setIsAuthorized(true);
      onLoginSuccess?.(staffAuth.staff);
      return;
    }

    // Fallback to Firebase Email/Password authentication if configured
    setChecking(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      setError(staffAuth.error || 'البريد الإلكتروني أو كود الدخول غير صحيح.');
      setChecking(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleBusy(true);
    try {
      const res = await signInWithGoogleAdmin(true);
      if (res.ok && res.email) {
        const matched = findStaffByEmail(res.email, siteState.staffMembers);
        setIsAuthorized(true);
        onLoginSuccess?.(matched || undefined);
      } else if (res.error) {
        setError(res.error);
      }
    } catch {
      setError('تعذر تسجيل الدخول عبر حساب Google.');
    } finally {
      setGoogleBusy(false);
    }
  };

  if (checking) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 font-bold text-sm">جاري التحقق من صلاحيات الوصول...</p>
      </div>
    );
  }

  if (!user && !isAuthorized) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md bg-white p-7 rounded-2xl shadow-lg border border-slate-200">
          <div className="text-center mb-6">
            <img
              src={siteState.company.logo}
              alt={siteState.company.nameAr}
              referrerPolicy="no-referrer"
              className="h-14 w-auto mx-auto mb-3 object-contain"
            />
            <h2 className="text-xl font-extrabold text-slate-800">
              بوابة دخول الإدارة والموظفين
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              مخصصة للأدمنز والموظفين المعتمدين في قائمة الصلاحيات
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200"
            >
              {error}
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            type="button"
            disabled={googleBusy}
            onClick={handleGoogleSignIn}
            className="w-full mb-4 bg-white hover:bg-slate-50 text-slate-800 font-extrabold py-2.5 px-4 rounded-xl border border-slate-300 transition flex items-center justify-center gap-2.5 text-sm cursor-pointer disabled:opacity-60"
          >
            <i className="fab fa-google text-[#ea4335] text-base"></i>
            <span>
              {googleBusy ? 'جاري التحقق من حساب Google...' : 'تسجيل الدخول بحساب Google المعتمد'}
            </span>
          </button>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-xs font-bold">
              أو عبر البريد وكود الدخول
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                البريد الإلكتروني الوظيفي
              </label>
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yr.play.com@gmail.com"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                كود الدخول / كلمة المرور
              </label>
              <input
                type="password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-600"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#23838B] hover:bg-[#1a656b] text-white font-extrabold py-2.5 rounded-xl transition text-sm cursor-pointer"
            >
              دخول للوحة التحكم
            </button>
          </form>

          {onNavigateHome && (
            <button
              type="button"
              onClick={onNavigateHome}
              className="w-full mt-4 text-xs font-bold text-slate-500 hover:text-slate-800 py-2 transition cursor-pointer"
            >
              العودة إلى الواجهة العامة للموقع
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminLoginGate;