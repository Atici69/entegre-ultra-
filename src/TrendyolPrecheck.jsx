import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, ClipboardCheck, AlertCircle, CheckCircle2, Boxes } from 'lucide-react';
import { getXmlSource, listXmlSources } from './xmlSources.js';

const requiredFields = [
  ['name', 'Ürün adı'],
  ['barcode', 'Barkod'],
  ['category', 'Kategori'],
  ['price', 'Fiyat'],
  ['stock', 'Stok'],
  ['image', 'Görsel URL']
];

export default function TrendyolPrecheck() {
  const [sources, setSources] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refreshSources = async (preferredId = '') => {
    setLoading(true);
    setError('');
    try {
      const rows = await listXmlSources();
      rows.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      setSources(rows);
      const nextId = preferredId && rows.some(row => row.id === preferredId)
        ? preferredId
        : (selectedId && rows.some(row => row.id === selectedId) ? selectedId : '');
      setSelectedId(nextId);
      if (nextId) {
        const source = await getXmlSource(nextId);
        setProducts(source?.products || []);
      } else {
        setProducts([]);
      }
    } catch (err) {
      setError(err?.message || 'XML kaynakları okunamadı.');
      setSources([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshSources(); }, []);

  const selectSource = async (id) => {
    setSelectedId(id);
    setError('');
    setNotice('');
    if (!id) { setProducts([]); return; }
    try {
      const source = await getXmlSource(id);
      setProducts(source?.products || []);
      setNotice(source ? source.products.length.toLocaleString('tr-TR') + ' ürün yüklendi.' : '');
    } catch (err) {
      setProducts([]);
      setError(err?.message || 'Seçilen XML kaynağı açılamadı.');
    }
  };

  const checked = useMemo(() => products.map((product, index) => {
    const missing = requiredFields.filter(([key]) => {
      const value = product?.[key];
      return value === undefined || value === null || String(value).trim() === '';
    }).map(([, label]) => label);
    if (product?.price !== undefined && product?.price !== null && String(product.price).trim() !== '' && (!Number.isFinite(Number(product.price)) || Number(product.price) <= 0)) missing.push('Geçerli fiyat');
    if (product?.stock !== undefined && product?.stock !== null && String(product.stock).trim() !== '' && (!Number.isFinite(Number(product.stock)) || Number(product.stock) < 0)) missing.push('Geçerli stok');
    return { ...product, _row: index + 1, _missing: missing };
  }), [products]);

  const duplicateBarcodes = useMemo(() => {
    const counts = new Map();
    checked.forEach(product => {
      const barcode = String(product.barcode || '').trim();
      if (barcode) counts.set(barcode, (counts.get(barcode) || 0) + 1);
    });
    return new Set([...counts].filter(([, count]) => count > 1).map(([barcode]) => barcode));
  }, [checked]);

  const invalidCount = checked.filter(product => product._missing.length || duplicateBarcodes.has(String(product.barcode || '').trim())).length;
  const validCount = checked.length - invalidCount;

  return <div className="panel-card data-panel">
    <div className="panel-title"><div><h2>Trendyol aktarım ön kontrolü</h2><p>Seçtiğiniz XML kaynağındaki ürünleri kontrol eder. Bu işlem mağazanıza ürün göndermez.</p></div><ClipboardCheck size={20}/></div>
    <label className="field-label">XML kaynağı
      <select className="wide-input" value={selectedId} onChange={e => selectSource(e.target.value)} disabled={loading}>
        <option value="">Kaynak seçin</option>
        {sources.map(source => <option key={source.id} value={source.id}>{source.name} · {Number(source.productCount || source.products?.length || 0).toLocaleString('tr-TR')} ürün</option>)}
      </select>
    </label>
    <div className="button-row" style={{marginTop:12}}>
      <button className="secondary-button" type="button" onClick={() => refreshSources(selectedId)} disabled={loading}><RefreshCw size={16}/> Kaynakları yenile</button>
    </div>
    {loading && <div className="notice-box">Kayıtlı XML kaynakları yükleniyor…</div>}
    {error && <div className="xml-alert error"><AlertCircle size={17}/>{error}</div>}
    {notice && <div className="xml-alert success"><CheckCircle2 size={17}/>{notice}</div>}
    {!loading && !sources.length && !error && <div className="empty-state compact"><div className="empty-icon"><Boxes size={26}/></div><h2>Kayıtlı XML kaynağı bulunamadı</h2><p>XML Dönüştürme bölümünden XML dosyanı yükle ve “Kaynak olarak kaydet” düğmesine bas. Kaynak burada otomatik görünecek.</p></div>}
    {selectedId && products.length > 0 && <>
      <div className="stats-grid" style={{marginTop:16}}>
        <article className="stat-card"><span>Toplam ürün</span><strong>{checked.length.toLocaleString('tr-TR')}</strong></article>
        <article className="stat-card"><span>Kontrolden geçen</span><strong>{validCount.toLocaleString('tr-TR')}</strong></article>
        <article className="stat-card"><span>Eksik / hatalı</span><strong>{invalidCount.toLocaleString('tr-TR')}</strong></article>
      </div>
      <div className="notice-box" style={{marginTop:14}}>Bu kontrol temel ürün alanlarını ve aynı barkodun birden fazla kullanımını denetler. Trendyol kategori/özellik eşleştirmesi ve canlı API doğrulaması ayrıca gerekir. Buradan ürün gönderilmez.</div>
      <div className="table-wrap" style={{marginTop:14}}><table className="data-table">
        <thead><tr><th>#</th><th>Ürün</th><th>Barkod</th><th>Fiyat</th><th>Kontrol sonucu</th></tr></thead>
        <tbody>{checked.slice(0,200).map(product => {
          const duplicate = duplicateBarcodes.has(String(product.barcode || '').trim());
          const problems = [...product._missing, ...(duplicate ? ['Tekrarlanan barkod'] : [])];
          return <tr key={product.id || product._row}>
            <td>{product._row}</td><td>{product.name || '—'}</td><td>{product.barcode || '—'}</td><td>{product.price || '—'}</td>
            <td>{problems.length ? <span className="form-error">{problems.join(', ')}</span> : <span className="notice-box">Hazır</span>}</td>
          </tr>;
        })}</tbody>
      </table></div>
      {checked.length > 200 && <p className="muted-note">Tabloda ilk 200 ürün gösteriliyor; özet tüm {checked.length.toLocaleString('tr-TR')} ürünü kapsar.</p>}
    </>}
  </div>;
}
