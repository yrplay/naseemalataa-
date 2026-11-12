import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  ALL_STAFF_PERMISSIONS,
  ContactSubmission,
  createDefaultSiteState,
  DEFAULT_ADMIN_AUTH,
  DEFAULT_STAFF_MEMBERS,
  LanguageCode,
  SiteState,
  StaffMember,
  StaffPermissionKey,
} from '../data/siteData';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import {
  extractAuthorizedEmails,
  findStaffByEmail,
  hasStaffPermission,
} from '../utils/siteLogic';

const STORAGE_KEY = 'naseem_cms_state_v1';
const ADMIN_SESSION_KEY = 'naseem_admin_auth_session_v1';
const STAFF_EMAIL_SESSION_KEY = 'naseem_staff_email_session_v1';
const LANGUAGE_STORAGE_KEY = 'naseem_site_lang_v1';
const SITE_CONTENT_COLLECTION = 'site_content';
const SITE_CONTENT_DOC_ID = 'main';
const MAX_PAYLOAD_LENGTH = 890000;

export type CloudSyncStatus = 'connecting' | 'synced' | 'saving' | 'local-only' | 'error';

interface SiteContextValue {
  siteState: SiteState;
  setSiteState: React.Dispatch<React.SetStateAction<SiteState>>;
  updateSiteState: (updater: (prev: SiteState) => SiteState, actionLabel?: string) => void;
  resetSiteState: () => void;
  addContactSubmission: (
    msg: Omit<ContactSubmission, 'id' | 'submittedAt' | 'read'>
  ) => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  isAdminAuthenticated: boolean;
  currentStaffMember: StaffMember | null;
  hasPermission: (perm: StaffPermissionKey) => boolean;
  visitorPreviewMode: boolean;
  setVisitorPreviewMode: (val: boolean) => void;
  loginAdmin: (staff?: StaffMember) => void;
  logoutAdmin: () => void;
  publishChanges: () => string;
  cloudAdminUser: User | null;
  cloudSyncStatus: CloudSyncStatus;
  cloudSyncError: string;
  signInWithGoogleAdmin: () => Promise<{ ok: boolean; error?: string }>;
  syncNowToCloud: (overrideState?: SiteState) => Promise<boolean>;
}

const SiteContext = createContext<SiteContextValue | undefined>(undefined);

function normalizeSiteState(raw: Partial<SiteState>, defaults: SiteState): SiteState {
  const merged: SiteState = { ...defaults, ...raw };
  if (Array.isArray(merged.categories)) {
    merged.categories = merged.categories.map((cat, idx) => {
      if (!cat.slug || cat.slug === 'n-a' || /^category-\d+$/.test(cat.slug)) {
        const fallback = defaults.categories.find((d) => d.id === cat.id);
        return {
          ...cat,
          slug: fallback && fallback.slug !== 'n-a' ? fallback.slug : `category-${idx + 1}`,
        };
      }
      return cat;
    });
  }
  if (Array.isArray(merged.products)) {
    merged.products = merged.products.map((prod) => ({
      ...prod,
      categorySlugs: Array.isArray(prod.categorySlugs) ? prod.categorySlugs : [],
    }));
  }
  if (!Array.isArray(merged.staffMembers) || merged.staffMembers.length === 0) {
    merged.staffMembers = DEFAULT_STAFF_MEMBERS;
  } else {
    // Ensure owner yr.play.com@gmail.com always exists and is active super_admin
    const hasOwner = merged.staffMembers.some(
      (s) => s.email.trim().toLowerCase() === 'yr.play.com@gmail.com'
    );
    if (!hasOwner) {
      merged.staffMembers = [DEFAULT_STAFF_MEMBERS[0], ...merged.staffMembers];
    }
  }
  if (!Array.isArray(merged.staffAuditLog)) {
    merged.staffAuditLog = defaults.staffAuditLog || [];
  }
  return merged;
}

