import React from 'react';
import { LanguageCode } from '../data/siteData';
import { useSite } from '../context/SiteContext';
import { PageHeader } from '../components/PageHeader';

interface AboutPageProps {
  language: LanguageCode;
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ language, onNavigate }) => {
  const { siteState } = useSite();
  const t = siteState.uiTranslations[language];
  const about = siteState.aboutPage;

  return (
    <div>
      <PageHeader
        title={t.aboutUs}
        breadcrumbActive={t.aboutUs}
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
              {t.aboutUs}
            </h1>
          </div>

          <div className="bg-white text-start h-full p-6 xl:p-12 shadow-[0_0_45px_rgba(0,0,0,0.03)] space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-[24px] font-bold text-[#BE9C6A]">
                {about.companyBannerTitle}
              </h1>
              <p className="text-[20px] text-[#BE9C6A] font-medium">
                {about.companyBannerSubtitle}
              </p>
            </div>

            <div className="text-center text-[20px] naseem-p leading-relaxed space-y-2">
              <p className="font-semibold">{about.whoWeAreHeading}</p>
              {about.whoWeAreParagraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            <div className="space-y-4 pt-4">
              <h2 className="text-[1.75rem] font-semibold text-[#BE9C6A]">
                {about.visionHeading}
              </h2>
              <p className="naseem-p">{about.visionText}</p>

              <h2 className="text-[1.75rem] font-semibold text-[#BE9C6A]">
                {about.missionHeading}
              </h2>
              <p className="naseem-p">{about.missionText}</p>

              <h2 className="text-[1.5rem] font-semibold text-[#BE9C6A]">
                {about.valuesHeading}
              </h2>
              <div className="naseem-p space-y-1">
                <p>{about.valuesIntro}</p>
                <ul className="list-disc list-inside pt-2 space-y-1">
                  {about.valuesList.map((val, idx) => (
                    <li key={idx}>{val}</li>
                  ))}
                </ul>
              </div>

              <h2 className="text-[1.75rem] font-semibold text-[#BE9C6A]">
                {about.objectivesHeading}
              </h2>
              <div className="naseem-p space-y-1.5 leading-relaxed">
                <p>{about.objectivesIntro}</p>
                {about.objectivesList.map((obj, idx) => (
                  <p key={idx}>{obj}</p>
                ))}
              </div>

              <h2 className="text-[1.75rem] font-semibold text-[#BE9C6A] pt-4">
                {about.areasHeading}
              </h2>
              <div className="naseem-p space-y-2 leading-relaxed">
                <p>{about.areasIntro}</p>
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-start border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-[#BE9C6A]">
                        <th className="py-2 pe-4">No.</th>
                        <th className="py-2 pe-4">Area</th>
                        <th className="py-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 naseem-p">
                      {about.areasTable.map((row) => (
                        <tr key={row.id}>
                          <td className="py-2.5 pe-4 font-semibold tabular-nums">{row.no}</td>
                          <td className="py-2.5 pe-4 font-medium">
                            {language === 'ar' ? row.areaAr || row.area : row.area}
                          </td>
                          <td className="py-2.5">
                            {language === 'ar'
                              ? row.descriptionAr || row.description
                              : row.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <h2 className="text-[1.75rem] font-semibold text-[#BE9C6A] pt-4">
                {about.servicesHeading}
              </h2>
              <div className="naseem-p space-y-3 leading-relaxed">
                <p>{about.servicesIntro}</p>
                {about.serviceGroups.map((group) => (
                  <div key={group.id} className="space-y-1 pt-2">
                    <p className="font-bold text-[18px]">
                      {language === 'ar' ? group.headingAr || group.heading : group.heading}
                    </p>
                    {(language === 'ar' && group.itemsAr.length > 0
                      ? group.itemsAr
                      : group.items
                    ).map((item, idx) => (
                      <p key={idx}>{item}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
