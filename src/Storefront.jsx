import React, { useState } from 'react';
import { ArrowRight, BarChart3, Boxes, Building2, CheckCircle2, ChevronDown, Handshake, Layers3, Menu, Network, ShieldCheck, Store, X, Zap } from 'lucide-react';

const features = [
  { icon: Store, title: 'Mağaza yönetimi', text: 'Ürünlerinizi ve mağaza operasyonlarınızı tek merkezden takip edin.' },
  { icon: Boxes, title: 'Ürün ve stok takibi', text: 'Ürün kataloğunuzu düzenleyin, stok bilgilerinizi kontrol altında tutun.' },
  { icon: BarChart3, title: 'Buybox ve fiyat takibi', text: 'Pazaryeri rekabetini izlemek ve fiyat kararlarınızı desteklemek için tasarlandı.' },
  { icon: Layers3, title: 'Pazaryeri yönetimi', text: 'Farklı satış kanallarınızı tek bir yönetim deneyiminde bir araya getirin.' },
  { icon: Network, title: 'Bayi ağı yönetimi', text: 'Bayi, alt bayi ve müşteri ilişkilerinizi düzenli bir yapıda yönetin.' },
  { icon: Zap, title: 'Reklam ve kampanyalar', text: 'Banner ve tanıtım alanlarınızı planlayıp yönetebileceğiniz bir altyapı.' }
];

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function Storefront() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', city: '', message: '' });

  const openApplication = () => {
    setSubmitted(false);
    setSubmitError('');
    setApplicationOpen(true);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      if (!supabaseUrl || !supabaseKey) throw new Error('Başvuru sistemi henüz yapılandırılmadı. Lütfen daha sonra tekrar deneyin.');
      if (!/^https:\/\//i.test(supabaseUrl)) throw new Error('Supabase proje adresi geçersiz.');
      const { createClient } = await import('@supabase/supabase-js');
      const client = createClient(supabaseUrl, supabaseKey);
      const { error } = await client.from('dealer_applications').insert([{
        name: form.name.trim(), company: form.company.trim() || null,
        phone: form.phone.trim(), email: form.email.trim() || null,
        city: form.city.trim() || null, message: form.message.trim() || null, status: 'pending'
      }]);
      if (error) throw error;
      setSubmitted(true);
      setForm({ name: '', company: '', phone: '', email: '', city: '', message: '' });
    } catch (error) {
      console.error('Bayi başvurusu gönderilemedi:', error);
      setSubmitError(error?.message || 'Başvuru gönderilemedi. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="corporate-site">
    <header className="corp-header">
      <a className="corp-brand" href="#anasayfa" aria-label="Entegre Ultra ana sayfa"><span className="corp-logo">EU</span><span>Entegre <b>Ultra</b><small>İŞİNİZİN DİJİTAL MERKEZİ</small></span></a>
      <button className="corp-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menüyü aç veya kapat">{menuOpen ? <X/> : <Menu/>}</button>
      <nav className={menuOpen ? 'corp-nav open' : 'corp-nav'}>
        <a href="#cozumler" onClick={() => setMenuOpen(false)}>Çözümlerimiz</a>
        <a href="#hakkimizda" onClick={() => setMenuOpen(false)}>Hakkımızda</a>
        <a href="#bayilik" onClick={() => setMenuOpen(false)}>Bayilik</a>
        <button onClick={openApplication}>Bayi başvurusu <ArrowRight size={16}/></button>
      </nav>
    </header>

    {applicationOpen ? <main className="corp-application">
      <button className="corp-back" onClick={() => setApplicationOpen(false)}>← Ana sayfaya dön</button>
      <div className="corp-application-grid">
        <div className="corp-application-copy"><span className="corp-kicker">ENTEGRE ULTRA İŞ ORTAKLIĞI</span><h1>Birlikte büyüyelim.</h1><p>Entegre Ultra bayi ağına katılmak için başvurunuzu iletin. Ekibimiz bilgilerinizi değerlendirsin ve sonraki adımlar için sizinle iletişime geçsin.</p><ul><li><CheckCircle2/> Bayi ve alt bayi yapılanması</li><li><CheckCircle2/> Müşteri ve abonelik satışı takibi</li><li><CheckCircle2/> Satış komisyonu ve kazanç takibi</li></ul></div>
        <section className="corp-form-card"><div className="corp-form-heading"><span>İŞ ORTAKLIĞI</span><h2>Bayi başvuru formu</h2><p>Zorunlu alanları doldurarak başvurunuzu gönderin.</p></div>
          {submitted ? <div className="corp-success"><CheckCircle2 size={46}/><h3>Başvurunuz alındı</h3><p>Başvurunuz başarıyla iletildi. Değerlendirme sürecinde sizinle iletişime geçilecektir.</p><button onClick={() => setApplicationOpen(false)}>Ana sayfaya dön</button></div> :
          <form className="corp-form" onSubmit={submitApplication}>
            <label>Ad soyad *<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Adınız ve soyadınız"/></label>
            <label>Firma / işletme adı<input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Firma adınız"/></label>
            <label>Telefon numarası *<input required type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="05xx xxx xx xx"/></label>
            <label>E-posta<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="ornek@firma.com"/></label>
            <label>İl / şehir<input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Bulunduğunuz şehir"/></label>
            <label className="corp-full">Kısaca kendinizden bahsedin<textarea rows="4" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="İşletmeniz ve bayi olma hedefiniz hakkında bilgi verebilirsiniz."/></label>
            {submitError && <p className="corp-error" role="alert">{submitError}</p>}
            <button className="corp-submit" type="submit" disabled={submitting}>{submitting ? 'Gönderiliyor...' : 'Başvuruyu gönder'} <ArrowRight size={17}/></button>
            <small className="corp-privacy">Başvurunuzun iletilmesi için sistem bağlantısı gereklidir. Kişisel verilerin işlenmesine ilişkin aydınlatma metni yayına alınmadan önce tamamlanmalıdır.</small>
          </form>}
        </section>
      </div>
    </main> : <>
      <main>
        <section className="corp-hero" id="anasayfa">
          <div className="corp-hero-content"><span className="corp-kicker"><i/> TİCARETİNİZ İÇİN ENTEGRE ÇÖZÜM</span><h1>İşinizi tek merkezden <em>yönetin.</em></h1><p>Entegre Ultra; mağaza, ürün, pazaryeri ve bayi operasyonlarını bir araya getirme hedefiyle geliştirilen yeni nesil yönetim platformudur.</p><div className="corp-hero-actions"><a className="corp-primary" href="#cozumler">Çözümlerimizi keşfedin <ArrowRight size={17}/></a><button className="corp-secondary" onClick={openApplication}>Bayi ağımıza katılın</button></div><div className="corp-trust-line"><ShieldCheck size={17}/> İş süreçlerinizi tek noktadan takip etme yaklaşımı</div></div>
          <div className="corp-hero-visual"><div className="corp-glow"/><div className="corp-dashboard-card"><div className="corp-dash-top"><span/><span/><span/><b>ENTEGRE ULTRA</b></div><div className="corp-dash-title">Yönetim merkezi</div><div className="corp-dash-stats"><div><small>Ürün yönetimi</small><strong><Boxes/></strong><i/></div><div><small>Bayi ağı</small><strong><Network/></strong><i/></div><div><small>Performans</small><strong><BarChart3/></strong><i/></div></div><div className="corp-dash-chart"><span/><span/><span/><span/><span/><span/><span/><span/><span/></div><div className="corp-dash-foot"><span/> Tüm operasyonlar tek ekranda</div></div><div className="corp-floating corp-float-one"><Handshake/> İş ortaklığı ağı</div><div className="corp-floating corp-float-two"><CheckCircle2/> Merkezi yönetim</div></div>
          <a className="corp-scroll" href="#cozumler">Aşağı kaydır <ChevronDown size={16}/></a>
        </section>
        <section className="corp-intro" id="hakkimizda"><span className="corp-kicker">ENTEGRE BİR YAKLAŞIM</span><h2>İşinizi büyütürken<br/><em>kontrol sizde kalsın.</em></h2><p>Satış kanallarını, mağaza operasyonlarını ve iş ortaklığı süreçlerini daha düzenli yönetebilmeniz için geliştirilen Entegre Ultra, ticaretin farklı ihtiyaçlarını tek bir dijital deneyimde buluşturmayı amaçlar.</p></section>
        <section className="corp-solutions" id="cozumler"><div className="corp-section-heading"><div><span className="corp-kicker">PLATFORM YETENEKLERİ</span><h2>İşinizi destekleyen <em>çözümler</em></h2></div><p>İhtiyaç duyduğunuz yönetim araçları, tek bir platform yaklaşımıyla.</p></div><div className="corp-feature-grid">{features.map(({icon:Icon,title,text},i)=><article className="corp-feature" key={title}><span className="corp-feature-icon"><Icon/></span><small>0{i+1}</small><h3>{title}</h3><p>{text}</p></article>)}</div></section>
        <section className="corp-partner" id="bayilik"><div className="corp-partner-icon"><Building2/></div><div><span className="corp-kicker">İŞ ORTAKLIĞI PROGRAMI</span><h2>Entegre Ultra bayisi<br/><em>olmak ister misiniz?</em></h2><p>Bayi ağımıza katılın. Müşteri ve abonelik satışlarınızı yönetin, alt bayi yapınızı oluşturun, komisyon ve kazanç takibinizi tek panelden yapın.</p><button className="corp-primary" onClick={openApplication}>Bayi başvurusu yap <ArrowRight size={17}/></button></div><div className="corp-partner-points"><span><CheckCircle2/> Bayi ve alt bayi ağı</span><span><CheckCircle2/> Müşteri portföyü yönetimi</span><span><CheckCircle2/> Satış ve komisyon takibi</span></div></section>
        <section className="corp-bottom-cta"><span className="corp-kicker">ŞİMDİ TANIŞALIM</span><h2>Ticaretiniz için yeni bir başlangıç.</h2><p>Entegre Ultra hakkında bilgi alın veya bayi başvurunuzu hemen iletin.</p><button className="corp-primary" onClick={openApplication}>Bize katılın <ArrowRight size={17}/></button></section>
      </main>
      <footer className="corp-footer"><a className="corp-brand" href="#anasayfa"><span className="corp-logo">EU</span><span>Entegre <b>Ultra</b><small>İŞİNİZİN DİJİTAL MERKEZİ</small></span></a><span>© 2026 Entegre Ultra. Tüm hakları saklıdır.</span><a href="#bayilik">Bayi başvurusu <ArrowRight size={14}/></a></footer>
    </>}
  </div>;
}