function serializePublicSiteState(state: SiteState): string {
  // Strip private passwords from staffMembers and adminAuth before storing in public cloud doc
  const sanitizedStaff: StaffMember[] = (state.staffMembers || DEFAULT_STAFF_MEMBERS).map(
    (s) => ({
      ...s,
      accessCode: s.accessCode || undefined,
    })
  );

  const publicCopy: Partial<SiteState> = {
    company: state.company,
    theme: state.theme,
    heroSlides: state.heroSlides,
    homeAbout: state.homeAbout,
    aboutPage: state.aboutPage,
    categories: state.categories,
    products: state.products,
    marketPlaces: state.marketPlaces,
    privacyPolicy: state.privacyPolicy,
    termsAndConditions: state.termsAndConditions,
    customPages: state.customPages,
    uiTranslations: state.uiTranslations,
    staffMembers: sanitizedStaff,
    staffAuditLog: (state.staffAuditLog || []).slice(0, 60),
    adminAuth: {
      ...DEFAULT_ADMIN_AUTH,
      lastPublishedAt: state.adminAuth?.lastPublishedAt || DEFAULT_ADMIN_AUTH.lastPublishedAt,
    },
  };
  const json = JSON.stringify(publicCopy);
  if (json.length > MAX_PAYLOAD_LENGTH) {
    throw new Error(
      'حجم البيانات يتجاوز الحد المسموح به للمزامنة السحابية (900KB). يرجى تقليل حجم الصور المرفوعة.'
    );
  }
  return json;
}

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode | null;
      if (savedLang && ['ar', 'en', 'ur', 'hi'].includes(savedLang)) {
        return savedLang;
      }
    } catch {
      // ignore
    }
    return 'ar';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  const [siteState, setSiteStateInternal] = useState<SiteState>(() => {
    const defaults = createDefaultSiteState();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return normalizeSiteState(parsed, defaults);
      }
    } catch {
      // Fallback to default state
    }
    return defaults;
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [loggedInStaffEmail, setLoggedInStaffEmail] = useState<string>(() => {
    try {
      return localStorage.getItem(STAFF_EMAIL_SESSION_KEY) || 'yr.play.com@gmail.com';
    } catch {
      return 'yr.play.com@gmail.com';
    }
  });

  const [visitorPreviewMode, setVisitorPreviewMode] = useState<boolean>(false);
  const [cloudAdminUser, setCloudAdminUser] = useState<User | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('connecting');
  const [cloudSyncError, setCloudSyncError] = useState<string>('');

  const hasRemoteDocRef = useRef<boolean>(false);
  const remoteVersionRef = useRef<number>(1);
  const isApplyingRemoteRef = useRef<boolean>(false);
  const latestStateRef = useRef<SiteState>(siteState);
  latestStateRef.current = siteState;

  // Derive active staff profile from siteState.staffMembers
  const currentStaffMember: StaffMember | null = React.useMemo(() => {
    if (!isAdminAuthenticated) return null;
    const emailToLookup = cloudAdminUser?.email || loggedInStaffEmail || 'yr.play.com@gmail.com';
    const found = findStaffByEmail(emailToLookup, siteState.staffMembers);
    if (found) {
      return found.active ? found : null;
    }
    if (emailToLookup.trim().toLowerCase() === 'yr.play.com@gmail.com') {
      return {
        ...DEFAULT_STAFF_MEMBERS[0],
        permissions: [...ALL_STAFF_PERMISSIONS],
        active: true,
      };
    }
    return null;
  }, [isAdminAuthenticated, cloudAdminUser, loggedInStaffEmail, siteState.staffMembers]);

  const hasPermission = useCallback(
    (perm: StaffPermissionKey): boolean => {
      return hasStaffPermission(currentStaffMember, perm);
    },
    [currentStaffMember]
  );

  // Save to localStorage as instant local cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(siteState));
    } catch {
      // Ignore quota errors
    }
  }, [siteState]);

  const pushStateToFirestore = useCallback(async (stateToSave: SiteState): Promise<boolean> => {
    const currentUser = auth.currentUser;
    if (!currentUser || !/^[a-zA-Z0-9_-]{1,128}$/.test(currentUser.uid)) {
      setCloudSyncStatus('local-only');
      return false;
    }

    const docPath = `${SITE_CONTENT_COLLECTION}/${SITE_CONTENT_DOC_ID}`;
    const docRef = doc(db, SITE_CONTENT_COLLECTION, SITE_CONTENT_DOC_ID);

    try {
      setCloudSyncStatus('saving');
      setCloudSyncError('');
      const payloadJson = serializePublicSiteState(stateToSave);
      const authorizedEmails = extractAuthorizedEmails(stateToSave.staffMembers);
      const isSuperAdminUser =
        currentUser.email?.trim().toLowerCase() === 'yr.play.com@gmail.com';

      let existsOnServer = hasRemoteDocRef.current;
      if (!existsOnServer) {
        try {
          const existingSnap = await getDoc(docRef);
          existsOnServer = existingSnap.exists();
          if (existingSnap.exists()) {
            hasRemoteDocRef.current = true;
            const d = existingSnap.data();
            if (typeof d.version === 'number') {
              remoteVersionRef.current = d.version;
            }
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, docPath);
        }
      }

      if (!existsOnServer) {
        try {
          await setDoc(docRef, {
            payloadJson,
            authorizedEmails,
            updatedBy: currentUser.uid,
            version: 1,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          hasRemoteDocRef.current = true;
          remoteVersionRef.current = 1;
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, docPath);
        }
      } else {
        const nextVersion = (remoteVersionRef.current || 1) + 1;
        try {
          if (isSuperAdminUser) {
            await updateDoc(docRef, {
              payloadJson,
              authorizedEmails,
              updatedBy: currentUser.uid,
              version: nextVersion,
              updatedAt: serverTimestamp(),
            });
          } else {
            // Tier 2 Staff Member: update payloadJson without mutating authorizedEmails
            await updateDoc(docRef, {
              payloadJson,
              updatedBy: currentUser.uid,
              version: nextVersion,
              updatedAt: serverTimestamp(),
            });
          }
          remoteVersionRef.current = nextVersion;
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, docPath);
        }
      }

      setCloudSyncStatus('synced');
      return true;
    } catch (err) {
      setCloudSyncStatus('error');
      const msg = err instanceof Error ? err.message : String(err);
      setCloudSyncError(msg);
      return false;
    }
  }, []);

  // Track Firebase Auth state and verify employee authorization
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        const matched = findStaffByEmail(user.email, latestStateRef.current.staffMembers);
        const isOwner = user.email.trim().toLowerCase() === 'yr.play.com@gmail.com';
        if (isOwner || (matched && matched.active)) {
          setCloudAdminUser(user);
          setLoggedInStaffEmail(user.email.trim().toLowerCase());
          setIsAdminAuthenticated(true);
          try {
            localStorage.setItem(ADMIN_SESSION_KEY, 'true');
            localStorage.setItem(STAFF_EMAIL_SESSION_KEY, user.email.trim().toLowerCase());
          } catch {
            // ignore
          }
        } else {
          setCloudAdminUser(null);
        }
      } else {
        setCloudAdminUser(null);
      }
    });
    return () => unsubAuth();
  }, []);

  // Real-time listener on /site_content/main for ALL visitors & staff on ALL devices
  useEffect(() => {
    const docPath = `${SITE_CONTENT_COLLECTION}/${SITE_CONTENT_DOC_ID}`;
    const docRef = doc(db, SITE_CONTENT_COLLECTION, SITE_CONTENT_DOC_ID);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          hasRemoteDocRef.current = true;
          const data = snapshot.data();
          if (typeof data.version === 'number') {
            remoteVersionRef.current = data.version;
          }
          if (typeof data.payloadJson === 'string' && data.payloadJson.length >= 2) {
            try {
              const parsed = JSON.parse(data.payloadJson);
              const defaults = createDefaultSiteState();
              isApplyingRemoteRef.current = true;
              setSiteStateInternal((prev) => {
                const normalized = normalizeSiteState(parsed, defaults);
                return {
                  ...normalized,
                  contactMessages: prev.contactMessages,
                  adminAuth: {
                    ...(prev.adminAuth || DEFAULT_ADMIN_AUTH),
                    lastPublishedAt:
                      normalized.adminAuth?.lastPublishedAt ||
                      prev.adminAuth?.lastPublishedAt ||
                      DEFAULT_ADMIN_AUTH.lastPublishedAt,
                  },
                };
              });
              setCloudSyncStatus('synced');
              setTimeout(() => {
                isApplyingRemoteRef.current = false;
              }, 50);
            } catch {
              // ignore malformed JSON
            }
          }
        } else {
          hasRemoteDocRef.current = false;
          setCloudSyncStatus(auth.currentUser ? 'synced' : 'local-only');
        }
      },
      (error) => {
        setCloudSyncStatus('error');
        try {
          handleFirestoreError(error, OperationType.GET, docPath);
        } catch (handledErr) {
          setCloudSyncError(
            handledErr instanceof Error ? handledErr.message : String(handledErr)
          );
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const setSiteState: React.Dispatch<React.SetStateAction<SiteState>> = useCallback(
    (action) => {
      setSiteStateInternal((prev) => {
        const next = typeof action === 'function' ? action(prev) : action;
        latestStateRef.current = next;
        if (!isApplyingRemoteRef.current && auth.currentUser) {
          void pushStateToFirestore(next);
        }
        return next;
      });
    },
    [pushStateToFirestore]
  );

  const updateSiteState = useCallback(
    (updater: (prev: SiteState) => SiteState, actionLabel?: string) => {
      setSiteState((prev) => {
        const updated = updater(prev);
        if (actionLabel && currentStaffMember) {
          const entry = {
            id: `audit-${Date.now()}`,
            staffName: currentStaffMember.name,
            staffEmail: currentStaffMember.email,
            action: actionLabel,
            timestamp: new Date().toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
          return {
            ...updated,
            staffAuditLog: [entry, ...(updated.staffAuditLog || [])].slice(0, 60),
          };
        }
        return updated;
      });
    },
    [setSiteState, currentStaffMember]
  );

  const signInWithGoogleAdmin = async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      setCloudSyncError('');
      const cred = await signInWithPopup(auth, googleProvider);
      const user = cred.user;
      if (user && user.email) {
        const cleanEmail = user.email.trim().toLowerCase();
        const matched = findStaffByEmail(cleanEmail, latestStateRef.current.staffMembers);
        const isOwner = cleanEmail === 'yr.play.com@gmail.com';

        if (!isOwner && (!matched || !matched.active)) {
          await signOut(auth);
          const msg = `البريد الإلكتروني (${cleanEmail}) غير مسجل ضمن قائمة الموظفين أو الأدمنز المعتمدين. يجب أن يقوم المدير العام بإضافة إيميلك أولاً من قسم (الموظفون والصلاحيات).`;
          setCloudSyncError(msg);
          return { ok: false, error: msg };
        }

        setCloudAdminUser(user);
        setLoggedInStaffEmail(cleanEmail);
        setIsAdminAuthenticated(true);
        try {
          localStorage.setItem(ADMIN_SESSION_KEY, 'true');
          localStorage.setItem(STAFF_EMAIL_SESSION_KEY, cleanEmail);
        } catch {
          // ignore
        }
        await pushStateToFirestore(latestStateRef.current);
        return { ok: true };
      }
      return { ok: false, error: 'لم يتم استلام بيانات البريد الإلكتروني من Google.' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setCloudSyncError(msg);
      return { ok: false, error: msg };
    }
  };

  const syncNowToCloud = async (overrideState?: SiteState): Promise<boolean> => {
    const targetState = overrideState || latestStateRef.current;
    if (!auth.currentUser) {
      const res = await signInWithGoogleAdmin();
      if (!res.ok) return false;
    }
    return pushStateToFirestore(targetState);
  };

  const loginAdmin = (staff?: StaffMember) => {
    const email = staff?.email?.trim().toLowerCase() || 'yr.play.com@gmail.com';
    setLoggedInStaffEmail(email);
    setIsAdminAuthenticated(true);
    try {
      localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      localStorage.setItem(STAFF_EMAIL_SESSION_KEY, email);
    } catch {
      // ignore
    }
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    setVisitorPreviewMode(false);
    try {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(STAFF_EMAIL_SESSION_KEY);
    } catch {
      // ignore
    }
    if (auth.currentUser) {
      void signOut(auth);
    }
  };

  const publishChanges = (): string => {
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    setSiteStateInternal((prev) => {
      const next: SiteState = {
        ...prev,
        adminAuth: {
          ...(prev.adminAuth || DEFAULT_ADMIN_AUTH),
          lastPublishedAt: timestamp,
        },
      };
      latestStateRef.current = next;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      if (auth.currentUser) {
        void pushStateToFirestore(next);
      }
      return next;
    });
    return timestamp;
  };

  // Apply dynamic theme CSS variables and custom CSS
  useEffect(() => {
    const root = document.documentElement;
    const { theme } = siteState;
    root.style.setProperty('--primary', theme.primaryColor || '#23838B');
    root.style.setProperty('--secondary', theme.secondaryColor || '#BE9C6A');
    root.style.setProperty('--light', theme.lightBgColor || '#F7F8FC');
    root.style.setProperty('--dark', theme.darkFooterColor || '#111111');
  }, [siteState.theme]);

  const resetSiteState = () => {
    const fresh = createDefaultSiteState();
    setSiteState(fresh);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const addContactSubmission = (
    msg: Omit<ContactSubmission, 'id' | 'submittedAt' | 'read'>
  ) => {
    const newEntry: ContactSubmission = {
      ...msg,
      id: `msg-${Date.now()}`,
      submittedAt: new Date().toLocaleString(),
      read: false,
    };
    setSiteStateInternal((prev) => ({
      ...prev,
      contactMessages: [newEntry, ...prev.contactMessages],
    }));
  };

  return (
    <SiteContext.Provider
      value={{
        siteState,
        setSiteState,
        updateSiteState,
        resetSiteState,
        addContactSubmission,
        language,
        setLanguage,
        isAdminAuthenticated: Boolean(isAdminAuthenticated && currentStaffMember),
        currentStaffMember,
        hasPermission,
        visitorPreviewMode,
        setVisitorPreviewMode,
        loginAdmin,
        logoutAdmin,
        publishChanges,
        cloudAdminUser,
        cloudSyncStatus,
        cloudSyncError,
        signInWithGoogleAdmin,
        syncNowToCloud,
      }}
    >
      {/* Dynamic Style Tag for Theme Colors, Backgrounds & Custom CSS */}
      <style>{`
        :root {
          --primary: ${siteState.theme.primaryColor};
          --secondary: ${siteState.theme.secondaryColor};
          --light: ${siteState.theme.lightBgColor};
          --dark: ${siteState.theme.darkFooterColor};
        }
        h1, .h1, h2, .h2, h3, .h3, h4, .h4, h5, .h5, h6, .h6 {
          color: ${siteState.theme.secondaryColor};
        }
        .naseem-p {
          color: ${siteState.theme.primaryColor};
        }
        .bg-icon {
          background-image: url('${siteState.theme.bgIconUrl}');
        }
        .page-header {
          background-image: url('${siteState.theme.pageHeaderBgUrl}');
        }
        ${siteState.theme.customCss || ''}
      `}</style>
      {children}
    </SiteContext.Provider>
  );
};

export function useSite(): SiteContextValue {
  const ctx = useContext(SiteContext);
  if (!ctx) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return ctx;
}
