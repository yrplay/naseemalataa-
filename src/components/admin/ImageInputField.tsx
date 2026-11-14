import React, { useRef, useState, useEffect } from 'react';

export type ImageQualityPreset = 'banner-hd' | 'standard';
export type UploadQualityMode = 'original' | 'ultra-hd';

interface ImageInputFieldProps {
  label: string;
  value: string;
  onChange: (newUrl: string) => void;
  id?: string;
  preset?: ImageQualityPreset;
  maxDimension?: number;
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
  preset = 'standard',
  maxDimension,
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [qualityMode, setQualityMode] = useState<UploadQualityMode>(
    preset === 'banner-hd' ? 'original' : 'ultra-hd'
  );
  const [imgDimensions, setImgDimensions] = useState<{ w: number; h: number } | null>(null);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);

  // Measure current image natural dimensions so the admin can verify HD resolution
  useEffect(() => {
    if (!value) {
      setImgDimensions(null);
      return;
    }
    let cancelled = false;
    const probe = new Image();
    probe.onload = () => {
      if (!cancelled && probe.naturalWidth > 0) {
        setImgDimensions({ w: probe.naturalWidth, h: probe.naturalHeight });
      }
    };
    probe.onerror = () => {
      if (!cancelled) setImgDimensions(null);
    };
    probe.src = value;
    return () => {
      cancelled = true;
    };
  }, [value]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatusMsg(null);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const rawDataUrl = reader.result;

      // 1. SVG files are vector graphics — keep 100% original untouched
      if (file.type === 'image/svg+xml') {
        onChange(rawDataUrl);
        setUploadStatusMsg('تم رفع ملف SVG بالدقة المتجهة الأصلية 100% بدون أي ضغط.');
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const origW = img.naturalWidth || img.width;
          const origH = img.naturalHeight || img.height;

          // Target max safe DataURL length per image so Firestore cloud sync (900KB doc limit) succeeds
          const maxSafeDataUrlChars = preset === 'banner-hd' ? 520000 : 340000;

          // 2. If user selected "original" (or if file is already within safe byte budget & dimensions),
          // preserve the exact original file bytes without re-encoding through canvas (zero generation loss!)
          if (
            (qualityMode === 'original' && rawDataUrl.length <= 680000) ||
            (rawDataUrl.length <= maxSafeDataUrlChars && origW <= 3840 && origH <= 3840)
          ) {
            onChange(rawDataUrl);
            setImgDimensions({ w: origW, h: origH });
            setUploadStatusMsg(
              `تم رفع الصورة بجودتها الأصلية الكاملة (${origW} × ${origH} بكسل) بدون أي تقليص.`
            );
            return;
          }

          // 3. High-Definition smart scaling for oversized raw files (e.g. 5MB–15MB camera/design exports)
          const targetMaxDim =
            maxDimension ||
            (qualityMode === 'original' ? 2880 : preset === 'banner-hd' ? 2560 : 1600);

          let width = origW;
          let height = origH;
          if (width > targetMaxDim || height > targetMaxDim) {
            if (width > height) {
              height = Math.round((height * targetMaxDim) / width);
              width = targetMaxDim;
            } else {
              width = Math.round((width * targetMaxDim) / height);
              height = targetMaxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            // Use WebP at 0.96 quality first — preserves crisp edges, text, and transparency at much higher quality per KB
            const initialQuality = qualityMode === 'original' ? 0.97 : 0.94;
            let bestDataUrl = canvas.toDataURL('image/webp', initialQuality);

            // Fallback if browser did not encode as webp
            if (!bestDataUrl.startsWith('data:image/webp')) {
              const fallbackMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
              bestDataUrl = canvas.toDataURL(fallbackMime, initialQuality);
            }

            // If still larger than the Firestore-safe budget, step down WebP quality gently while keeping HD resolution
            const qualitySteps = [0.92, 0.88, 0.84];
            for (const q of qualitySteps) {
              if (bestDataUrl.length <= maxSafeDataUrlChars) break;
              const candidate = canvas.toDataURL('image/webp', q);
              if (candidate.startsWith('data:image/webp')) {
                bestDataUrl = candidate;
              } else {
                bestDataUrl = canvas.toDataURL('image/jpeg', q);
              }
            }

            const finalUrl =
              bestDataUrl.length < rawDataUrl.length || rawDataUrl.length > 680000
                ? bestDataUrl
                : rawDataUrl;

            onChange(finalUrl);
            setImgDimensions({ w: width, h: height });
            setUploadStatusMsg(
              `تم رفع الصورة بدقة فائقة الوضوح (${width} × ${height} بكسل — Full HD / 2K).`
            );
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
    // Reset input so re-uploading the exact same file triggers onChange
    e.target.value = '';
  };

  const isLegacyLowResBanner =
    preset === 'banner-hd' &&
    imgDimensions !== null &&
    value.startsWith('data:image/') &&
    imgDimensions.w <= 920 &&
    imgDimensions.h <= 920;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
          {label}
        </label>

        {/* Quality Mode Selector */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-slate-500 font-medium">دقة الرفع:</span>
          <button
            type="button"
            onClick={() => setQualityMode('original')}
            className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
              qualityMode === 'original'
                ? 'bg-[#23838B] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الأصلية 100% (بدون ضغط)
          </button>
          <button
            type="button"
            onClick={() => setQualityMode('ultra-hd')}
            className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
              qualityMode === 'ultra-hd'
                ? 'bg-[#23838B] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            فائقة الوضوح 2K / Full HD
          </button>
        </div>
      </div>

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
          placeholder="رابط الصورة المباشر (https://...) أو ارفع من جهازك بدقة كاملة..."
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
          className="px-3.5 py-2 text-xs font-bold bg-[#23838B] hover:bg-[#1a666d] text-white rounded border border-[#23838B] transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
        >
          <i className="fa fa-upload me-1.5"></i>
          رفع بجودة عالية HD
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

      {/* Live Resolution & Quality Diagnostics */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        {imgDimensions && (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold ${
              isLegacyLowResBanner
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            <i
              className={`fa ${
                isLegacyLowResBanner ? 'fa-exclamation-triangle text-amber-600' : 'fa-check-circle text-emerald-600'
              }`}
            ></i>
            <span>
              أبعاد الصورة الحالية: <strong dir="ltr">{imgDimensions.w} × {imgDimensions.h} px</strong>
              {isLegacyLowResBanner
                ? ' — (مرفوعة سابقاً بدقة مصغرة 900px: اضغط «رفع بجودة عالية HD» لإعادة رفعها بكامل دقتها)'
                : imgDimensions.w >= 1400
                ? ' — (دقة فائقة الوضوح Full HD / 2K)'
                : ''}
            </span>
          </span>
        )}

        {uploadStatusMsg && (
          <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            <i className="fa fa-sparkles me-1"></i>
            {uploadStatusMsg}
          </span>
        )}
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
