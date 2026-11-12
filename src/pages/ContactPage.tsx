import React, { useState } from 'react';
import { LanguageCode } from '../data/siteData';
import { useSite } from '../context/SiteContext';
import { PageHeader } from '../components/PageHeader';
import { ContactFormInput, validateContactForm } from '../utils/siteLogic';

interface ContactPageProps {
  language: LanguageCode;
  onNavigate: (path: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ language, onNavigate }) => {
  const { siteState, addContactSubmission } = useSite();
  const { company, uiTranslations } = siteState;
  const t = uiTranslations[language];

  const [form, setForm] = useState<ContactFormInput>({
    userName: '',
    userEmail: '',
    subject: '',
    mobileNo: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormInput, string>>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateContactForm(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      setSubmitSuccess(false);
      return;
    }

    setErrors({});
    addContactSubmission(form);
    setSubmitSuccess(true);
    setForm({
      userName: '',
      userEmail: '',
      subject: '',
      mobileNo: '',
      message: '',
    });
  };

  return (
    <div>
      <PageHeader
        title={t.contactUs}
        breadcrumbActive={t.contactUs}
        showPagesCrumb={true}
        language={language}
        onNavigate={onNavigate}
      />

      {/* Contact Start */}
      <section className="w-full py-12">
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="section-header text-center mx-auto mb-12 max-w-[500px]">
            <h1 className="text-[2.25rem] sm:text-[2.75rem] font-bold text-[#BE9C6A] mb-3">
              {t.contactUs}
            </h1>
            <p className="naseem-p">{t.contactSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 justify-center">
            {/* Left Contact Info Card */}
            <div className="lg:col-span-5">
              <div className="bg-[#23838B] text-white flex flex-col justify-center h-full p-8 sm:p-12">
                <h5 className="text-white text-[1.25rem] font-semibold mb-2">{t.callUs}</h5>
                <p className="mb-8 flex items-center text-white">
                  <i className="fa fa-phone-alt text-white me-3"></i>
                  <a href={`tel:${company.phone}`} className="text-white hover:underline">
                    {company.phone}
                  </a>
                </p>

                <h5 className="text-white text-[1.25rem] font-semibold mb-2">{t.emailUs}</h5>
                <p className="mb-8 flex items-center text-white">
                  <i className="fa fa-envelope text-white me-3"></i>
                  <a href={`mailto:${company.email}`} className="text-white hover:underline">
                    {company.email}
                  </a>
                </p>

                <h5 className="text-white text-[1.25rem] font-semibold mb-2">{t.officeAddress}</h5>
                <p className="mb-8 flex items-start text-white">
                  <i className="fa fa-map-marker-alt text-white me-3 mt-1"></i>
                  <span>{company.addressAr}</span>
                </p>

                <h5 className="text-white text-[1.25rem] font-semibold mb-2">{t.followUs}</h5>
                <div className="flex items-center pt-2 space-x-2 rtl:space-x-reverse">
                  <a
                    href={company.socialLinks.twitter || '#twitter'}
                    onClick={(e) => e.preventDefault()}
                    aria-label="Contact Twitter"
                    className="w-[38px] h-[38px] rounded-full border border-white flex items-center justify-center text-white hover:bg-white hover:text-[#23838B] transition-colors"
                  >
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a
                    href={company.socialLinks.facebook || '#facebook'}
                    onClick={(e) => e.preventDefault()}
                    aria-label="Contact Facebook"
                    className="w-[38px] h-[38px] rounded-full border border-white flex items-center justify-center text-white hover:bg-white hover:text-[#23838B] transition-colors"
                  >
                    <i className="fab fa-facebook-f"></i>
                  </a>
                  <a
                    href={company.socialLinks.youtube || '#youtube'}
                    onClick={(e) => e.preventDefault()}
                    aria-label="Contact YouTube"
                    className="w-[38px] h-[38px] rounded-full border border-white flex items-center justify-center text-white hover:bg-white hover:text-[#23838B] transition-colors"
                  >
                    <i className="fab fa-youtube"></i>
                  </a>
                  <a
                    href={company.socialLinks.linkedin || '#linkedin'}
                    onClick={(e) => e.preventDefault()}
                    aria-label="Contact LinkedIn"
                    className="w-[38px] h-[38px] rounded-full border border-white flex items-center justify-center text-white hover:bg-white hover:text-[#23838B] transition-colors"
                  >
                    <i className="fab fa-linkedin-in"></i>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Contact Form */}
            <div className="lg:col-span-7">
              {submitSuccess && (
                <div
                  role="status"
                  className="mb-6 p-4 rounded border border-[#23838B] bg-[#23838B]/10 text-[#23838B] font-medium"
                >
                  Thank you! Your message has been sent successfully to {company.nameEn}.
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="user_name"
                      className="block text-sm text-gray-600 mb-1 font-medium"
                    >
                      {t.yourName}
                    </label>
                    <input
                      type="text"
                      id="user_name"
                      name="user_name"
                      placeholder={t.yourName}
                      value={form.userName}
                      onChange={(e) => setForm({ ...form, userName: e.target.value })}
                      className="w-full px-4 py-3.5 border border-gray-300 rounded focus:outline-none focus:border-[#23838B]"
                    />
                    {errors.userName && (
                      <p className="text-red-600 text-xs mt-1">{errors.userName}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="user_email"
                      className="block text-sm text-gray-600 mb-1 font-medium"
                    >
                      {t.yourEmail}
                    </label>
                    <input
                      type="email"
                      id="user_email"
                      name="user_email"
                      placeholder={t.yourEmail}
                      value={form.userEmail}
                      onChange={(e) => setForm({ ...form, userEmail: e.target.value })}
                      className="w-full px-4 py-3.5 border border-gray-300 rounded focus:outline-none focus:border-[#23838B]"
                    />
                    {errors.userEmail && (
                      <p className="text-red-600 text-xs mt-1">{errors.userEmail}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="user_subject"
                    className="block text-sm text-gray-600 mb-1 font-medium"
                  >
                    {t.subject}
                  </label>
                  <input
                    type="text"
                    id="user_subject"
                    name="user_subject"
                    placeholder={t.subject}
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-3.5 border border-gray-300 rounded focus:outline-none focus:border-[#23838B]"
                  />
                  {errors.subject && <p className="text-red-600 text-xs mt-1">{errors.subject}</p>}
                </div>

                <div>
                  <label
                    htmlFor="user_phone"
                    className="block text-sm text-gray-600 mb-1 font-medium"
                  >
                    {t.mobileNo}
                  </label>
                  <input
                    type="text"
                    id="user_phone"
                    name="user_phone"
                    placeholder={t.mobileNo}
                    value={form.mobileNo}
                    onChange={(e) => setForm({ ...form, mobileNo: e.target.value })}
                    className="w-full px-4 py-3.5 border border-gray-300 rounded focus:outline-none focus:border-[#23838B]"
                  />
                  {errors.mobileNo && (
                    <p className="text-red-600 text-xs mt-1">{errors.mobileNo}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="user_message"
                    className="block text-sm text-gray-600 mb-1 font-medium"
                  >
                    {t.message}
                  </label>
                  <textarea
                    id="user_message"
                    name="user_message"
                    placeholder="Leave a message here"
                    rows={6}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3.5 border border-gray-300 rounded focus:outline-none focus:border-[#23838B]"
                  ></textarea>
                  {errors.message && <p className="text-red-600 text-xs mt-1">{errors.message}</p>}
                </div>

                <div>
                  <button
                    type="submit"
                    className="bg-[#23838B] hover:bg-[#1b6970] text-white font-medium rounded-full py-3.5 px-10 transition-colors cursor-pointer"
                  >
                    {t.sendMessage}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Google Map Start */}
      {company.mapEmbedUrl && (
        <div className="w-full px-0 -mb-1.5">
          <iframe
            title="Naseem Al-Ataa Location Map"
            className="w-full h-[450px] border-0"
            src={company.mapEmbedUrl}
            allowFullScreen
            loading="lazy"
          ></iframe>
        </div>
      )}
    </div>
  );
};
