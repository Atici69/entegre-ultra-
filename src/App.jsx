import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Storefront from './Storefront.jsx';
import XMLCenter from './XMLCenter.jsx';
import {
  LayoutDashboard, Package, ShoppingCart, Store, Users, CreditCard, FileCode2,
  Settings, Bell, Search, Plus, TrendingUp, Boxes, ArrowUpRight,
  Menu, X, ChevronDown, CircleHelp, Trash2, ClipboardList, Target, Megaphone, Network, Home
} from 'lucide-react';

const navItems = [
  { label: 'Ana Sayfa', icon: Home },
  { label: 'Genel Bakış', icon: LayoutDashboard },
  { label: 'Mağaza Vitrini', icon: Home },
  { label: 'XML Dönüştürme', icon: FileCode2 },
  { label: 'Ürünler', icon: Package },
  { label: 'Siparişler', icon: ShoppingCart },
  { label: 'Buybox', icon: Target },
  { label: 'Pazaryerleri', icon: Store },
  { label: 'Reklamlar', icon: Megaphone },
  { label: 'Müşteriler', icon: Users },
  { label: 'Abonelik', icon: CreditCard },
  { label: 'Bayi Yönetimi', icon: Network },
  { label: 'Ayarlar', icon: Settings }
];

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey && /^https:\/\//i.test(supabaseUrl) ? createClient(supabaseUrl, supabaseKey) : null;

const readLocal = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
};

