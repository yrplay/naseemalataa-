import React from 'react';
import { LanguageCode } from '../data/siteData';
import { useSite } from '../context/SiteContext';

interface PageHeaderProps {
  title: string;
  breadcrumbActive: string;
  showPagesCrumb?: boolean;
  language: LanguageCode;
  onNavigate: (path: string) => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  breadcrumbActive,
  showPagesCrumb = false,
  language,
  onNavigate,
}) => {
  const { siteState } = useSite();
  const t = siteState.uiTranslations[language];

  return (
    <div className="w-full page-header">
      <div className="max-w-[1320px] mx-auto px-6">
        <h1 className="text-[2.5rem] sm:text-[3.5rem] lg:text-[4rem] font-bold text-[#BE9C6A] mb-4">
          {title}
        </h1>
        <nav aria-label="breadcrumb">
          <ol className="flex flex-wrap items-center space-x-2 rtl:space-x-reverse text-base mb-0">
            <li>
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/');
                }}
                className="text-[#555555] hover:text-[#23838B] transition-colors"
              >
                {t.home}
              </a>
            </li>
            {showPagesCrumb && (
              <>
                <li className="text-[#999999] px-1">/</li>
                <li>
                  <span className="text-[#555555]">{t.pages}</span>
                </li>
              </>
            )}
            <li className="text-[#999999] px-1">/</li>
            <li className="text-[#111111] font-medium" aria-current="page">
              {breadcrumbActive}
            </li>
          </ol>
        </nav>
      </div>
    </div>
  );
};
