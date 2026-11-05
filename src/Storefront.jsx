import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ChevronLeft, ChevronRight, Search, ShoppingCart, Store, ShieldCheck, Truck, Headphones, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

const slides = [
  { tag: 'ENTEGRE ULTRA', title: 'Alışverişte yeni bir deneyim', desc: 'Aradığınız ürünler, güvenilir mağazalar ve avantajlı fırsatlar tek yerde.', button: 'Ürünleri keşfet', tone: 'sunrise', art: '✦' },
  { tag: 'TEK PLATFORM, ÇOK SEÇENEK', title: 'Binlerce seçenek, kolay alışveriş', desc: 'Farklı kategorileri keşfedin, ihtiyaçlarınıza uygun ürünleri bulun.', button: 'Kategorilere göz at', tone: 'ocean', art: '◈' },
  { tag: 'MAĞAZANI BÜYÜT', title: 'Sen de Entegre Ultra’da yerini al', desc: 'Ürünlerini daha fazla müşteriye ulaştırmak için mağazanı oluştur.', button: 'Satıcı ol', tone: 'violet', art: '↗' }
];
const categories = [['Elektronik','⌁'],['Ev & Yaşam','⌂'],['Moda','◇'],['Kozmetik','✿'],['Spor','◎'],['Kitap & Hobi','▤']];

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default function Storefront() {
  const [slide,setSlide]=useState(0);
  const [applicationOpen,setApplicationOpen]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [submitError,setSubmitError]=useState('');
  const [form,setForm]=useState({name:'',company:'',phone:'',email:'',city:'',message:''});
  const current=slides[slide];
  const change=(step)=>setSlide((slide+step+slides.length)%slides.length);
  const openApplication=()=>{setSubmitted(false);setSubmitError('');setApplicationOpen(true);};
  const submitApplication=async(e)=>{e.preventDefault();setSubmitError('');if(!supabase){setSubmitError('Başvuru sistemi henüz yapılandırılmadı. Lütfen daha sonra tekrar deneyin.');return;}setSubmitting(true);try{const {error}=await supabase.from('dealer_applications').insert([{name:form.name.trim(),company:form.company.trim()||null,phone:form.phone.trim(),email:form.email.trim()||null,city:form.city.trim()||null,message:form.message.trim()||null,status:'pending'}]);if(error)throw error;setSubmitted(true);setForm({name:'',company:'',phone:'',email:'',city:'',message:''});}catch(error){console.error('Bayi başvurusu gönderilemedi:',error);setSubmitError('Başvurunuz gönderilemedi. Bağlantınızı kontrol edip tekrar deneyin.');}finally{setSubmitting(false);}};
  if(applicationOpen) return <div className="storefront dealer-page">
    <div className="dealer-top"><button className="dealer-back" onClick={()=>setApplicationOpen(false)}><ChevronLeft size={18}/> Mağazaya dön</button><div className="shop-brand"><span className="shop-logo">EU</span><strong>Entegre <b>Ultra</b></strong></div></div>
    <section className="dealer-hero"><span>ENTEGRE ULTRA İŞ ORTAKLIĞI</span><h2>Gücümüze güç katın.<br/><b>Bayimiz olun!</b></h2><p>Entegre Ultra bayi ağına katılın; müşterilere ulaşın, işinizi büyütün ve birlikte kazanalım.</p><div className="dealer-perks"><span>✦ Genişleyen iş ağı</span><span>✦ Bayi ve alt bayi yönetimi</span><span>✦ Satış ve komisyon takibi</span></div></section>
    <section className="dealer-form-wrap"><div className="dealer-form-intro"><small>BAYİLİK BAŞVURUSU</small><h2>Başvuru formu</h2><p>Bilgilerinizi bırakın, ekibimiz başvurunuzu değerlendirmek üzere sizinle iletişime geçsin.</p></div>
      {submitted ? <div className="dealer-success"><CheckCircle2 size={42}/><h3>Başvurunuz alındı!</h3><p>Başvurunuz Entegre Ultra başvuru sistemine başarıyla iletildi. Değerlendirme sürecinde sizinle iletişime geçilecektir.</p><button className="dealer-submit" onClick={()=>setApplicationOpen(false)}>Mağazaya dön</button></div> :
      <form className="dealer-form" onSubmit={submitApplication}>
        <label>Ad soyad *<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Adınız ve soyadınız"/></label>
        <label>Firma / işletme adı<input value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="Firma adınız"/></label>
        <label>Telefon numarası *<input required type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="05xx xxx xx xx"/></label>
        <label>E-posta adresi<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="ornek@firma.com"/></label>
        <label>İl / şehir<input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="Bulunduğunuz şehir"/></label>
        <label>Başvurunuz hakkında<textarea rows="4" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="Kısaca kendinizden ve iş planınızdan bahsedin"/></label>
        {submitError && <p className="form-error" role="alert">{submitError}</p>}<button className="dealer-submit" type="submit" disabled={submitting}>{submitting?'Gönderiliyor...':'Başvuruyu gönder'} <ArrowRight size={17}/></button><small className="dealer-privacy">Bilgileriniz yalnızca başvurunun değerlendirilmesi amacıyla kullanılmalıdır. Canlı başvuru için gizlilik metni ve sunucu altyapısı eklenecektir.</small>
      </form>}
    </section><footer className="shop-footer"><strong>Entegre <b>Ultra</b></strong><small>© 2026 Entegre Ultra</small></footer>
  </div>;
  return <div className="storefront">
    <div className="shop-topline"><div className="shop-brand"><span className="shop-logo">EU</span><strong>Entegre <b>Ultra</b></strong></div><div className="shop-search"><Search size={17}/><span>Ürün, kategori veya mağaza ara</span></div><button className="shop-cart"><ShoppingCart size={18}/> Sepetim <i>0</i></button></div>
    <div className="shop-campaign-strip"><Sparkles size={15}/> Entegre Ultra’ya hoş geldiniz — fırsatları keşfetmeye başlayın!</div>
    <section className={'shop-hero '+current.tone}><div className="hero-copy"><span className="hero-tag">{current.tag}</span><h2>{current.title}</h2><p>{current.desc}</p><button onClick={current.button==='Satıcı ol'?openApplication:()=>change(1)}>{current.button}<ArrowRight size={16}/></button></div><div className="hero-art"><span>{current.art}</span><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/></div><div className="hero-controls"><button onClick={()=>change(-1)} aria-label="Önceki slayt"><ChevronLeft size={18}/></button><span>{slides.map((_,i)=><i key={i} className={i===slide?'on':''} onClick={()=>setSlide(i)}/>)}</span><button onClick={()=>change(1)} aria-label="Sonraki slayt"><ChevronRight size={18}/></button></div></section>
    <section className="shop-section"><div className="shop-section-head"><div><small>KEŞFET</small><h2>Kategoriler</h2></div><button className="shop-text-link">Tüm kategoriler <ArrowRight size={15}/></button></div><div className="category-grid">{categories.map(([name,icon],i)=><button className="category-tile" key={name}><span className={'category-icon category-'+i}>{icon}</span><strong>{name}</strong><small>Ürünleri incele</small></button>)}</div></section>
    <section className="about-strip"><div className="about-symbol">EU</div><div><small>BİZİ TANIYIN</small><h2>Alışverişin ve ticaretin buluşma noktası</h2><p>Entegre Ultra; müşterileri, mağazaları ve fırsatları tek platformda buluşturma hedefiyle yola çıktı. Kolay keşif ve güçlü mağaza deneyimi için sürekli gelişiyoruz.</p></div></section>
    <section className="shop-section"><div className="shop-section-head"><div><small>VİTRİNİN ÖNE ÇIKANLARI</small><h2>Öne çıkan ürünler</h2></div><span className="coming-label">Ürün bağlantıları hazırlanıyor</span></div><div className="featured-grid">{[['⌚','Teknoloji dünyasını keşfet','Elektronik'],['⌂','Yaşam alanına yenilik kat','Ev & Yaşam'],['◇','Tarzını yansıtan seçimler','Moda'],['✿','Kendine iyi bak','Kozmetik']].map(([symbol,title,cat],i)=><article className="featured-card" key={cat}><div className={'featured-art feature-'+i}>{symbol}</div><small>{cat}</small><h3>{title}</h3><span>Yakında <ArrowRight size={14}/></span></article>)}</div></section>
    <section className="seller-banner"><div><small>ENTEGRE ULTRA İŞ ORTAKLIĞI</small><h2>Bayimiz olmak ister misiniz?</h2><p>Bayi ağımıza katılın, kendi müşteri portföyünüzü oluşturun ve işinizi büyütün.</p><button className="seller-cta" onClick={openApplication}>Bayi başvurusu yap <ArrowRight size={17}/></button></div><Store size={54}/></section>
    <section className="shop-benefits"><div><ShieldCheck/><strong>Güven odaklı deneyim</strong><small>Şeffaf ve anlaşılır alışveriş</small></div><div><Truck/><strong>Kolay sipariş takibi</strong><small>Sipariş süreçleri tek noktada</small></div><div><Headphones/><strong>Destek yanında</strong><small>Yardım ve destek alanı</small></div></section>
    <footer className="shop-footer"><strong>Entegre <b>Ultra</b></strong><span>Alışverişte yeni bir deneyim.</span><small>© 2026 Entegre Ultra · İlk taslak</small></footer>
  </div>;
}
