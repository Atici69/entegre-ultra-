import React, { useState } from 'react';
import { ArrowRight, BarChart3, Boxes, Building2, CheckCircle2, ChevronDown, Handshake, Layers3, Menu, Network, ShieldCheck, Store, TrendingUp, Trophy, X, Zap } from 'lucide-react';

const features = [
  { icon: Trophy, title: 'Akıllı Buybox yönetimi', text: 'Rakip fiyatlarını izleyin, kâr sınırınızı koruyun ve Buybox performansınızı tek merkezden yönetin.' },
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
        <a href="#pazaryerleri" onClick={() => setMenuOpen(false)}>Pazaryerleri</a><a href="#buybox" onClick={() => setMenuOpen(false)}>Buybox</a><a href="#cozumler" onClick={() => setMenuOpen(false)}>Çözümlerimiz</a>
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
          <div className="corp-hero-content"><span className="corp-kicker"><i/> TİCARETİNİZ İÇİN ENTEGRE ÇÖZÜM</span><h1>İşinizi tek merkezden <em>yönetin.</em></h1><p>Entegre Ultra; mağaza, ürün, pazaryeri ve bayi operasyonlarını bir araya getirme hedefiyle geliştirilen yeni nesil yönetim platformudur.</p><div className="corp-hero-actions"><a className="corp-primary" href="#buybox">Buybox sistemini keşfedin <ArrowRight size={17}/></a><button className="corp-secondary" onClick={openApplication}>Bayi ağımıza katılın</button></div><div className="corp-trust-line"><ShieldCheck size={17}/> İş süreçlerinizi tek noktadan takip etme yaklaşımı</div></div>
          <div className="corp-hero-visual"><div className="corp-glow"/><div className="corp-dashboard-card"><div className="corp-dash-top"><span/><span/><span/><b>ENTEGRE ULTRA</b></div><div className="corp-dash-title">Yönetim merkezi</div><div className="corp-dash-stats"><div><small>Ürün yönetimi</small><strong><Boxes/></strong><i/></div><div><small>Bayi ağı</small><strong><Network/></strong><i/></div><div><small>Performans</small><strong><BarChart3/></strong><i/></div></div><div className="corp-dash-chart"><span/><span/><span/><span/><span/><span/><span/><span/><span/></div><div className="corp-dash-foot"><span/> Tüm operasyonlar tek ekranda</div></div><div className="corp-floating corp-float-one"><Handshake/> İş ortaklığı ağı</div><div className="corp-floating corp-float-two"><CheckCircle2/> Merkezi yönetim</div></div>
          <a className="corp-scroll" href="#cozumler">Aşağı kaydır <ChevronDown size={16}/></a>
        </section>
        <section className="corp-mobile-first" id="mobil">
          <div className="corp-mobile-copy"><span className="corp-kicker">MOBİL ÖNCELİKLİ DENEYİM</span><h2>Entegre Ultra <em>cebinizde.</em></h2><p>Ürünlerinizi, stoklarınızı, siparişlerinizi ve bayi ağınızı telefonunuzdan kolayca takip edebilmeniz için mobil kullanım öncelikli bir deneyim hedefliyoruz. İhtiyaç duyduğunuzda bilgisayarınızdan da erişebilirsiniz.</p><div className="corp-mobile-points"><span><CheckCircle2/> Telefonda kolay kullanım</span><span><CheckCircle2/> Hızlı erişim ve sade ekranlar</span><span><CheckCircle2/> Mobil ve web uyumu</span></div></div>
          <div className="corp-mobile-visual"><div className="corp-phone"><div className="corp-phone-notch"/><div className="corp-phone-brand">EU <b>Entegre Ultra</b></div><small>YÖNETİM ÖZETİ</small><strong>Kontrol cebinizde</strong><div className="corp-phone-stat"><span>Ürünler</span><b>Yönetim</b></div><div className="corp-phone-stat"><span>Siparişler</span><b>Takip</b></div><div className="corp-phone-stat"><span>Buybox</span><b>Analiz</b></div><div className="corp-phone-nav"><i/><i/><i/><i/></div></div></div>
        </section>
        <section className="corp-difference" id="hakkimizda">
          <div className="corp-difference-heading"><span className="corp-kicker">BİZ NE YAPIYORUZ?</span><h2>Ticaretin dağınık işlerini<br/><em>tek bir düzende topluyoruz.</em></h2><p>Entegre Ultra; e-ticaret yapan işletmelerin pazaryeri, mağaza, ürün, stok, sipariş, fiyat ve bayi süreçlerini tek bir yönetim deneyiminde bir araya getirmek için tasarlanıyor.</p></div>
          <div className="corp-difference-grid">
            <article className="corp-difference-card"><span>01</span><h3>Operasyonları birleştiriyoruz</h3><p>Farklı satış kanallarındaki ürün, stok ve sipariş süreçlerini tek merkezden takip etmenize yardımcı oluyoruz.</p></article>
            <article className="corp-difference-card"><span>02</span><h3>Fiyat rekabetini kâra bağlıyoruz</h3><p>Buybox ve rakip fiyat takibini, belirlediğiniz minimum kâr hedeflerini gözeten bir yönetim yaklaşımıyla ele alıyoruz.</p></article>
            <article className="corp-difference-card"><span>03</span><h3>Büyümenizi bayi ağıyla destekliyoruz</h3><p>Bayi, alt bayi ve müşteri ilişkileriyle satış, abonelik ve komisyon süreçlerini aynı yapıda yönetmeyi hedefliyoruz.</p></article>
            <article className="corp-difference-card"><span>04</span><h3>Mobil kullanım önceliği</h3><p>İşletmenizi yalnızca masa başında değil, telefonunuzdan da rahatça yönetebilmeniz için mobil öncelikli tasarlıyoruz.</p></article>
          </div>
          <div className="corp-difference-promise"><div><b>FARKIMIZ NE?</b><strong>Sadece ürünleri değil, ticaretin bütün işleyişini birlikte düşünmemiz.</strong></div><p>Tek panel yaklaşımı, kâr odaklı Buybox araçları, bayi ağı ve mobil kullanım odağını aynı platformda buluşturuyoruz.</p></div>
        </section>
        <section className="corp-marketplaces" id="pazaryerleri">
          <div className="corp-marketplaces-heading"><span className="corp-kicker">ÇOKLU SATIŞ KANALI YÖNETİMİ</span><h2>Satış kanallarınız <em>tek merkezde.</em></h2><p>Türkiye'deki ve global pazaryerlerindeki operasyonlarınızı tek panelden yönetme hedefi.</p></div>
          <div className="corp-marketplace-grid">
            <article className="corp-marketplace-card trendyol"><strong>trendyol</strong><span>Trendyol</span></article>
            <article className="corp-marketplace-card hepsi"><strong>hepsiburada</strong><span>Hepsiburada</span></article>
            <article className="corp-marketplace-card amazon"><strong>amazon</strong><span>Amazon</span></article>
            <article className="corp-marketplace-card pazarama"><strong>pazarama</strong><span>Pazarama</span></article>
            <article className="corp-marketplace-card ozon"><strong>OZON</strong><span>Ozon</span></article>
            <article className="corp-marketplace-card n11"><strong>n11</strong><span>n11</span></article>
          </div>
          <div className="corp-marketplace-bottom"><span><CheckCircle2/> Ürün ve katalog aktarımı</span><span><CheckCircle2/> Stok ve sipariş senkronizasyonu</span><span><CheckCircle2/> Fiyat ve Buybox takibi</span><span><CheckCircle2/> Tek panelden operasyon</span></div>
          <p className="corp-marketplace-disclaimer">Bu logolar hedeflenen pazaryeri bağlantılarını gösterir. Her kanalın canlı kullanımı, ilgili platformun API erişimi, teknik koşulları ve yetkilendirmeleri tamamlandığında etkinleştirilecektir.</p>
        </section>
        <section className="corp-buybox" id="buybox">
          <div className="corp-buybox-copy">
            <span className="corp-kicker">ENTEGRE ULTRA'NIN ÖNE ÇIKAN GÜCÜ</span>
            <h2>BUYBOX'INDA KAL.<br/><em>KÂRINI KORU.</em></h2>
            <p>Fiyat rekabetini yalnızca en düşük fiyat olarak görmeyin. Rakiplerinizi takip edin, minimum kâr sınırınızı belirleyin ve fiyat kararlarınızı veriye dayalı yönetin.</p>
            <div className="corp-buybox-actions"><a className="corp-primary" href="#cozumler">Buybox özelliklerini incele <ArrowRight size={17}/></a><span><ShieldCheck size={17}/> Kâr sınırı odaklı fiyat önerileri</span></div>
            <div className="corp-buybox-points"><span><TrendingUp/> Rakip fiyat takibi</span><span><ShieldCheck/> Minimum kâr koruması</span><span><Trophy/> Buybox performans analizi</span></div>
          </div>
          <div className="corp-buybox-demo" aria-label="Örnek Buybox fiyat karşılaştırma paneli">
            <div className="corp-buybox-demo-head"><span><i/> ÖRNEK BUYBOX PANELİ</span><b>CANLI VERİ DEĞİLDİR</b></div>
            <div className="corp-buybox-status"><div><small>ÖRNEK DURUM</small><strong>Rekabet takibi</strong></div><span>● İzleme tasarımı</span></div>
            <div className="corp-buybox-product"><div className="corp-product-thumb">EU</div><div><b>Örnek ürün</b><small>Ürün fiyat karşılaştırması</small></div><strong>₺849</strong></div>
            <div className="corp-price-list"><div><span>Senin mağazan</span><b>₺849</b><i className="corp-price-tag">ÖRNEK</i></div><div><span>Rakip mağaza A</span><b>₺859</b></div><div><span>Rakip mağaza B</span><b>₺879</b></div></div>
            <div className="corp-buybox-recommend"><span><small>ÖRNEK FİYAT ÖNERİSİ</small><strong>₺839</strong></span><span>Minimum kâr sınırı<br/><b>Koruma kuralı</b></span></div>
            <p className="corp-demo-note">Bu alan tasarım örneğidir. Gerçek rakip fiyatları ve Buybox durumu, pazaryeri bağlantıları etkinleştirildiğinde gösterilir.</p>
          </div>
        </section>
        <section className="corp-solutions" id="cozumler"><div className="corp-section-heading"><div><span className="corp-kicker">PLATFORM YETENEKLERİ</span><h2>İşinizi destekleyen <em>çözümler</em></h2></div><p>İhtiyaç duyduğunuz yönetim araçları, tek bir platform yaklaşımıyla.</p></div><div className="corp-feature-grid">{features.map(({icon:Icon,title,text},i)=><article className="corp-feature" key={title}><span className="corp-feature-icon"><Icon/></span><small>0{i+1}</small><h3>{title}</h3><p>{text}</p></article>)}</div></section>
        <section className="corp-partner" id="bayilik"><div className="corp-partner-icon"><Building2/></div><div><span className="corp-kicker">İŞ ORTAKLIĞI PROGRAMI</span><h2>Entegre Ultra bayisi<br/><em>olmak ister misiniz?</em></h2><p>Bayi ağımıza katılın. Müşteri ve abonelik satışlarınızı yönetin, alt bayi yapınızı oluşturun, komisyon ve kazanç takibinizi tek panelden yapın.</p><button className="corp-primary" onClick={openApplication}>Bayi başvurusu yap <ArrowRight size={17}/></button></div><div className="corp-partner-points"><span><CheckCircle2/> Bayi ve alt bayi ağı</span><span><CheckCircle2/> Müşteri portföyü yönetimi</span><span><CheckCircle2/> Satış ve komisyon takibi</span></div></section>
        <section className="corp-bottom-cta"><span className="corp-kicker">ŞİMDİ TANIŞALIM</span><h2>Ticaretiniz için yeni bir başlangıç.</h2><p>Entegre Ultra hakkında bilgi alın veya bayi başvurunuzu hemen iletin.</p><button className="corp-primary" onClick={openApplication}>Bize katılın <ArrowRight size={17}/></button></section>
      </main>
      <footer className="corp-footer"><a className="corp-brand" href="#anasayfa"><span className="corp-logo">EU</span><span>Entegre <b>Ultra</b><small>İŞİNİZİN DİJİTAL MERKEZİ</small></span></a><span>© 2026 Entegre Ultra. Tüm hakları saklıdır.</span><a href="#bayilik">Bayi başvurusu <ArrowRight size={14}/></a></footer>
    </>}
  </div>;
}
