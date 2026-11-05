import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, Store, Users, CreditCard,
  Settings, Bell, Search, Plus, TrendingUp, Boxes, ArrowUpRight,
  Menu, X, ChevronDown, CircleHelp, Trash2, ClipboardList
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

const readLocal = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
};

function App() {
  const [active, setActive] = useState('Genel Bakış');
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [products, setProducts] = useState(() => readLocal('eu_products'));
  const [customers, setCustomers] = useState(() => readLocal('eu_customers'));
  const [productForm, setProductForm] = useState({ name: '', sku: '', price: '', stock: '' });
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '' });
  const [formError, setFormError] = useState('');

  useEffect(() => { localStorage.setItem('eu_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('eu_customers', JSON.stringify(customers)); }, [customers]);

  const filteredProducts = useMemo(() => products.filter(p =>
    [p.name, p.sku].join(' ').toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr'))
  ), [products, search]);
  const filteredCustomers = useMemo(() => customers.filter(c =>
    [c.name, c.phone, c.email].join(' ').toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr'))
  ), [customers, search]);

  const addProduct = (e) => {
    e.preventDefault();
    if (!productForm.name.trim()) { setFormError('Ürün adı zorunludur.'); return; }
    setProducts(prev => [{ id: Date.now(), ...productForm, price: Number(productForm.price) || 0, stock: Number(productForm.stock) || 0 }, ...prev]);
    setProductForm({ name: '', sku: '', price: '', stock: '' });
    setFormError('');
    setShowAdd(false);
  };

  const addCustomer = (e) => {
    e.preventDefault();
    if (!customerForm.name.trim()) { setFormError('Müşteri adı zorunludur.'); return; }
    setCustomers(prev => [{ id: Date.now(), ...customerForm }, ...prev]);
    setCustomerForm({ name: '', phone: '', email: '' });
    setFormError('');
    setShowAdd(false);
  };

  const openAdd = () => {
    setFormError('');
    setShowAdd(true);
  };

  const stats = [
    { title: 'Toplam Ürün', value: String(products.length), note: 'Kayıtlı ürün', icon: Boxes },
    { title: 'Siparişler', value: '0', note: 'Sipariş modülü sıradaki aşamada', icon: ShoppingCart },
    { title: 'Müşteriler', value: String(customers.length), note: 'Kayıtlı müşteri', icon: Users },
    { title: 'Abonelik', value: 'Ücretsiz', note: 'Deneme paketi', icon: CreditCard }
  ];

  const titleCopy = {
    'Siparişler': 'Sipariş kayıtları ve durum takibi sonraki geliştirme aşamasında açılacak.',
    'Pazaryerleri': 'Pazaryeri bağlantıları için resmi API erişimleri ve mağaza yetkilendirmeleri gereklidir.',
    'Abonelik': 'Paket ve ödeme altyapısı henüz sunucuya bağlı değildir.',
    'Ayarlar': 'Hesap, işletme ve güvenlik ayarları sonraki aşamada eklenecek.'
  };

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
          onClick={() => { setActive(item.label); setSearch(''); setMenuOpen(false); }}>
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
          {(active === 'Ürünler' || active === 'Müşteriler') && <button className="primary-button" onClick={openAdd}><Plus size={18}/> Yeni kayıt</button>}
        </div>

        {active === 'Genel Bakış' && <>
          <div className="trial-banner">
            <div className="trial-icon"><TrendingUp size={21}/></div>
            <div><strong>Entegre Ultra ilk sürüm</strong><p>Ürün ve müşteri kayıtları bu cihazda saklanır. Sunucu senkronizasyonu henüz etkin değil.</p></div>
            <button onClick={() => setActive('Ürünler')}>Ürün ekle <ArrowUpRight size={16}/></button>
          </div>
          <div className="section-heading"><div><h2>Genel durum</h2><p>Mağazanızın güncel özeti</p></div><span className="date-chip">Yerel kayıtlar</span></div>
          <div className="stats-grid">{stats.map((stat) => {
            const Icon = stat.icon;
            return <article className="stat-card" key={stat.title}>
              <div className="stat-top"><span>{stat.title}</span><div className="stat-icon"><Icon size={19}/></div></div>
              <strong>{stat.value}</strong><small>{stat.note}</small>
            </article>;
          })}</div>
          <div className="lower-grid">
            <article className="panel-card"><div className="panel-title"><div><h2>Ürün yönetimi</h2><p>Ürün ve stok kayıtlarını oluşturun</p></div><Package size={20}/></div>
              <div className="guide-list"><div><b>1</b><span><strong>Ürün ekleyin</strong><small>Ürün adı, stok kodu, fiyat ve stok miktarı</small></span></div>
                <div><b>2</b><span><strong>Kayıtları düzenli tutun</strong><small>Eklediğiniz ürünler cihazınızda saklanır</small></span></div></div>
              <button className="secondary-button" onClick={() => setActive('Ürünler')}>Ürünlere git</button>
            </article>
            <article className="panel-card"><div className="panel-title"><div><h2>Müşteri yönetimi</h2><p>Müşteri iletişim kayıtları</p></div><Users size={20}/></div>
              <div className="guide-list"><div><b>1</b><span><strong>Müşteri kaydı oluşturun</strong><small>Ad, telefon ve e-posta bilgileri</small></span></div>
                <div><b>2</b><span><strong>Kayıtları arayın</strong><small>Üstteki arama alanını kullanın</small></span></div></div>
              <button className="secondary-button" onClick={() => setActive('Müşteriler')}>Müşterilere git</button>
            </article>
          </div>
        </>}

        {active === 'Ürünler' && <div className="panel-card data-panel">
          <div className="panel-title"><div><h2>Ürün kataloğu</h2><p>{products.length} ürün kayıtlı</p></div><Package size={20}/></div>
          {filteredProducts.length === 0 ? <div className="empty-state compact"><div className="empty-icon"><Package size={26}/></div><h2>{products.length ? 'Sonuç bulunamadı' : 'Henüz ürün yok'}</h2><p>{products.length ? 'Arama kelimenizi değiştirin.' : 'İlk ürününüzü ekleyerek kataloğunuzu oluşturmaya başlayın.'}</p><button className="secondary-button" onClick={openAdd}>Ürün ekle</button></div> :
            <div className="table-wrap"><table className="data-table"><thead><tr><th>Ürün adı</th><th>Stok kodu</th><th>Fiyat</th><th>Stok</th><th></th></tr></thead><tbody>
              {filteredProducts.map(p => <tr key={p.id}><td>{p.name}</td><td>{p.sku || '—'}</td><td>{p.price.toLocaleString('tr-TR', {style:'currency',currency:'TRY'})}</td><td>{p.stock}</td><td><button className="delete-button" onClick={() => setProducts(prev => prev.filter(x => x.id !== p.id))} aria-label="Ürünü sil"><Trash2 size={16}/></button></td></tr>)}
            </tbody></table></div>}
        </div>}

        {active === 'Müşteriler' && <div className="panel-card data-panel">
          <div className="panel-title"><div><h2>Müşteri listesi</h2><p>{customers.length} müşteri kayıtlı</p></div><Users size={20}/></div>
          {filteredCustomers.length === 0 ? <div className="empty-state compact"><div className="empty-icon"><Users size={26}/></div><h2>{customers.length ? 'Sonuç bulunamadı' : 'Henüz müşteri yok'}</h2><p>{customers.length ? 'Arama kelimenizi değiştirin.' : 'İlk müşteri kaydınızı oluşturun.'}</p><button className="secondary-button" onClick={openAdd}>Müşteri ekle</button></div> :
            <div className="table-wrap"><table className="data-table"><thead><tr><th>Ad soyad / Firma</th><th>Telefon</th><th>E-posta</th><th></th></tr></thead><tbody>
              {filteredCustomers.map(c => <tr key={c.id}><td>{c.name}</td><td>{c.phone || '—'}</td><td>{c.email || '—'}</td><td><button className="delete-button" onClick={() => setCustomers(prev => prev.filter(x => x.id !== c.id))} aria-label="Müşteriyi sil"><Trash2 size={16}/></button></td></tr>)}
            </tbody></table></div>}
        </div>}

        {active !== 'Genel Bakış' && active !== 'Ürünler' && active !== 'Müşteriler' && <div className="empty-state"><div className="empty-icon"><ClipboardList size={28}/></div><h2>{active}</h2><p>{titleCopy[active] || 'Bu bölüm sonraki geliştirme aşamasında açılacaktır.'}</p><button className="secondary-button" onClick={() => setActive('Genel Bakış')}>Genel bakışa dön</button></div>}
      </section>
      <footer>© 2026 Entegre Ultra <span>İlk sürüm · Geliştirme aşamasında</span></footer>
    </main>

    {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Menüyü kapat"/>}
    {showAdd && <div className="modal-backdrop" onClick={() => setShowAdd(false)}><div className="modal" onClick={e => e.stopPropagation()}>
      <button className="modal-close" onClick={() => setShowAdd(false)} aria-label="Kapat"><X size={19}/></button>
      {active === 'Ürünler' ? <>
        <h2>Yeni ürün</h2><p>Ürün bilgilerini girin. Kayıt bu cihazda saklanacaktır.</p>
        <form className="entry-form" onSubmit={addProduct}>
          <label>Ürün adı<input autoFocus value={productForm.name} onChange={e => setProductForm({...productForm,name:e.target.value})} placeholder="Örn. Ürün adı" /></label>
          <label>Stok kodu<input value={productForm.sku} onChange={e => setProductForm({...productForm,sku:e.target.value})} placeholder="SKU (isteğe bağlı)" /></label>
          <div className="form-two"><label>Fiyat (TL)<input type="number" min="0" step="0.01" value={productForm.price} onChange={e => setProductForm({...productForm,price:e.target.value})} placeholder="0,00" /></label>
          <label>Stok adedi<input type="number" min="0" step="1" value={productForm.stock} onChange={e => setProductForm({...productForm,stock:e.target.value})} placeholder="0" /></label></div>
          {formError && <p className="form-error">{formError}</p>}<button className="primary-button form-submit" type="submit">Ürünü kaydet</button>
        </form>
      </> : <>
        <h2>Yeni müşteri</h2><p>Müşteri iletişim bilgilerini girin.</p>
        <form className="entry-form" onSubmit={addCustomer}>
          <label>Ad soyad / Firma<input autoFocus value={customerForm.name} onChange={e => setCustomerForm({...customerForm,name:e.target.value})} placeholder="Ad veya firma adı" /></label>
          <label>Telefon<input type="tel" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm,phone:e.target.value})} placeholder="05xx xxx xx xx" /></label>
          <label>E-posta<input type="email" value={customerForm.email} onChange={e => setCustomerForm({...customerForm,email:e.target.value})} placeholder="ornek@firma.com" /></label>
          {formError && <p className="form-error">{formError}</p>}<button className="primary-button form-submit" type="submit">Müşteriyi kaydet</button>
        </form>
      </>}
    </div></div>}
  </div>;
}

export default App;
