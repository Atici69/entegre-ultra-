import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, ShoppingCart, Store, ShieldCheck, Truck, Headphones, ArrowRight, Sparkles } from 'lucide-react';

const slides = [
  { tag: 'ENTEGRE ULTRA', title: 'Alışverişte yeni bir deneyim', desc: 'Aradığınız ürünler, güvenilir mağazalar ve avantajlı fırsatlar tek yerde.', button: 'Ürünleri keşfet', tone: 'sunrise', art: '✦' },
  { tag: 'TEK PLATFORM, ÇOK SEÇENEK', title: 'Binlerce seçenek, kolay alışveriş', desc: 'Farklı kategorileri keşfedin, ihtiyaçlarınıza uygun ürünleri bulun.', button: 'Kategorilere göz at', tone: 'ocean', art: '◈' },
  { tag: 'MAĞAZANI BÜYÜT', title: 'Sen de Entegre Ultra’da yerini al', desc: 'Ürünlerini daha fazla müşteriye ulaştırmak için mağazanı oluştur.', button: 'Satıcı ol', tone: 'violet', art: '↗' }
];

const categories = [
  ['Elektronik', '⌁'], ['Ev & Yaşam', '⌂'], ['Moda', '◇'], ['Kozmetik', '✿'], ['Spor', '◎'], ['Kitap & Hobi', '▤']
];

export default function Storefront() {
  const [slide, setSlide] = useState(0);
  const current = slides[slide];
  const change = (step) => setSlide((slide + step + slides.length) % slides.length);
  return <div className="storefront">
    <div className="shop-topline"><div className="shop-brand"><span className="shop-logo">EU</span><strong>Entegre <b>Ultra</b></strong></div><div className="shop-search"><Search size={17}/><span>Ürün, kategori veya mağaza ara</span></div><button className="shop-cart"><ShoppingCart size={18}/> Sepetim <i>0</i></button></div>
    <div className="shop-campaign-strip"><Sparkles size={15}/> Entegre Ultra’ya hoş geldiniz — fırsatları keşfetmeye başlayın!</div>
    <section className={'shop-hero '+current.tone}>
      <div className="hero-copy"><span className="hero-tag">{current.tag}</span><h2>{current.title}</h2><p>{current.desc}</p><button onClick={() => change(1)}>{current.button}<ArrowRight size={16}/></button></div>
      <div className="hero-art"><span>{current.art}</span><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/></div>
      <div className="hero-controls"><button onClick={() => change(-1)} aria-label="Önceki slayt"><ChevronLeft size={18}/></button><span>{slides.map((_,i)=><i key={i} className={i===slide?'on':''} onClick={()=>setSlide(i)}/>)}</span><button onClick={() => change(1)} aria-label="Sonraki slayt"><ChevronRight size={18}/></button></div>
    </section>
    <section className="shop-section"><div className="shop-section-head"><div><small>KEŞFET</small><h2>Kategoriler</h2></div><button className="shop-text-link">Tüm kategoriler <ArrowRight size={15}/></button></div><div className="category-grid">{categories.map(([name,icon],i)=><button className="category-tile" key={name}><span className={'category-icon category-'+i}>{icon}</span><strong>{name}</strong><small>Ürünleri incele</small></button>)}</div></section>
    <section className="about-strip"><div className="about-symbol">EU</div><div><small>BİZİ TANIYIN</small><h2>Alışverişin ve ticaretin buluşma noktası</h2><p>Entegre Ultra; müşterileri, mağazaları ve fırsatları tek platformda buluşturma hedefiyle yola çıktı. Kolay keşif ve güçlü mağaza deneyimi için sürekli gelişiyoruz.</p></div></section>
    <section className="shop-section"><div className="shop-section-head"><div><small>VİTRİNİN ÖNE ÇIKANLARI</small><h2>Öne çıkan ürünler</h2></div><span className="coming-label">Ürün bağlantıları hazırlanıyor</span></div><div className="featured-grid">{[['⌚','Teknoloji dünyasını keşfet','Elektronik'],['⌂','Yaşam alanına yenilik kat','Ev & Yaşam'],['◇','Tarzını yansıtan seçimler','Moda'],['✿','Kendine iyi bak','Kozmetik']].map(([symbol,title,cat],i)=><article className="featured-card" key={cat}><div className={'featured-art feature-'+i}>{symbol}</div><small>{cat}</small><h3>{title}</h3><span>Yakında <ArrowRight size={14}/></span></article>)}</div></section>
    <section className="seller-banner"><div><small>MAĞAZANI AÇ</small><h2>Ürünlerini Entegre Ultra’da sergile</h2><p>Satıcı paneliyle ürünlerini ve mağazanı tek noktadan yönet.</p></div><Store size={54}/></section>
    <section className="shop-benefits"><div><ShieldCheck/><strong>Güven odaklı deneyim</strong><small>Şeffaf ve anlaşılır alışveriş</small></div><div><Truck/><strong>Kolay sipariş takibi</strong><small>Sipariş süreçleri tek noktada</small></div><div><Headphones/><strong>Destek yanında</strong><small>Yardım ve destek alanı</small></div></section>
    <footer className="shop-footer"><strong>Entegre <b>Ultra</b></strong><span>Alışverişte yeni bir deneyim.</span><small>© 2026 Entegre Ultra · İlk taslak</small></footer>
  </div>;
}
