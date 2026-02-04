import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useThumbnailCache, useThumbnail } from '../../hooks/useThumbnailCache';
import { MapPin, Star, User } from 'lucide-react';
import type { Tailor } from '../../../types';
import type { DemoShellOutletContext } from './DemoShellLayout';
import { useMobileDetection } from '../../modules/designer/mobile';
import { DemoShellTopTailorsMobile } from './DemoShellTopTailors.Mobile';
import { DemoShellTopTailorsDesktop } from './DemoShellTopTailors.Desktop';

export type RegionWithTailors = {
  regionId: string;
  regionName: string;
  tailors: Tailor[];
};

export const TailorPill = React.memo(function TailorPill({ 
  tailor, 
  regionName, 
  isNew 
}: { 
  tailor: Tailor; 
  regionName: string; 
  isNew?: boolean;
}) {
  const displaySrc = useThumbnail(tailor.image || null, { maxEntries: 100 });

  return (
    <div className="flex w-[180px] sm:w-[200px] flex-col gap-2 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-3 transition hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700">
      <div className="relative">
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={tailor.name}
            className="h-[120px] w-full rounded-xl object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-[120px] w-full items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/20">
            <User className="h-10 w-10 text-purple-600 dark:text-purple-400" />
          </div>
        )}
        {isNew && (
          <span className="absolute top-2 left-2 rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white">
            جديد
          </span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-normal text-slate-900 dark:text-white truncate">
          {tailor.name}
        </h3>
        
        {tailor.specialization && (
          <p className="mt-0.5 text-[11px] text-purple-600 dark:text-purple-400 font-medium truncate">
            {tailor.specialization === 'males' ? 'تفصيل رجالي' : tailor.specialization === 'females' ? 'تفصيل نسائي' : tailor.specialization}
          </p>
        )}
        
        <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-normal">
            <Star className="h-2.5 w-2.5" style={{ color: '#469788' }} />
            {tailor.rating?.toFixed(1) || '—'}
          </span>
          <span className="flex items-center gap-1 truncate">
            <MapPin className="h-2.5 w-2.5 shrink-0 text-slate-500" />
            <span className="truncate">{regionName}</span>
          </span>
        </div>
      </div>
    </div>
  );
});

