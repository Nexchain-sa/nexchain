import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  Factory, Banknote, ShieldCheck, BarChart3, Repeat, Gauge, ArrowLeft, Globe, CheckCircle2, ChevronDown,
} from 'lucide-react';

const FAQ = [
  ['ما هي منصة FLOWRIZ؟', 'منصة سعودية تربط المشترين والموردين والمصانع والممولين في منظومة واحدة، من طلب الشراء والتصنيع حتى التمويل والتسوية، مع ضمان للدفعات وتقييم للمخاطر.'],
  ['هل التسجيل والاستخدام مجاني؟', 'نعم، إنشاء الحساب والبدء مجاني. تُراجَع مستنداتك وتُعتمد من إدارة المنصة قبل التفعيل.'],
  ['كيف يعمل ضمان الدفعات؟', 'تُحجَز المدفوعات في الضمان وتُفرَج عنها مرحلةً بمرحلة بعد اجتياز الجودة والاستلام السليم — مبدأ «لا جودة، لا دفع».'],
  ['ما المستندات المطلوبة للتسجيل؟', 'السجل التجاري، عقد التأسيس، هوية الملّاك، آخر قوائم مالية معتمدة، الملف التعريفي، شهادة ضريبة القيمة المضافة، شهادة الزكاة، وكشف الحساب البنكي.'],
  ['كيف أحصل على تمويل؟', 'قدّم طلب تمويل على فاتورتك أو أمر تصنيعك، فيتنافس الممولون والمنصة عليه، أو يموّله مستثمر آليًّا وفق معاييره، ثم تسدّد أقساطًا.'],
  ['هل يوجد خيار متوافق مع الشريعة؟', 'نعم، تدعم المنصة وضع تمويل متوافق مع الشريعة إلى جانب الوضع التقليدي.'],
];

const FEATURES = [
  { icon: Factory, color: '#4F46E5', title: 'سوق تصنيع تنافسي', desc: 'انشر طلب تصنيع، تتنافس المصانع بعروضها، واختر الأنسب سعرًا ومهلةً وتقييمًا.' },
  { icon: Banknote, color: '#059669', title: 'تمويل مرن', desc: 'تمويل تنافسي من المستثمرين والمنصة، مع استثمار تلقائي وفق معايير محدّدة.' },
  { icon: ShieldCheck, color: '#7C3AED', title: 'ضمان الدفعات', desc: 'حجز المدفوعات في الضمان والإفراج عنها مرحلةً بمرحلة — لا جودة، لا دفع.' },
  { icon: Gauge, color: '#D97706', title: 'تقييم مخاطر ذكي', desc: 'درجات ائتمانية A–D تُحسب آليًّا لتوجيه قرارات التمويل بثقة.' },
  { icon: Repeat, color: '#0D9488', title: 'سوق ثانوي', desc: 'بِع واشترِ مراكز التمويل بسهولة لسيولة أعلى للمستثمرين.' },
  { icon: BarChart3, color: '#BE123C', title: 'تحليلات وتقارير', desc: 'لوحات أداء حيّة وتصدير CSV/PDF لقرارات مبنية على البيانات.' },
];

const STEPS = [
  { n: '1', title: 'سجّل واعتمد', desc: 'أنشئ حسابك وارفع مستنداتك، وتُعتمد من إدارة المنصة.' },
  { n: '2', title: 'اطلب أو موّل', desc: 'انشر طلباتك أو موّل الفرص، وتتبّع كل مرحلة بشفافية.' },
  { n: '3', title: 'أنجز بضمان', desc: 'استلم بجودة مضمونة وسوِّ مدفوعاتك عبر الضمان.' },
];

