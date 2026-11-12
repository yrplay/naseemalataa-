import React, { useState } from 'react';
import { LanguageCode, ProductItem } from '../data/siteData';
import { useSite } from '../context/SiteContext';

interface ProductDetailModalProps {
  product: ProductItem | null;
  language: LanguageCode;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  language,
  onClose,
}) => {
  const { siteState, addContactSubmission } = useSite();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [quantityNote, setQuantityNote] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  if (!product) return null;

  const isAr = language === 'ar';
  const displayTitle = isAr ? product.titleAr : product.title;
  const displayDesc = isAr
    ? product.descriptionAr ||
      product.description ||
      'منتج عالي الجودة متوفر للتوريد بالجملة والمشاريع الموسمية والسنوية وفق أعلى معايير السلامة الغذائية.'
    : product.description ||
      product.descriptionAr ||
      'Premium-quality product available for wholesale distribution, catering, and seasonal or annual supply projects.';

  const linkedCategories = siteState.categories.filter((c) =>
    product.categorySlugs.includes(c.slug)
  );

  const handleRequestQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setError(
        isAr
          ? 'يرجى إدخال الاسم ورقم الجوال للتواصل.'
          : 'Please enter your name and mobile number.'
      );
      return;
    }

    setError('');
    addContactSubmission({
      userName: customerName.trim(),
      userEmail: customerEmail.trim() || 'quote@naseemalata.sa',
      mobileNo: customerPhone.trim(),
      subject: `طلب عرض سعر منتج: ${product.titleAr} (${product.title})`,
      message: `المنتج المطلوب: ${product.titleAr} (${product.title})\n${
        product.price ? `السعر المعروض: ${product.price}\n` : ''
      }الكمية / الملاحظات: ${quantityNote.trim() || 'غير محدد'}`,
    });
    setSent(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={displayTitle}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#F7F8FC]">
          <h3 className="text-xl font-bold text-[#BE9C6A]">{displayTitle}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-white border border-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center cursor-pointer"
          >
            <i className="fa fa-times"></i>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5 bg-[#F7F8FC] rounded overflow-hidden border border-slate-200">
              <img
                src={product.image}
                alt={displayTitle}
                referrerPolicy="no-referrer"
                className="w-full h-52 object-cover"
              />
            </div>

            <div className="md:col-span-7 space-y-3 text-start">
              <h4 className="text-2xl font-bold text-[#BE9C6A]">{displayTitle}</h4>
              {product.price && (
                <div className="text-lg font-bold text-[#23838B] tabular-nums">
                  {product.price}
                </div>
              )}
              <p className="naseem-p text-sm leading-relaxed">{displayDesc}</p>

              {linkedCategories.length > 0 && (
                <div className="pt-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {isAr ? 'الأقسام:' : 'Categories:'}{' '}
                  </span>
                  {linkedCategories
                    .map((c) => (isAr ? c.titleAr : c.title))
                    .join(' · ')}
                </div>
              )}
            </div>
          </div>

          {/* Direct Wholesale Quote Inquiry Form */}
          <div className="border-t border-slate-200 pt-5">
            <h5 className="text-base font-bold text-[#23838B] mb-3">
              {isAr
                ? 'طلب تسعيرة أو توريد لهذا المنتج'
                : 'Request Wholesale Quote for This Product'}
            </h5>

            {sent ? (
              <div
                role="status"
                className="p-4 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium"
              >
                {isAr
                  ? 'تم إرسال طلب التسعيرة بنجاح إلى إدارة شركة نسيم العطاء التجارية، وسنتواصل معك قريباً.'
                  : 'Your wholesale quote request has been sent successfully! Our team will contact you shortly.'}
              </div>
            ) : (
              <form onSubmit={handleRequestQuote} className="space-y-3">
                {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder={isAr ? 'الاسم الكامل / الجهة *' : 'Your Name / Organization *'}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#23838B]"
                  />
                  <input
                    type="text"
                    placeholder={isAr ? 'رقم الجوال *' : 'Mobile No. *'}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#23838B]"
                  />
                  <input
                    type="email"
                    placeholder={isAr ? 'البريد الإلكتروني (اختياري)' : 'Email (Optional)'}
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#23838B]"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder={
                    isAr
                      ? 'الكمية المطلوبة أو تفاصيل التوريد...'
                      : 'Requested quantity or delivery details...'
                  }
                  value={quantityNote}
                  onChange={(e) => setQuantityNote(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#23838B]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium bg-slate-100 text-slate-700 rounded hover:bg-slate-200 cursor-pointer"
                  >
                    {isAr ? 'إغلاق' : 'Close'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold bg-[#23838B] hover:bg-[#1b6970] text-white rounded-full cursor-pointer"
                  >
                    {isAr ? 'إرسال طلب عرض السعر' : 'Send Quote Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
