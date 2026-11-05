import React, { useState } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, Store, Users, CreditCard,
  Settings, Bell, Search, Plus, TrendingUp, Boxes, ArrowUpRight,
  Menu, X, ChevronDown, CircleHelp
} from 'lucide-react';

const navItems = [
  { label: 'Genel Bakış', icon: LayoutDashboard },
  { label: 'Ürünler', icon: Package },
  { label: 'Siparişler', icon: ShoppingCart },
  { label: 'Pazaryerleri', icon: Store },
  { label: 'Müşteriler', icon: Users },
  { label: 'Abonelik', icon: CreditCard },
  { label: 'Ayarlar', icon: Settings }
];

function App() {
  const [active, setActive] = useState('Genel Bakış');
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const stats = [
    { title: 'Toplam Ürün', value: '0', note: 'Ürün kataloğunuz', icon: Boxes },
    { title: 'Siparişler', value: '0', note: 'Henüz sipariş yok', icon: ShoppingCart },
    { title: 'Bağlı Pazaryeri', value: '0', note: 'Bağlantı kurulmadı', icon: Store },
    { title: 'Abonelik', value: 'Ücretsiz', note: '7 günlük deneme planı', icon: CreditCard }
  ];

  return <div className="app-shell">
    <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
      <div className="brand">
        <div className="brand-mark">EU</div>
        <div><strong>Entegre <span>Ultra</span></strong><small>YÖNETİM PANELİ</small></div>
        <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Menüyü kapat"><X size={20}/></button>
      </div>
      <div className="workspace"><div className="workspace-dot"/> <span>Mağazam</span><ChevronDown size={15}/></div>
      <p className="nav-caption">MENÜ</p>
      <nav>{navItems.map(item => {
        const Icon = item.icon;
        return <button key={item.label} className={active === item.label ? 'nav-item active' : 'nav-item'}
          onClick={() => { setActive(item.label); setMenuOpen(false); }}>
          <Icon size={18}/><span>{item.label}</span>
        </button>;
      })}</nav>
      <div className="sidebar-bottom"><CircleHelp size={17}/><span>Yardım ve destek</span></div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Menüyü aç"><Menu/></button>
        <div className="breadcrumb">Panel <span>/</span> {active}</div>
        <div className="top-actions">
          <label className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Panelde ara..."/></label>
          <button className="icon-button" aria-label="Bildirimler"><Bell size={19}/><i/></button>
          <div className="avatar">EU</div>
        </div>
      </header>

      <section className="content">
        <div className="welcome-row">
          <div><p className="eyebrow">YÖNETİM MERKEZİ</p><h1>{active}</h1>
            <p className="subheading">Entegre Ultra'ya hoş geldiniz. İşletmenizi tek panelden yönetin.</p></div>
          <button className="primary-button" onClick={() => setShowAdd(true)}><Plus size={18}/> Hızlı işlem</button>
        </div>

        {active === 'Genel Bakış' ? <>
          <div className="trial-banner">
            <div className="trial-icon"><TrendingUp size={21}/></div>
            <div><strong>7 günlük ücretsiz deneme</strong><p>Ücretsiz pakette en fazla 100 ürün yönetebilirsiniz.</p></div>
            <button onClick={() => setActive('Abonelik')}>Paketleri incele <ArrowUpRight size={16}/></button>
          </div>
          <div className="section-heading"><div><h2>Genel durum</h2><p>Mağazanızın güncel özeti</p></div><span className="date-chip">İlk kurulum</span></div>
          <div className="stats-grid">{stats.map((stat) => {
            const Icon = stat.icon;
            return <article className="stat-card" key={stat.title}>
              <div className="stat-top"><span>{stat.title}</span><div className="stat-icon"><Icon size={19}/></div></div>
              <strong>{stat.value}</strong><small>{stat.note}</small>
            </article>;
          })}</div>
          <div className="lower-grid">
            <article className="panel-card"><div className="panel-title"><div><h2>Mağazanı bağla</h2><p>Pazaryerlerini tek merkezden yönet</p></div><Store size={20}/></div>
              <div className="market-list">
                {['Trendyol','Hepsiburada','N11','Diğer pazaryerleri'].map((name, i) => <div className="market-row" key={name}>
                  <div className={'market-logo market-'+i}>{name.slice(0,1)}</div><span>{name}</span><em>Yakında</em>
                </div>)}
              </div>
            </article>
            <article className="panel-card"><div className="panel-title"><div><h2>Başlangıç rehberi</h2><p>İlk adımlarınızı tamamlayın</p></div><Package size={20}/></div>
              <div className="guide-list"><div><b>1</b><span><strong>Hesap bilgilerini tamamla</strong><small>İşletme bilgilerinizi ekleyin</small></span></div>
                <div><b>2</b><span><strong>Ürün kataloğunu oluştur</strong><small>Ürünlerinizi sisteme ekleyin</small></span></div>
                <div><b>3</b><span><strong>Pazaryerlerini bağla</strong><small>Satış kanallarınızı hazırlayın</small></span></div></div>
            </article>
          </div>
        </> : <div className="empty-state"><div className="empty-icon"><Package size={28}/></div><h2>{active}</h2><p>Bu bölüm ilk sürümde hazırlanıyor. Ana panel ve mobil arayüz altyapısı hazır.</p><button className="secondary-button" onClick={() => setActive('Genel Bakış')}>Genel bakışa dön</button></div>}
      </section>
      <footer>© 2026 Entegre Ultra <span>İlk sürüm · Geliştirme aşamasında</span></footer>
    </main>

    {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Menüyü kapat"/>}
    {showAdd && <div className="modal-backdrop" onClick={() => setShowAdd(false)}><div className="modal" onClick={e => e.stopPropagation()}>
      <button className="modal-close" onClick={() => setShowAdd(false)}><X size={19}/></button>
      <h2>Hızlı işlem</h2><p>Başlamak istediğiniz bölümü seçin.</p>
      <button onClick={() => {setActive('Ürünler');setShowAdd(false);}}>Ürün yönetimine git</button>
      <button onClick={() => {setActive('Pazaryerleri');setShowAdd(false);}}>Pazaryerlerini görüntüle</button>
    </div></div>}
  </div>;
}

export default App;