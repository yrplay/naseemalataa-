import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
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
  findStaffByEmail,
  hasStaffPermission,
} from '../utils/siteLogic';

const STORAGE_KEY = 'naseem_cms_state_v1';
const ADMIN_SESSION_KEY = 'naseem_admin_auth_session_v1';
const STAFF_EMAIL_SESSION_KEY = 'naseem_staff_email_session_v1';
const VISITOR_EMAIL_SESSION_KEY = 'naseem_visitor_email_session_v1';
const LANGUAGE_STORAGE_KEY = 'naseem_site_lang_v1';
const SITE_CONTENT_COLLECTION = 'site_content';
const SITE_CONTENT_DOC_ID = 'main';
const SITE_MEDIA_COLLECTION = 'site_media';
const MEDIA_REF_PREFIX = '__media__:';
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
  signedInVisitorEmail: string | null;
  loginVisitorEmail: (email: string) => void;
  hasPermission: (perm: StaffPermissionKey) => boolean;
  visitorPreviewMode: boolean;
  setVisitorPreviewMode: (val: boolean) => void;
  loginAdmin: (staff?: StaffMember) => void;
  logoutAdmin: () => void;
  publishChanges: () => string;
  cloudAdminUser: User | null;
  cloudSyncStatus: CloudSyncStatus;
  cloudSyncError: string;
  signInWithGoogleAdmin: (
    forceSelectAccount?: boolean
  ) => Promise<{ ok: boolean; isVisitor?: boolean; email?: string; error?: string }>;
  syncNowToCloud: (overrideState?: SiteState) => Promise<boolean>;
}

const SiteContext = createContext<SiteContextValue | undefined>(undefined);

function hashStringToMediaId(str: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  const step = Math.max(1, Math.floor(str.length / 4096));
  for (let i = 0; i < str.length; i += step) {
    const ch = str.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch + (i & 0xff);
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const hex1 = (h1 >>> 0).toString(36);
  const hex2 = (h2 >>> 0).toString(36);
  return `media_${hex1}_${hex2}_${str.length}`;
}

function buildPublicCopyObject(state: SiteState): Partial<SiteState> {
  return {
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
  };
}

function offloadLargeImagesForFirestore(
  obj: unknown,
  mediaOut: Map<string, string>,
  minCharsThreshold = 28000
): unknown {
  if (typeof obj === 'string') {
    if (
      obj.startsWith('data:image/') &&
      obj.length >= minCharsThreshold &&
      obj.length <= 845000
    ) {
      const mediaId = hashStringToMediaId(obj);
      mediaOut.set(mediaId, obj);
      return `${MEDIA_REF_PREFIX}${mediaId}`;
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => offloadLargeImagesForFirestore(item, mediaOut, minCharsThreshold));
  }
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = offloadLargeImagesForFirestore(v, mediaOut, minCharsThreshold);
    }
    return out;
  }
  return obj;
}