export const TailorCard = React.memo(function TailorCard({ tailor }: { tailor: Tailor }) {
  const previewSrc = tailor.image || null;
  const displaySrc = useThumbnail(previewSrc, { maxEntries: 100 });

  return (
    <article className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm dark:shadow-none transition hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex items-start gap-3">
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={tailor.name}
            className="h-14 w-14 rounded-xl object-cover transition duration-300 group-hover:scale-105 group-hover:shadow-md"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/20">
            <User className="h-7 w-7 text-purple-600 dark:text-purple-400" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-normal text-slate-900 dark:text-white truncate">{tailor.name}</h3>
          </div>
          
          {tailor.specialization && (
            <p className="mt-1 text-xs text-purple-600 dark:text-purple-400 font-medium">
              {tailor.specialization === 'males' ? 'تفصيل رجالي' : tailor.specialization === 'females' ? 'تفصيل نسائي' : tailor.specialization}
            </p>
          )}
          
          {tailor.bio && (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
              {tailor.bio}
            </p>
          )}

          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 font-normal">
              <Star className="h-3 w-3" style={{ color: '#469788' }} />
              {tailor.rating?.toFixed(1) || '—'}
            </span>
            {tailor.location && (
              <span className="flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 font-normal">
                <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                <span className="truncate">{tailor.location}</span>
              </span>
            )}
          </div>
          
          <dl className="mt-3 grid gap-2 text-xs text-slate-500 dark:text-slate-400">
            {tailor.experience && (
              <div className="flex items-center justify-between gap-2">
                <dt className="font-semibold text-slate-700 dark:text-slate-200">الخبرة</dt>
                <dd>{tailor.experience}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </article>
  );
});

export function RegionSection({ regionId, regionName, tailors }: RegionWithTailors) {
  if (tailors.length === 0) {
    return null;
  }

  const avgRating = tailors.reduce((sum, t) => sum + (t.rating || 0), 0) / tailors.length;
  const totalExperienceYears = tailors
    .map((t) => parseInt(t.experience || '0'))
    .reduce((sum, y) => sum + (isNaN(y) ? 0 : y), 0);
  const avgExperience = Math.round(totalExperienceYears / tailors.length);

  return (
    <section className="space-y-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 p-5">
      <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{regionName}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {tailors.length} {tailors.length === 1 ? 'خياط' : 'خياطين'} معتمدين
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
          <span className="rounded-full bg-white/80 dark:bg-slate-900 px-3 py-1 font-semibold">
            تقييم: {avgRating.toFixed(1)}/5
          </span>
          {avgExperience > 0 && (
            <span className="rounded-full bg-white/80 dark:bg-slate-900 px-3 py-1 font-semibold">
              خبرة: {avgExperience} {avgExperience === 1 ? 'سنة' : 'سنوات'}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tailors.map((tailor) => (
          <TailorCard key={tailor.id} tailor={tailor} />
        ))}
      </div>
    </section>
  );
}

export const tailorsByRegion = [
  {
    region: 'مسقط، سلطنة عُمان',
    description:
      'تُعرف المسقط بكثرة الورش العائلية التي توازن بين الحرفية القديمة والقصات العصرية. هذه الشبكة تؤدي طلبات العرس والزي الرسمي للوزارات.',
    stats: { turnaround: '48 ساعة', experience: '25 سنة', specialties: 'بشت، دشداشة، عباءات رجالية' },
    tailors: [
      {
        name: 'بيت خياط دار السلطان',
        address: 'الرمس، بالقرب من جامع السلطان قابوس',
        specialty: 'تفصيل بشتات مراسم رسمية وخياطة دشداشة حسب القياسات المجهزة للفريق الرسمي',
        rating: '4.9/5',
      },
      {
        name: 'ورشة عبّر للأزياء الرجالية',
        address: 'شارع الجامع، عبري',
        specialty: 'تحضير دشداشة متعددة الطبقات وأقمشة مغناطيسية مقاومة للتجاعيد',
        rating: '4.8/5',
      },
    ],
  },
  {
    region: 'دبي، الإمارات العربية المتحدة',
    description:
      'الصناعة في دبي تدمج الخياطة الفاخرة مع شرائط التطريز اليدوي للعلامات التجارية الخليجية، خاصة في أحياء المارينا والقصيص.',
    stats: { turnaround: '36 ساعة', experience: '18 سنة', specialties: 'أقمشة استيراد، تطريز يدوي، أجمل الليالير' },
    tailors: [
      {
        name: 'أتيليه الخلود',
        address: 'القصيص 2، دبي',
        specialty: 'توليف بين الأقمشة الإيطالية والتطريز العثماني لتصاميم العرس والزي الرسمي',
        rating: '5.0/5',
      },
      {
        name: 'دار الصفوة للخياطة العصرية',
        address: 'مركز دبي المالي العالمي، الطابق 12',
        specialty: 'إعداد بدلات رجال الأعمال مع تقنيات الضغط الحراري المريحة',
        rating: '4.7/5',
      },
    ],
  },
  {
    region: 'الرياض، المملكة العربية السعودية',
    description:
      'الرياض تملك أرقى الرسامين والمهندسين الخياطة التي تتعامل مع كبار الشخصيات، وتقدم خدمات قياس وجولات في المتجر.',
    stats: { turnaround: '72 ساعة', experience: '30 سنة', specialties: 'درز خشب، رقع يدوية، بدلات المديرين' },
    tailors: [
      {
        name: 'الخياط الذهبي',
        address: 'حي الصحافة، شارع العليا',
        specialty: 'بدلات مصممة خصيصًا للوزارات والمناسبات الرسمية بلمسات ذهبية',
        rating: '4.95/5',
      },
      {
        name: 'ورشة اليمامة للتفصيل الراقي',
        address: 'الرياض بارك، مخرج 12',
        specialty: 'خياطة عباءات رجالية ونماذج قصات مستقبلية مع تجارب درامية للمنتجات',
        rating: '4.85/5',
      },
    ],
  },
  {
    region: 'الكويت، الكويت',
    description:
      'مناطق الدسمة والسالمية تضم مطابع وصانعي خياطة قريبين من كبار العائلات، ويعتمدون على الأقمشة الفرنسية.',
    stats: { turnaround: '40 ساعة', experience: '20 سنة', specialties: 'دشداشة مطرزة، زي رجال شركات', },
    tailors: [
      {
        name: 'مركز الفرادة للخياطة التقليدية',
        address: 'المنقف، طريق السورة',
        specialty: 'خدمة يومية للقياسات واستلام الدشداشة بعد 24 ساعة',
        rating: '4.8/5',
      },
      {
        name: 'أتليه دوار السيف',
        address: 'السالمية، شارع أحمد الجابر',
        specialty: 'تصاميم بخطوط هندسية ودرزات نظيفة مع تنجيد داخلي',
        rating: '4.7/5',
      },
    ],
  },
  {
    region: 'المنامة، البحرين',
    description:
      'تُعرف المنامة بأعمال الخياطة ذات الطابع الكلاسيكي وحرفيين يحافظون على أسرار العائلة مع خدمة استشارية كاملة.',
    stats: { turnaround: '50 ساعة', experience: '27 سنة', specialties: 'زي عربي مبتكر، بدل زفاف' },
    tailors: [
      {
        name: 'atelier البحرين',
        address: 'فندق الريتز كارلتون، الجفير',
        specialty: 'توفير خياطة مطابقة للمقاسات العالمية مع أقمشة من ميلانو',
        rating: '5.0/5',
      },
      {
        name: 'دار الزهراء للخياطة',
        address: 'المنامة القديمة، شارع سوق الذهب',
        specialty: 'التفصيل العائلي مع درزات فنية خاصة بالعرائس والضيوف',
        rating: '4.6/5',
      },
    ],
  },
];

export function DemoShellTopTailors() {
  const isMobile = useMobileDetection();
  
  if (isMobile) {
    return <DemoShellTopTailorsMobile />;
  }
  
  return <DemoShellTopTailorsDesktop />;
}
