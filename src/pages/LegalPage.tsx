import React from 'react';
import { LanguageCode } from '../data/siteData';
import { useSite } from '../context/SiteContext';
import { PageHeader } from '../components/PageHeader';

interface LegalPageProps {
  mode: 'privacy-policy' | 'terms-and-conditions';
  language: LanguageCode;
  onNavigate: (path: string) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ mode, language, onNavigate }) => {
  const { siteState } = useSite();
  const t = siteState.uiTranslations[language];
  const isPrivacy = mode === 'privacy-policy';
  const title = isPrivacy ? t.privacyPolicy : t.termsAndConditions;
  const content = isPrivacy ? siteState.privacyPolicy : siteState.termsAndConditions;

  return (
    <div>
      <PageHeader
        title={title}
        breadcrumbActive={title}
        language={language}
        onNavigate={onNavigate}
      />

      <section
        style={{ backgroundColor: siteState.theme.lightBgColor || '#F7F8FC' }}
        className="w-full bg-icon py-24"
      >
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="section-header text-center mx-auto mb-12 max-w-[500px]">
            <h1 className="text-[2.25rem] sm:text-[2.75rem] font-bold text-[#BE9C6A] mb-3">
              {title}
            </h1>
          </div>

          <div className="bg-white text-start h-full p-6 xl:p-12 shadow-[0_0_45px_rgba(0,0,0,0.03)] space-y-5 leading-relaxed">
            <p className="naseem-p">{content.intro}</p>

            {content.sections.map((sec) => (
              <div key={sec.id} className="space-y-3 pt-2">
                <h2 className="text-[1.75rem] font-semibold text-[#BE9C6A]">{sec.heading}</h2>
                {sec.paragraphs.map((p, idx) => (
                  <p key={idx} className="naseem-p">
                    {p}
                  </p>
                ))}
                {sec.bullets && sec.bullets.length > 0 && (
                  <ul className="list-disc list-inside naseem-p space-y-1">
                    {sec.bullets.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