export default function Landing() {
  const { user } = useAuth();
  const { t, dir, lang, toggle } = useLang();
  const { fmt } = useCurrency();
  const [openFaq, setOpenFaq] = useState(null);
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen font-arabic" dir={dir} style={{ background: '#F8FAFC' }}>
      {/* Nav */}
      <header className="flex items-center justify-between px-6 lg:px-12 h-16" style={{ background: '#1E1B4B' }}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg" style={{ background: '#4F46E5', color: '#fff' }}>⬡</div>
          <span className="font-bold text-xl tracking-widest text-white">FLOWRIZ</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/about" className="hidden sm:block px-3 py-1.5 rounded-lg text-sm font-bold text-slate-200 hover:bg-white/10">{t('من نحن')}</Link>
          <button onClick={toggle} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-bold text-slate-200 hover:bg-white/10">
            <Globe size={15} />{lang === 'ar' ? 'EN' : 'ع'}
          </button>
          <Link to="/login" className="px-4 py-1.5 rounded-lg text-sm font-bold text-white hover:bg-white/10">{t('تسجيل الدخول')}</Link>
          <Link to="/register" className="px-4 py-1.5 rounded-lg text-sm font-bold text-white" style={{ background: '#4F46E5' }}>{t('إنشاء حساب')}</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 lg:px-12 py-16 lg:py-24 text-center max-w-4xl mx-auto">
        <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-5" style={{ background: '#EEF2FF', color: '#4F46E5' }}>{t('منصة سلاسل الإمداد الذكية')}</span>
        <h1 className="text-3xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-5">
          {t('من الطلب إلى التصنيع إلى التمويل')}<br />
          <span style={{ color: '#4F46E5' }}>{t('في منصة واحدة متكاملة')}</span>
        </h1>
        <p className="text-base lg:text-lg text-slate-500 leading-relaxed mb-8 max-w-2xl mx-auto">
          {t('نربط المشترين والموردين والمصانع والممولين في منظومة واحدة، مع ضمان للدفعات وتقييم للمخاطر وتحليلات احترافية.')}
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link to="/register" className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm hover:opacity-90" style={{ background: '#4F46E5' }}>
            {t('ابدأ الآن مجانًا')} <ArrowLeft size={16} />
          </Link>
          <Link to="/login" className="px-6 py-3 rounded-xl font-bold text-sm border" style={{ borderColor: '#E5E7EF', color: '#4F46E5' }}>{t('تسجيل الدخول')}</Link>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 lg:px-12 max-w-5xl mx-auto -mt-4 mb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[['+1,200', 'مورد معتمد'], ['+500', 'مشترٍ نشط'], [fmt(2000000000), 'قيمة المعاملات'], ['+8,000', 'طلب شراء']].map(([v, l], i) => (
            <div key={i} className="bg-white rounded-2xl p-5 text-center border" style={{ borderColor: '#E5E7EF' }}>
              <p className="text-2xl font-extrabold" style={{ color: '#4F46E5' }}>{v}</p>
              <p className="text-xs text-slate-400 mt-1">{t(l)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-12 py-12" style={{ background: '#fff' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 text-center mb-3">{t('كل ما تحتاجه سلسلة إمدادك')}</h2>
          <p className="text-slate-500 text-center mb-10">{t('أدوات متكاملة من الطلب حتى التسوية')}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="rounded-2xl p-6 border hover:shadow-md transition-shadow" style={{ borderColor: '#E5E7EF' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: f.color + '15' }}>
                  <f.icon size={22} style={{ color: f.color }} />
                </div>
                <h3 className="font-bold text-slate-800 mb-1.5">{t(f.title)}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{t(f.desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 lg:px-12 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 text-center mb-10">{t('كيف تعمل؟')}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <div key={i} className="text-center">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center font-extrabold text-white mb-4" style={{ background: '#4F46E5' }}>{s.n}</div>
              <h3 className="font-bold text-slate-800 mb-1.5">{t(s.title)}</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">{t(s.desc)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 lg:px-12 py-12" style={{ background: '#fff' }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 text-center mb-10">{t('الأسئلة الشائعة')}</h2>
          <div className="space-y-3">
            {FAQ.map(([q, a], i) => (
              <div key={i} className="rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E7EF' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-right">
                  <span className="font-bold text-slate-800 text-sm">{t(q)}</span>
                  <ChevronDown size={18} className="text-slate-400 flex-shrink-0 transition-transform" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none' }} />
                </button>
                {openFaq === i && (
                  <p className="px-5 pb-4 text-sm text-slate-500 leading-relaxed">{t(a)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-12 pb-20">
        <div className="max-w-4xl mx-auto rounded-3xl px-8 py-12 text-center" style={{ background: '#1E1B4B' }}>
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">{t('جاهز لتطوير سلسلة إمدادك؟')}</h2>
          <p className="text-slate-300 mb-6">{t('انضم اليوم وابدأ خلال دقائق — مجانًا.')}</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-white font-bold text-sm" style={{ background: '#4F46E5' }}>
            {t('إنشاء حساب')} <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center justify-center gap-5 flex-wrap mt-7 text-xs text-slate-300">
            {['ضمان للدفعات', 'تقييم مخاطر', 'تحليلات احترافية', 'دعم ثنائي اللغة'].map((x, i) => (
              <span key={i} className="flex items-center gap-1.5"><CheckCircle2 size={14} style={{ color: '#34D399' }} /> {t(x)}</span>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-6 lg:px-12 py-8 text-center text-xs text-slate-400 border-t" style={{ borderColor: '#E5E7EF' }}>
        <div className="flex items-center justify-center gap-3 mb-2">
          <Link to="/about" className="hover:text-slate-600">{t('من نحن')}</Link>
          <span>·</span>
          <Link to="/login" className="hover:text-slate-600">{t('تسجيل الدخول')}</Link>
          <span>·</span>
          <Link to="/register" className="hover:text-slate-600">{t('إنشاء حساب')}</Link>
        </div>
        <span className="font-bold tracking-widest" style={{ color: '#4F46E5' }}>FLOWRIZ</span> · {t('منصة سلاسل الإمداد الذكية')} © 2026
      </footer>
    </div>
  );
}
