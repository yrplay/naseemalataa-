import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ContactSubmission,
  createDefaultSiteState,
  DEFAULT_ADMIN_AUTH,
  SiteState,
} from '../data/siteData';

const STORAGE_KEY = 'naseem_cms_state_v1';
const ADMIN_SESSION_KEY = 'naseem_admin_auth_session_v1';

interface SiteContextValue {
  siteState: SiteState;
  setSiteState: React.Dispatch<React.SetStateAction<SiteState>>;
  updateSiteState: (updater: (prev: SiteState) => SiteState) => void;
  resetSiteState: () => void;
  addContactSubmission: (
    msg: Omit<ContactSubmission, 'id' | 'submittedAt' | 'read'>
  ) => void;
  isAdminAuthenticated: boolean;
  loginAdmin: () => void;
  logoutAdmin: () => void;
  publishChanges: () => string;
}

const SiteContext = createContext<SiteContextValue | undefined>(undefined);

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [siteState, setSiteState] = useState<SiteState>(() => {
    const defaults = createDefaultSiteState();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged: SiteState = { ...defaults, ...parsed };
        if (Array.isArray(merged.categories)) {
          merged.categories = merged.categories.map((cat, idx) => {
            if (cat.slug === 'n-a') {
              const fallback = defaults.categories.find((d) => d.id === cat.id);
              return {
                ...cat,
                slug: fallback && fallback.slug !== 'n-a' ? fallback.slug : `category-${idx + 1}`,
              };
            }
            return cat;
          });
        }
        return merged;
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(siteState));
    } catch {
      // Ignore quota errors
    }
  }, [siteState]);

  const loginAdmin = () => {
    setIsAdminAuthenticated(true);
    try {
      localStorage.setItem(ADMIN_SESSION_KEY, 'true');
    } catch {
      // ignore
    }
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    try {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      // ignore
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
    setSiteState((prev) => {
      const next: SiteState = {
        ...prev,
        adminAuth: {
          ...(prev.adminAuth || DEFAULT_ADMIN_AUTH),
          lastPublishedAt: timestamp,
        },
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
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

  const updateSiteState = (updater: (prev: SiteState) => SiteState) => {
    setSiteState((prev) => updater(prev));
  };

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
        isAdminAuthenticated,
        loginAdmin,
        logoutAdmin,
        publishChanges,
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