function App() {
  const [active, setActive] = useState('Ana Sayfa');
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [products, setProducts] = useState(() => readLocal('eu_products'));
  const [customers, setCustomers] = useState(() => readLocal('eu_customers'));
  const [productForm, setProductForm] = useState({ name: '', sku: '', price: '', stock: '' });
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '' });
  const [formError, setFormError] = useState('');
  const [buyboxMode, setBuyboxMode] = useState(() => localStorage.getItem('eu_buybox_mode') || 'manual');
  const [minimumPrice, setMinimumPrice] = useState(() => localStorage.getItem('eu_buybox_min') || '');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSlot, setBannerSlot] = useState('Ana sayfa üst banner');
  const [banners, setBanners] = useState(() => readLocal('eu_banners'));
  const [dealerSession, setDealerSession] = useState(null);
  const [dealerEmail, setDealerEmail] = useState('');
  const [dealerPassword, setDealerPassword] = useState('');
  const [dealerRows, setDealerRows] = useState([]);
  const [dealerBusy, setDealerBusy] = useState(false);
  const [dealerError, setDealerError] = useState('');
  const [dealerNotice, setDealerNotice] = useState('');
  useEffect(() => { localStorage.setItem('eu_banners', JSON.stringify(banners)); }, [banners]);
  useEffect(() => { localStorage.setItem('eu_buybox_mode', buyboxMode); }, [buyboxMode]);
  useEffect(() => { localStorage.setItem('eu_buybox_min', minimumPrice); }, [minimumPrice]);
  const addBanner = (e) => { e.preventDefault(); if (!bannerTitle.trim()) return; setBanners(prev => [{ id: Date.now(), title: bannerTitle.trim(), slot: bannerSlot, active: true }, ...prev]); setBannerTitle(''); };

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

  const signInDealerAdmin = async (e) => { e.preventDefault(); setDealerError(''); setDealerNotice(''); if (!supabase) { setDealerError('Supabase ayarları bulunamadı. GitHub Actions secrets içindeki VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY değerlerini kontrol edin.'); return; } setDealerBusy(true); try { const { data, error } = await supabase.auth.signInWithPassword({ email: dealerEmail.trim(), password: dealerPassword }); if (error) throw error; const role = data.user?.app_metadata?.role; if (role !== 'admin') { await supabase.auth.signOut(); throw new Error('Bu hesap bayi başvurularını görüntüleme yetkisine sahip değil. Supabase kullanıcı app_metadata alanında role=admin olmalı.'); } setDealerSession(data.session); await loadDealerApplications(); } catch (err) { setDealerError(err.message || 'Yönetici girişi başarısız.'); } finally { setDealerBusy(false); } };
  const loadDealerApplications = async () => { if (!supabase) return; setDealerBusy(true); setDealerError(''); try { const { data, error } = await supabase.from('dealer_applications').select('id,name,company,phone,email,city,message,status,created_at').order('created_at', { ascending: false }); if (error) throw error; setDealerRows(data || []); } catch (err) { setDealerError(err.message || 'Başvurular yüklenemedi.'); } finally { setDealerBusy(false); } };
  const updateDealerStatus = async (id, status) => { if (!supabase) return; setDealerError(''); try { const { error } = await supabase.from('dealer_applications').update({ status }).eq('id', id); if (error) throw error; setDealerRows(rows => rows.map(row => row.id === id ? { ...row, status } : row)); setDealerNotice('Başvuru durumu güncellendi.'); } catch (err) { setDealerError(err.message || 'Durum güncellenemedi.'); } };
  const signOutDealerAdmin = async () => { if (supabase) await supabase.auth.signOut(); setDealerSession(null); setDealerRows([]); setDealerPassword(''); setDealerNotice(''); setDealerError(''); };

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
    'Ayarlar': 'Hesap, işletme ve güvenlik ayarları sonraki aşamada eklenecek.',
    'Bayi Yönetimi': 'Bayi, alt bayi, müşteri portföyü ve komisyon takibi için yönetim alanı.',
    'Buybox': 'Buybox analiz ve fiyatlandırma tercihlerinizi yönetin.',
    'Reklamlar': 'Banner alanlarını ve sponsorlu ürün kampanyalarını yönetin.'
  };

  return <div className="app-shell">
    <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
      <div className="brand">
        <div className="brand-mark">TE</div>
        <div><strong>Trend <span>Entegre</span></strong><small>YÖNETİM PANELİ</small></div>
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
      {active !== 'Ana Sayfa' && <header className="topbar">
        <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Menüyü aç"><Menu/></button>
        <div className="breadcrumb">Panel <span>/</span> {active}</div>
        <div className="top-actions">
          <label className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Panelde ara..."/></label>
          <button className="icon-button" aria-label="Bildirimler"><Bell size={19}/><i/></button>
          <div className="avatar">TE</div>
        </div>
      </header>}

      {active === 'Ana Sayfa' ? <iframe title="Trend Entegre ana sayfa" src="./trend-entegre-ana-sayfa.html" style={{width:"100%",height:"100vh",minHeight:"900px",border:0,display:"block",background:"#fff"}} /> : <section className="content">
        <div className="welcome-row">
          <div><p className="eyebrow">YÖNETİM MERKEZİ</p><h1>{active}</h1>
            <p className="subheading">Trend Entegre'ya hoş geldiniz. İşletmenizi tek panelden yönetin.</p></div>
          {(active === 'Ürünler' || active === 'Müşteriler') && <button className="primary-button" onClick={openAdd}><Plus size={18}/> Yeni kayıt</button>}
        </div>

        {active === 'Mağaza Vitrini' && <Storefront />}
        {active === 'XML Dönüştürme' && <XMLCenter />}

        {active === 'Bayi Yönetimi' && <div className="panel-card data-panel">
          <div className="panel-title"><div><h2>Bayi başvuruları</h2><p>Mağaza vitrini üzerinden gönderilen başvurular</p></div><Network size={20}/></div>
          {!dealerSession ? <form className="entry-form" onSubmit={signInDealerAdmin}>
            <p>Başvuruları görüntülemek için yönetici hesabınızla giriş yapın.</p>
            <label>Yönetici e-posta<input type="email" autoComplete="username" required value={dealerEmail} onChange={e => setDealerEmail(e.target.value)} placeholder="yonetici@ornek.com" /></label>
            <label>Şifre<input type="password" autoComplete="current-password" required value={dealerPassword} onChange={e => setDealerPassword(e.target.value)} placeholder="Supabase yönetici şifresi" /></label>
            {dealerError && <p className="form-error" role="alert">{dealerError}</p>}
            <button className="primary-button form-submit" type="submit" disabled={dealerBusy}>{dealerBusy ? 'Giriş yapılıyor...' : 'Yönetici girişi'}</button>
            <p className="muted-note">Güvenlik için başvurular yalnızca Supabase app_metadata alanında role=admin yetkisi bulunan hesaplara açılır.</p>
          </form> : <>
            <div className="section-heading"><div><h2>Başvuru listesi</h2><p>{dealerRows.length} kayıt</p></div><div className="button-row"><button className="secondary-button" onClick={loadDealerApplications} disabled={dealerBusy}>Yenile</button><button className="secondary-button" onClick={signOutDealerAdmin}>Çıkış yap</button></div></div>
            {dealerError && <p className="form-error" role="alert">{dealerError}</p>}{dealerNotice && <p className="notice-box" role="status">{dealerNotice}</p>}
            {dealerBusy ? <p>Başvurular yükleniyor...</p> : dealerRows.length === 0 ? <div className="empty-state compact"><div className="empty-icon"><ClipboardList size={26}/></div><h2>Henüz başvuru yok</h2><p>Yeni başvurular bu alanda listelenecek.</p></div> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Başvuru</th><th>İletişim</th><th>Şehir</th><th>Tarih</th><th>Durum</th></tr></thead><tbody>{dealerRows.map(row => <tr key={row.id}><td><strong>{row.name}</strong><br/><small>{row.company || 'Firma belirtilmedi'}</small>{row.message && <p>{row.message}</p>}</td><td>{row.phone}<br/><small>{row.email || 'E-posta yok'}</small></td><td>{row.city || '—'}</td><td>{new Date(row.created_at).toLocaleString('tr-TR')}</td><td><select className="wide-input" value={row.status} onChange={e => updateDealerStatus(row.id, e.target.value)}><option value="pending">Beklemede</option><option value="approved">Onaylandı</option><option value="rejected">Reddedildi</option></select></td></tr>)}</tbody></table></div>}
          </>}
        </div>}

        {active === 'Genel Bakış' && <>
          <div className="trial-banner">
            <div className="trial-icon"><TrendingUp size={21}/></div>
            <div><strong>Trend Entegre ilk sürüm</strong><p>Ürün ve müşteri kayıtları bu cihazda saklanır. Sunucu senkronizasyonu henüz etkin değil.</p></div>
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

        {active === 'Buybox' && <div className="buybox-layout">
          <div className="panel-card">
            <div className="panel-title"><div><h2>Fiyatlandırma tercihi</h2><p>Her mağaza kendi çalışma şeklini seçebilir</p></div><Target size={20}/></div>
            <div className="mode-grid">
              <button className={buyboxMode === 'manual' ? 'mode-card selected' : 'mode-card'} onClick={() => setBuyboxMode('manual')}><strong>Manuel / Öneri</strong><span>Rakip fiyatlarını incele, öneriyi gör ve fiyatı kendin güncelle.</span></button>
              <button className={buyboxMode === 'auto' ? 'mode-card selected' : 'mode-card'} onClick={() => setBuyboxMode('auto')}><strong>Otomatik fiyatlandırma</strong><span>Belirlediğin kurallara göre fiyat güncelleme modunu seç.</span></button>
            </div>
            <label className="field-label">Minimum satış fiyatı (TL)<input className="wide-input" type="number" min="0" step="0.01" value={minimumPrice} onChange={e => setMinimumPrice(e.target.value)} placeholder="Kâr sınırını korumak için alt limit"/></label>
            <div className="notice-box">{buyboxMode === 'auto' ? 'Otomatik mod seçildi. Gerçek fiyat güncellemesi için pazaryeri API bağlantısı ve açık kullanıcı onayı gerekir.' : 'Manuel mod seçildi. Fiyat önerileri kullanıcı onayı olmadan uygulanmaz.'}</div>
          </div>
          <div className="panel-card"><div className="panel-title"><div><h2>Buybox performansı</h2><p>API bağlantısı bekleniyor</p></div><TrendingUp size={20}/></div><div className="empty-state compact"><div className="empty-icon"><Target size={26}/></div><h2>Henüz veri yok</h2><p>Rakip fiyatı ve Buybox kazanma verileri pazaryeri bağlantısı yapıldığında görüntülenecek.</p></div></div>
        </div>}

        {active === 'Reklamlar' && <div className="panel-card data-panel">
          <div className="panel-title"><div><h2>Reklam ve banner alanları</h2><p>Mağaza vitrinindeki tanıtım yerlerini yönetin</p></div><Megaphone size={20}/></div>
          <form className="banner-form" onSubmit={addBanner}>
            <label className="field-label">Banner / kampanya adı<input className="wide-input" value={bannerTitle} onChange={e => setBannerTitle(e.target.value)} placeholder="Örn. Kasım fırsatları" required/></label>
            <label className="field-label">Gösterim alanı<select className="wide-input" value={bannerSlot} onChange={e => setBannerSlot(e.target.value)}><option>Ana sayfa üst banner</option><option>Ana sayfa alt banner</option><option>Kategori bannerı</option><option>Ürün detay sponsor alanı</option><option>Mobil vitrin bannerı</option></select></label>
            <button className="primary-button" type="submit"><Plus size={17}/> Banner alanı oluştur</button>
          </form>
          <div className="section-heading banner-heading"><div><h2>Tanımlı reklam alanları</h2><p>{banners.length} kampanya kaydı</p></div></div>
          {banners.length === 0 ? <div className="empty-state compact"><div className="empty-icon"><Megaphone size={26}/></div><h2>Henüz banner yok</h2><p>İlk reklam alanını yukarıdan oluşturun.</p></div> : <div className="banner-list">{banners.map(b => <div className="banner-row" key={b.id}><span className="banner-symbol"><Megaphone size={18}/></span><div><strong>{b.title}</strong><small>{b.slot}</small></div><button className="delete-button" onClick={() => setBanners(prev => prev.filter(x => x.id !== b.id))} aria-label="Banner kaydını sil"><Trash2 size={16}/></button></div>)}</div>}
          <p className="muted-note">Bu sürüm reklam alanı kayıtlarını cihazda tutar. Görsel yayınlama, zamanlama, gösterim ve tıklama ölçümü sonraki sunucu entegrasyonunda etkinleştirilecektir.</p>
        </div>}

        {active === 'Müşteriler' && <div className="panel-card data-panel">
          <div className="panel-title"><div><h2>Müşteri listesi</h2><p>{customers.length} müşteri kayıtlı</p></div><Users size={20}/></div>
          {filteredCustomers.length === 0 ? <div className="empty-state compact"><div className="empty-icon"><Users size={26}/></div><h2>{customers.length ? 'Sonuç bulunamadı' : 'Henüz müşteri yok'}</h2><p>{customers.length ? 'Arama kelimenizi değiştirin.' : 'İlk müşteri kaydınızı oluşturun.'}</p><button className="secondary-button" onClick={openAdd}>Müşteri ekle</button></div> :
            <div className="table-wrap"><table className="data-table"><thead><tr><th>Ad soyad / Firma</th><th>Telefon</th><th>E-posta</th><th></th></tr></thead><tbody>
              {filteredCustomers.map(c => <tr key={c.id}><td>{c.name}</td><td>{c.phone || '—'}</td><td>{c.email || '—'}</td><td><button className="delete-button" onClick={() => setCustomers(prev => prev.filter(x => x.id !== c.id))} aria-label="Müşteriyi sil"><Trash2 size={16}/></button></td></tr>)}
            </tbody></table></div>}
        </div>}

        {active !== 'Genel Bakış' && active !== 'Ürünler' && active !== 'Müşteriler' && active !== 'Buybox' && active !== 'Reklamlar' && active !== 'Bayi Yönetimi' && active !== 'XML Dönüştürme' && active !== 'Mağaza Vitrini' && active !== 'Ana Sayfa' && <div className="empty-state"><div className="empty-icon"><ClipboardList size={28}/></div><h2>{active}</h2><p>{titleCopy[active] || 'Bu bölüm sonraki geliştirme aşamasında açılacaktır.'}</p><button className="secondary-button" onClick={() => setActive('Genel Bakış')}>Genel bakışa dön</button></div>}
      </section>}
      <footer>© 2026 Trend Entegre <span>İlk sürüm · Geliştirme aşamasında</span></footer>
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