async function resolveMediaTokensInObject(
  obj: unknown,
  resolveMediaId: (mediaId: string) => Promise<string | null>
): Promise<unknown> {
  if (typeof obj === 'string') {
    if (obj.startsWith(MEDIA_REF_PREFIX)) {
      const mediaId = obj.slice(MEDIA_REF_PREFIX.length);
      const resolved = await resolveMediaId(mediaId);
      return resolved || obj;
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return Promise.all(obj.map((item) => resolveMediaTokensInObject(item, resolveMediaId)));
  }
  if (obj && typeof obj === 'object') {
    const entries = await Promise.all(
      Object.entries(obj as Record<string, unknown>).map(async ([k, v]) => [
        k,
        await resolveMediaTokensInObject(v, resolveMediaId),
      ])
    );
    return Object.fromEntries(entries);
  }
  return obj;
}

function normalizeSiteState(raw: Partial<SiteState>, defaults: SiteState): SiteState {
  const merged: SiteState = {
    ...defaults,
    ...raw,
    theme: {
      ...defaults.theme,
      ...(raw.theme || {}),
      headingFontFamily: raw.theme?.headingFontFamily || 'LIFTA SWASH V3',
    },
  };
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
  if (Array.isArray(merged.heroSlides)) {
    merged.heroSlides = merged.heroSlides.map((slide, sIdx) => {
      if (Array.isArray(slide.buttons)) {
        return {
          ...slide,
          showTitle: slide.showTitle !== false,
          contentPosition: slide.contentPosition || 'right',
          buttonsPosition: slide.buttonsPosition || slide.contentPosition || 'right',
          verticalPosition: slide.verticalPosition || 'center',
          buttonOffsetY: typeof slide.buttonOffsetY === 'number' ? slide.buttonOffsetY : 0,
          buttonOffsetX: typeof slide.buttonOffsetX === 'number' ? slide.buttonOffsetX : 0,
        };
      }
      const fallbackButtons = [];
      if (slide.primaryBtnLink !== '') {
        fallbackButtons.push({
          id: `btn-${sIdx}-1`,
          label: slide.primaryBtnText || {
            en: 'Products',
            ar: 'المنتجات',
            ur: 'مصنوعات',
            hi: 'उत्पाद',
          },
          link: slide.primaryBtnLink || '/all-products',
          style: 'primary' as const,
        });
      }
      if (slide.secondaryBtnLink !== '') {
        fallbackButtons.push({
          id: `btn-${sIdx}-2`,
          label: slide.secondaryBtnText || {
            en: 'Products Categories',
            ar: 'أقسام المنتجات',
            ur: 'مصنوعات کی اقسام',
            hi: 'उत्पाद श्रेणियाँ',
          },
          link: slide.secondaryBtnLink || '/products-categories',
          style: 'secondary' as const,
        });
      }
      return {
        ...slide,
        showTitle: slide.showTitle !== false,
        contentPosition: slide.contentPosition || 'right',
        buttonsPosition: slide.buttonsPosition || slide.contentPosition || 'right',
        verticalPosition: slide.verticalPosition || 'center',
        buttonOffsetY: typeof slide.buttonOffsetY === 'number' ? slide.buttonOffsetY : 0,
        buttonOffsetX: typeof slide.buttonOffsetX === 'number' ? slide.buttonOffsetX : 0,
        buttons: fallbackButtons,
      };
    });
  }
  if (!Array.isArray(merged.staffMembers) || merged.staffMembers.length === 0) {
    merged.staffMembers = DEFAULT_STAFF_MEMBERS;
  } else {
    const hasOwner = merged.staffMembers.some(
      (s) => s.email.trim().toLowerCase() === 'yr.play.com@gmail.com'
    );
    if (!hasOwner) {
      merged.staffMembers = [DEFAULT_STAFF_MEMBERS[0], ...merged.staffMembers];
    }
  }
  merged.staffMembers = (merged.staffMembers || []).map((member) => {
    const { accessCode: _legacyAccessCode, ...safeMember } = member as StaffMember & { accessCode?: string };
    return safeMember;
  });
  if (!Array.isArray(merged.staffAuditLog)) {
    merged.staffAuditLog = defaults.staffAuditLog || [];
  }
  return merged;
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

  // Authentication is restored only from Firebase Auth, never from localStorage.
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  const [loggedInStaffEmail, setLoggedInStaffEmail] = useState<string>('');

  const [signedInVisitorEmail, setSignedInVisitorEmail] = useState<string | null>(() => {
    try {
      return localStorage.getItem(VISITOR_EMAIL_SESSION_KEY) || null;
    } catch {
      return null;
    }
  });

  const [visitorPreviewMode, setVisitorPreviewMode] = useState<boolean>(false);
  const [cloudAdminUser, setCloudAdminUser] = useState<User | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('connecting');
  const [cloudSyncError, setCloudSyncError] = useState<string>('');

  const hasRemoteDocRef = useRef<boolean>(false);
  const remoteVersionRef = useRef<number>(1);
  const isApplyingRemoteRef = useRef<boolean>(false);
  const isSigningInPopupRef = useRef<boolean>(false);
  const hasUnsavedLocalChangesRef = useRef<boolean>(false);
  const lastLocalEditTimeRef = useRef<number>(0);
  const mediaCacheRef = useRef<Map<string, string>>(new Map());
  const uploadedMediaIdsRef = useRef<Set<string>>(new Set());
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const latestStateRef = useRef<SiteState>(siteState);
  latestStateRef.current = siteState;

  // Resolve a chunked media asset from memory cache or Firestore /site_media/{mediaId}
  const resolveMediaIdFromFirestore = useCallback(async (mediaId: string): Promise<string | null> => {
    if (!mediaId || !/^[a-zA-Z0-9_-]{1,128}$/.test(mediaId)) return null;
    const cached = mediaCacheRef.current.get(mediaId);
    if (cached) return cached;
    try {
      const localCached = localStorage.getItem(`naseem_media_${mediaId}`);
      if (localCached && localCached.startsWith('data:image/')) {
        mediaCacheRef.current.set(mediaId, localCached);
        return localCached;
      }
    } catch {
      // ignore
    }
    try {
      const mSnap = await getDoc(doc(db, SITE_MEDIA_COLLECTION, mediaId));
      if (mSnap.exists()) {
        const d = mSnap.data();
        if (typeof d.dataUrl === 'string' && d.dataUrl.length >= 5) {
          mediaCacheRef.current.set(mediaId, d.dataUrl);
          try {
            localStorage.setItem(`naseem_media_${mediaId}`, d.dataUrl);
          } catch {
            // ignore quota
          }
          return d.dataUrl;
        }
      }
    } catch {
      // ignore
    }
    return null;
  }, []);

  // Apply incoming remote state cleanly to React state & localStorage
  const applyIncomingRemoteState = useCallback((rawRemoteState: Partial<SiteState>) => {
    const defaults = createDefaultSiteState();
    isApplyingRemoteRef.current = true;
    setSiteStateInternal((prev) => {
      const normalized = normalizeSiteState(rawRemoteState, defaults);
      const merged: SiteState = {
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
      latestStateRef.current = merged;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // ignore quota
      }
      return merged;
    });
    setTimeout(() => {
      isApplyingRemoteRef.current = false;
    }, 60);
  }, []);

  // Re-verify only a verified Firebase identity when the staff roster changes.
  useEffect(() => {
    const user = auth.currentUser;
    if (!user?.email || !user.emailVerified) return;
    const cleanEmail = user.email.trim().toLowerCase();
    const matched = findStaffByEmail(cleanEmail, siteState.staffMembers);
    const isOwner = cleanEmail === 'yr.play.com@gmail.com';
    if (isOwner || (matched && matched.active)) {
      setCloudAdminUser(user);
      setLoggedInStaffEmail(cleanEmail);
      setIsAdminAuthenticated(true);
    } else {
      setCloudAdminUser(null);
      setLoggedInStaffEmail('');
      setIsAdminAuthenticated(false);
    }
  }, [siteState.staffMembers]);

  // Derive the active profile only from the current verified Firebase user.
  const currentStaffMember: StaffMember | null = React.useMemo(() => {
    if (!isAdminAuthenticated || !cloudAdminUser?.email || !cloudAdminUser.emailVerified) return null;
    const emailToLookup = cloudAdminUser.email;
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

  // Cross-tab instant synchronization via browser storage event
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          applyIncomingRemoteState(parsed);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [applyIncomingRemoteState]);

  // ENGINE 2: Push state to Firebase Cloud Firestore (/site_content/main + chunked /site_media/{mediaId})
  const pushStateToFirestore = useCallback(
    async (stateToSave: SiteState): Promise<boolean> => {
      const currentUser = auth.currentUser;
      if (!currentUser || !/^[a-zA-Z0-9_-]{1,128}$/.test(currentUser.uid)) {
        return false;
      }

      const docPath = `${SITE_CONTENT_COLLECTION}/${SITE_CONTENT_DOC_ID}`;
      const docRef = doc(db, SITE_CONTENT_COLLECTION, SITE_CONTENT_DOC_ID);

      try {
        setCloudSyncStatus('saving');
        setCloudSyncError('');

        // Extract large base64 images (> 28KB) into /site_media/{mediaId} so /site_content/main never exceeds 900KB
        const rawPublicCopy = buildPublicCopyObject(stateToSave);
        const extractedMedia = new Map<string, string>();
        const compactPublicCopy = offloadLargeImagesForFirestore(
          rawPublicCopy,
          extractedMedia,
          28000
        ) as Partial<SiteState>;

        // Upload any new chunked media assets to /site_media/{mediaId}
        for (const [mediaId, dataUrl] of extractedMedia.entries()) {
          mediaCacheRef.current.set(mediaId, dataUrl);
          if (!uploadedMediaIdsRef.current.has(mediaId)) {
            const mediaDocPath = `${SITE_MEDIA_COLLECTION}/${mediaId}`;
            const mediaRef = doc(db, SITE_MEDIA_COLLECTION, mediaId);
            try {
              const existingMedia = await getDoc(mediaRef);
              if (!existingMedia.exists()) {
                await setDoc(mediaRef, {
                  mediaId,
                  dataUrl,
                  updatedBy: currentUser.uid,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                });
              }
              uploadedMediaIdsRef.current.add(mediaId);
            } catch (mediaErr) {
              handleFirestoreError(mediaErr, OperationType.CREATE, mediaDocPath);
            }
          }
        }

        const payloadJson = JSON.stringify(compactPublicCopy);
        if (payloadJson.length > MAX_PAYLOAD_LENGTH) {
          throw new Error(
            'حجم البيانات النصية يتجاوز الحد المسموح به للمزامنة السحابية (900KB).'
          );
        }

        let isSuperAdminUser =
          currentUser.email?.trim().toLowerCase() === 'yr.play.com@gmail.com';

        if (!isSuperAdminUser) {
          try {
            const adminSnap = await getDoc(doc(db, 'admins', currentUser.uid));
            if (adminSnap.exists()) {
              isSuperAdminUser = true;
            }
          } catch {
            // Non-super-admin or offline
          }
        }

        let existsOnServer = false;
        let currentServerVersion = remoteVersionRef.current || 1;
        try {
          const existingSnap = await getDoc(docRef);
          existsOnServer = existingSnap.exists();
          if (existingSnap.exists()) {
            hasRemoteDocRef.current = true;
            const d = existingSnap.data();
            if (typeof d.version === 'number') {
              currentServerVersion = d.version;
              remoteVersionRef.current = d.version;
            }
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, docPath);
        }

        if (!existsOnServer) {
          try {
            await setDoc(docRef, {
              payloadJson,
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
          const nextVersion = currentServerVersion + 1;
          try {
            if (isSuperAdminUser) {
              await updateDoc(docRef, {
                payloadJson,
                authorizedEmails: deleteField(),
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

        if (isSuperAdminUser) {
          const existingStaff = await getDocs(collection(db, 'staff_profiles'));
          const retainedUids = new Set<string>();
          for (const member of stateToSave.staffMembers || []) {
            const uid = member.uid?.trim();
            if (!uid || !/^[a-zA-Z0-9_-]{1,128}$/.test(uid)) continue;
            retainedUids.add(uid);
            await setDoc(doc(db, 'staff_profiles', uid), {
              uid, id: member.id, email: member.email.trim().toLowerCase(),
              name: member.name, jobTitle: member.jobTitle, rolePreset: member.rolePreset,
              permissions: member.permissions, active: member.active, addedAt: member.addedAt,
            });
          }
        }
        hasUnsavedLocalChangesRef.current = false;
        setCloudSyncStatus('synced');
        return true;
      } catch (err) {
        setCloudSyncStatus('error');
        const rawMsg = err instanceof Error ? err.message : String(err);
        const arabicMsg = rawMsg.includes('insufficient permissions')
          ? 'عذراً، لا تملك صلاحيات كافية لحفظ هذا التعديل في قاعدة البيانات السحابية.'
          : `تعذر حفظ التعديلات سحابياً: ${rawMsg}`;
        setCloudSyncError(arabicMsg);
        return false;
      }
    },
    []
  );

  // Firestore is the single authoritative synchronization engine.
  const pushStateEverywhere = useCallback(
    (stateToSave: SiteState): Promise<boolean> => pushStateToFirestore(stateToSave),
    [pushStateToFirestore]
  );

  // Resolve roles from private Firestore profiles, not from public storefront content.
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user?.email || !user.emailVerified) {
        setCloudAdminUser(null); setLoggedInStaffEmail(''); setIsAdminAuthenticated(false);
        setSiteStateInternal((prev) => ({ ...prev, staffMembers: [] }));
        try { localStorage.removeItem(ADMIN_SESSION_KEY); localStorage.removeItem(STAFF_EMAIL_SESSION_KEY); } catch { /* ignore */ }
        return;
      }
      const cleanEmail = user.email.trim().toLowerCase();
      const isOwner = cleanEmail === 'yr.play.com@gmail.com';
      try {
        let privateStaff: StaffMember[] = [];
        if (isOwner) {
          const snapshot = await getDocs(collection(db, 'staff_profiles'));
          privateStaff = snapshot.docs.map((item) => item.data() as StaffMember);
          if (!privateStaff.some((member) => member.email?.trim().toLowerCase() === cleanEmail)) {
            privateStaff.unshift({ ...DEFAULT_STAFF_MEMBERS[0], uid: user.uid, active: true });
          }
        } else {
          const profileSnap = await getDoc(doc(db, 'staff_profiles', user.uid));
          if (profileSnap.exists()) {
            const profile = profileSnap.data() as StaffMember;
            if (profile.uid === user.uid && profile.email?.trim().toLowerCase() === cleanEmail && profile.active) privateStaff = [profile];
          }
        }
        if (auth.currentUser?.uid !== user.uid) return;
        const authorized = isOwner || privateStaff.some((member) => member.email?.trim().toLowerCase() === cleanEmail && member.active);
        if (!authorized) {
          await signOut(auth);
          setCloudAdminUser(null); setLoggedInStaffEmail(''); setIsAdminAuthenticated(false);
          setSiteStateInternal((prev) => ({ ...prev, staffMembers: [] }));
          return;
        }
        setSiteStateInternal((prev) => ({ ...prev, staffMembers: privateStaff }));
        setCloudAdminUser(user); setLoggedInStaffEmail(cleanEmail); setIsAdminAuthenticated(true);
        try { localStorage.setItem(ADMIN_SESSION_KEY, 'true'); localStorage.setItem(STAFF_EMAIL_SESSION_KEY, cleanEmail); } catch { /* ignore */ }
      } catch (error) {
        console.error('Unable to load private staff profile', error);
        setCloudAdminUser(null); setLoggedInStaffEmail(''); setIsAdminAuthenticated(false);
      }
    });
    return () => unsubAuth();
  }, []);

  // ENGINE 2 LISTENER: Real-time listener on Firestore /site_content/main for ALL visitors & staff on ALL devices
  useEffect(() => {
    const docPath = `${SITE_CONTENT_COLLECTION}/${SITE_CONTENT_DOC_ID}`;
    const docRef = doc(db, SITE_CONTENT_COLLECTION, SITE_CONTENT_DOC_ID);

    const unsubscribe = onSnapshot(
      docRef,
      async (snapshot) => {
        // Ignore local latency-compensation echo from our own pending writes
        if (snapshot.metadata.hasPendingWrites) {
          return;
        }
        // If user is mid-Google-popup with unsaved local edits, don't let the auth-reconnect snapshot wipe their edits
        if (isSigningInPopupRef.current && hasUnsavedLocalChangesRef.current) {
          return;
        }
        if (Date.now() - lastLocalEditTimeRef.current < 1200) {
          return;
        }

        if (snapshot.exists()) {
          hasRemoteDocRef.current = true;
          const data = snapshot.data();
          if (typeof data.version === 'number') {
            remoteVersionRef.current = data.version;
          }
          if (typeof data.payloadJson === 'string' && data.payloadJson.length >= 2) {
            try {
              const parsed = JSON.parse(data.payloadJson);
              const hydrated = (await resolveMediaTokensInObject(
                parsed,
                resolveMediaIdFromFirestore
              )) as Partial<SiteState>;
              applyIncomingRemoteState(hydrated);
              setCloudSyncStatus('synced');
            } catch {
              // ignore malformed JSON
            }
          }
        } else {
          hasRemoteDocRef.current = false;
        }
      },
      (error) => {
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
  }, [applyIncomingRemoteState, resolveMediaIdFromFirestore]);

  const scheduleRemoteSync = useCallback(
    (nextState: SiteState) => {
      hasUnsavedLocalChangesRef.current = true;
      lastLocalEditTimeRef.current = Date.now();
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
      syncTimerRef.current = setTimeout(() => {
        void pushStateEverywhere(nextState);
      }, 220);
    },
    [pushStateEverywhere]
  );

  const setSiteState: React.Dispatch<React.SetStateAction<SiteState>> = useCallback(
    (action) => {
      setSiteStateInternal((prev) => {
        const next = typeof action === 'function' ? action(prev) : action;
        latestStateRef.current = next;
        if (!isApplyingRemoteRef.current) {
          scheduleRemoteSync(next);
        }
        return next;
      });
    },
    [scheduleRemoteSync]
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

  const signInWithGoogleAdmin = async (
    forceSelectAccount = true
  ): Promise<{ ok: boolean; isVisitor?: boolean; email?: string; error?: string }> => {
    const stateBeforeSignIn = latestStateRef.current;
    const hadLocalEdits = hasUnsavedLocalChangesRef.current;
    isSigningInPopupRef.current = true;
    try {
      setCloudSyncError('');
      if (forceSelectAccount) {
        googleProvider.setCustomParameters({ prompt: 'select_account' });
      }
      const cred = await signInWithPopup(auth, googleProvider);
      const user = cred.user;
      if (user && user.email) {
        const cleanEmail = user.email.trim().toLowerCase();
        if (!user.emailVerified) {
          await signOut(auth);
          setIsAdminAuthenticated(false);
          setCloudAdminUser(null);
          return { ok: false, error: 'يجب توثيق البريد الإلكتروني قبل تفعيل صلاحيات الإدارة.' };
        }
        const isOwner = cleanEmail === 'yr.play.com@gmail.com';
        let matched: StaffMember | null = null;
        if (!isOwner) {
          const profileSnap = await getDoc(doc(db, 'staff_profiles', user.uid));
          if (profileSnap.exists()) {
            const profile = profileSnap.data() as StaffMember;
            if (profile.uid === user.uid && profile.email?.trim().toLowerCase() === cleanEmail) {
              matched = profile;
              setSiteStateInternal((prev) => ({ ...prev, staffMembers: [profile] }));
            }
          }
        }
        if (!isOwner && (!matched || !matched.active)) {
          await signOut(auth);
          setIsAdminAuthenticated(false);
          setSignedInVisitorEmail(cleanEmail);
          try {
            localStorage.removeItem(ADMIN_SESSION_KEY);
            localStorage.setItem(VISITOR_EMAIL_SESSION_KEY, cleanEmail);
          } catch {
            // ignore
          }
          const msg = `تم تسجيل دخولك بحساب (${cleanEmail}) كزائر. (ملاحظة: هذا البريد غير مضاف في قائمة الأدمنز حالياً، لذلك لن يظهر له زر لوحة التحكم).`;
          return { ok: false, isVisitor: true, email: cleanEmail, error: msg };
        }

        if (isOwner) {
          const snapshot = await getDocs(collection(db, 'staff_profiles'));
          setSiteStateInternal((prev) => ({ ...prev, staffMembers: snapshot.docs.map((item) => item.data() as StaffMember) }));
        }
        setCloudAdminUser(user);
        setLoggedInStaffEmail(cleanEmail);
        setSignedInVisitorEmail(cleanEmail);
        setIsAdminAuthenticated(true);
        setVisitorPreviewMode(false);
        try {
          localStorage.setItem(ADMIN_SESSION_KEY, 'true');
          localStorage.setItem(STAFF_EMAIL_SESSION_KEY, cleanEmail);
          localStorage.setItem(VISITOR_EMAIL_SESSION_KEY, cleanEmail);
        } catch {
          // ignore
        }

        const stateToPush = hadLocalEdits ? stateBeforeSignIn : latestStateRef.current;
        if (hadLocalEdits) {
          latestStateRef.current = stateBeforeSignIn;
          setSiteStateInternal(stateBeforeSignIn);
        }
        await pushStateEverywhere(stateToPush);
        return { ok: true, email: cleanEmail };
      }
      return { ok: false, error: 'لم يتم استلام بيانات البريد الإلكتروني من Google.' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setCloudSyncError(msg);
      return { ok: false, error: msg };
    } finally {
      isSigningInPopupRef.current = false;
    }
  };

  const syncNowToCloud = async (overrideState?: SiteState): Promise<boolean> => {
    const targetState = overrideState || latestStateRef.current;
    if (!auth.currentUser) {
      const res = await signInWithGoogleAdmin(true);
      if (!res.ok) return false;
    }
    return pushStateToFirestore(targetState);
  };

  const loginVisitorEmail = (email: string) => {
    const clean = email.trim().toLowerCase();
    if (!clean) return;
    setSignedInVisitorEmail(clean);
    try {
      localStorage.setItem(VISITOR_EMAIL_SESSION_KEY, clean);
    } catch {
      // ignore
    }
    // An email string is visitor profile data, never proof of administrative identity.
  };

  const loginAdmin = (_staff?: StaffMember) => {
    const user = auth.currentUser;
    if (!user?.email || !user.emailVerified) return;
    const email = user.email.trim().toLowerCase();
    const matched = findStaffByEmail(email, latestStateRef.current.staffMembers);
    if (email !== 'yr.play.com@gmail.com' && (!matched || !matched.active)) return;
    setCloudAdminUser(user);
    setLoggedInStaffEmail(email);
    setSignedInVisitorEmail(email);
    setIsAdminAuthenticated(true);
    setVisitorPreviewMode(false);
    try {
      localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      localStorage.setItem(STAFF_EMAIL_SESSION_KEY, email);
      localStorage.setItem(VISITOR_EMAIL_SESSION_KEY, email);
    } catch {
      // ignore
    }
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    setSignedInVisitorEmail(null);
    setVisitorPreviewMode(false);
    try {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(STAFF_EMAIL_SESSION_KEY);
      localStorage.removeItem(VISITOR_EMAIL_SESSION_KEY);
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
      void pushStateEverywhere(next);
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
    setSiteState((prev) => ({
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
        signedInVisitorEmail,
        loginVisitorEmail,
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
      {/* Dynamic Style Tag for Theme Colors, Heading Font, Backgrounds & Custom CSS */}
      <style>{`
        :root {
          --primary: ${siteState.theme.primaryColor};
          --secondary: ${siteState.theme.secondaryColor};
          --light: ${siteState.theme.lightBgColor};
          --dark: ${siteState.theme.darkFooterColor};
          --heading-font: "${siteState.theme.headingFontFamily || 'LIFTA SWASH V3'}", "Lifta Swash V3", "Lora", "Cairo", serif;
        }
        h1, .h1, h2, .h2 {
          font-family: var(--heading-font);
          color: ${siteState.theme.secondaryColor};
        }
        h3, .h3, h4, .h4, h5, .h5, h6, .h6 {
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
