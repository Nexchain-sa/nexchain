import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { Target, Eye, Globe, ArrowLeft, ShieldCheck, Users, Zap, Scale } from 'lucide-react';

const VALUES = [
  { icon: ShieldCheck, color: '#4F46E5', title: 'الثقة والشفافية', desc: 'كل عملية موثّقة، والمدفوعات مضمونة، والقرارات مبنية على بيانات واضحة.' },
  { icon: Users, color: '#059669', title: 'التمكين', desc: 'نمكّن المنشآت الصغيرة والمتوسطة من الوصول للتصنيع والتمويل بسهولة وعدالة.' },
  { icon: Zap, color: '#D97706', title: 'الكفاءة', desc: 'نختصر دورة الإمداد من الطلب حتى التسوية في منظومة واحدة سريعة.' },
  { icon: Scale, color: '#7C3AED', title: 'العدالة', desc: 'منافسة مفتوحة وتقييم موضوعي للمخاطر يضمن فرصًا متكافئة للجميع.' },
];

export default function About() {
  const { user } = useAuth();
  const { t, dir, lang, toggle } = useLang();
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen font-arabic" dir={dir} style={{ background: '#F8FAFC' }}>
      <header className="flex items-center justify-between px-6 lg:px-12 h-16" style={{ background: '#1E1B4B' }}>
        <Link to="/welcome" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg" style={{ background: '#4F46E5', color: '#fff' }}>⬡</div>
          <span className="font-bold text-xl tracking-widest text-white">FLOWRIZ</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={toggle} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-bold text-slate-200 hover:bg-white/10"><Globe size={15} />{lang === 'ar' ? 'EN' : 'ع'}</button>
          <Link to="/login" className="px-4 py-1.5 rounded-lg text-sm font-bold text-white hover:bg-white/10">{t('تسجيل الدخول')}</Link>
          <Link to="/register" className="px-4 py-1.5 rounded-lg text-sm font-bold text-white" style={{ background: '#4F46E5' }}>{t('إنشاء حساب')}</Link>
        </div>
      </header>

      <section className="px-6 lg:px-12 py-16 text-center max-w-3xl mx-auto">
        <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-5" style={{ background: '#EEF2FF', color: '#4F46E5' }}>{t('من نحن')}</span>
        <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight mb-5">{t('نبني البنية التحتية الرقمية لسلاسل الإمداد')}</h1>
        <p className="text-base lg:text-lg text-slate-500 leading-relaxed">
          {t('FLOWRIZ منصة سعودية تجمع المشترين والموردين والمصانع والممولين في مكان واحد، لتسهيل التجارة والتصنيع والتمويل بثقة وكفاءة، مع ضمان للدفعات وحوكمة كاملة.')}
        </p>
      </section>

      <section className="px-6 lg:px-12 pb-8 max-w-5xl mx-auto grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-7 border" style={{ borderColor: '#E5E7EF' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: '#4F46E515' }}><Target size={22} style={{ color: '#4F46E5' }} /></div>
          <h2 className="font-bold text-lg text-slate-800 mb-2">{t('رسالتنا')}</h2>
          <p className="text-sm text-slate-500 leading-relaxed">{t('تمكين المنشآت من إدارة سلاسل إمدادها وتمويلها رقميًّا، باختصار الوقت والتكلفة، وضمان حقوق جميع الأطراف.')}</p>
        </div>
        <div className="bg-white rounded-2xl p-7 border" style={{ borderColor: '#E5E7EF' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: '#05966915' }}><Eye size={22} style={{ color: '#059669' }} /></div>
          <h2 className="font-bold text-lg text-slate-800 mb-2">{t('رؤيتنا')}</h2>
          <p className="text-sm text-slate-500 leading-relaxed">{t('أن نكون المنصة الرائدة لسلاسل الإمداد والتمويل في المنطقة، داعمين لرؤية المملكة 2030 في تنمية القطاع الصناعي والمنشآت.')}</p>
        </div>
      </section>

      <section className="px-6 lg:px-12 py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 text-center mb-10">{t('قيمنا')}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((v, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border text-center" style={{ borderColor: '#E5E7EF' }}>
                <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-4" style={{ background: v.color + '15' }}><v.icon size={22} style={{ color: v.color }} /></div>
                <h3 className="font-bold text-slate-800 mb-1.5">{t(v.title)}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{t(v.desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-12 pb-20">
        <div className="max-w-4xl mx-auto rounded-3xl px-8 py-12 text-center" style={{ background: '#1E1B4B' }}>
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">{t('انضم إلى FLOWRIZ اليوم')}</h2>
          <p className="text-slate-300 mb-6">{t('ابدأ خلال دقائق — مجانًا.')}</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-white font-bold text-sm" style={{ background: '#4F46E5' }}>{t('إنشاء حساب')} <ArrowLeft size={16} /></Link>
        </div>
      </section>

      <footer className="px-6 lg:px-12 py-8 text-center text-xs text-slate-400 border-t" style={{ borderColor: '#E5E7EF' }}>
        <span className="font-bold tracking-widest" style={{ color: '#4F46E5' }}>FLOWRIZ</span> · {t('منصة سلاسل الإمداد الذكية')} © 2026
      </footer>
    </div>
  );
}
