import React, { useRef, useState } from 'react';

interface ImageInputFieldProps {
  label: string;
  value: string;
  onChange: (newUrl: string) => void;
  id?: string;
}

const BUILTIN_ASSETS = [
  { label: 'شعار الشركة (Logo)', url: '/admin_css/logo.png' },
  { label: 'شعار البروفايل (Profile)', url: '/uploads/naseem-profile-logo.jpeg' },
  { label: 'سلايدر 1 (Carousel 1)', url: '/front_css/img/carousel-1.jpg' },
  { label: 'سلايدر 2 (Carousel 2)', url: '/front_css/img/carousel-2.jpg' },
  { label: 'صورة من نحن (About)', url: '/front_css/img/about.jpg' },
  { label: 'منتج طماطم (Product 1)', url: '/uploads/1782929518_product-1.jpg' },
  { label: 'أيقونة توابل (Spices)', url: '/uploads/1782760009_spice.png' },
  { label: 'أيقونة بقوليات (Pulses)', url: '/uploads/1782760001_heart.png' },
  { label: 'أيقونة زيوت (Oils)', url: '/uploads/1782759991_olive-oil.png' },
  { label: 'أيقونة سوبرماركت', url: '/uploads/1782762418_supermarket.png' },
  { label: 'أيقونة مطاعم', url: '/uploads/1782762411_restaurant.png' },
  { label: 'أيقونة فنادق', url: '/uploads/1782762403_5-stars.png' },
  { label: 'أيقونة تموين', url: '/uploads/1782762397_catering.png' },
];

export const ImageInputField: React.FC<ImageInputFieldProps> = ({
  label,
  value,
  onChange,
  id,
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const rawDataUrl = reader.result;
      // Compress large images using an offscreen canvas so localStorage never hits QuotaExceededError
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 900;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            const compressed = canvas.toDataURL(mime, 0.82);
            onChange(compressed.length < rawDataUrl.length ? compressed : rawDataUrl);
            return;
          }
        } catch {
          // fallback to rawDataUrl
        }
        onChange(rawDataUrl);
      };
      img.onerror = () => {
        onChange(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
        {label}
      </label>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="w-14 h-14 rounded border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
          {value ? (
            <img
              src={value}
              alt={label}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          ) : (
            <i className="fa fa-image text-slate-400"></i>
          )}
        </div>

        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="رابط الصورة أو المسار..."
          dir="ltr"
          className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#23838B]"
        />

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-300 transition-colors whitespace-nowrap cursor-pointer"
        >
          <i className="fa fa-upload me-1.5"></i>
          رفع من الجهاز
        </button>

        <button
          type="button"
          onClick={() => setShowLibrary(!showLibrary)}
          className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-300 transition-colors whitespace-nowrap cursor-pointer"
        >
          <i className="fa fa-folder-open me-1.5"></i>
          مكتبة الموقع
        </button>
      </div>

      {showLibrary && (
        <div className="p-3 bg-slate-50 rounded border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BUILTIN_ASSETS.map((asset) => (
            <button
              key={asset.url}
              type="button"
              onClick={() => {
                onChange(asset.url);
                setShowLibrary(false);
              }}
              className="flex items-center gap-2 p-1.5 bg-white hover:border-[#23838B] border border-slate-200 rounded text-start text-xs transition-colors cursor-pointer"
            >
              <img
                src={asset.url}
                alt={asset.label}
                referrerPolicy="no-referrer"
                className="w-8 h-8 object-contain shrink-0"
              />
              <span className="truncate text-slate-700">{asset.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
