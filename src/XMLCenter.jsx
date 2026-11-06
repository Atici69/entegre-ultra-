import React, { useMemo, useRef, useState } from 'react';
import { FileCode2, Upload, Link2, Download, RefreshCw, CheckCircle2, AlertCircle, Boxes } from 'lucide-react';

const FIELD_ALIASES = {
  name: ['name','title','productname','product_name','urunadi','urun_adi','baslik'],
  sku: ['sku','stockcode','stock_code','model','productcode','product_code','stok_kodu','kod'],
  barcode: ['barcode','gtin','ean','barkod'],
  price: ['price','saleprice','sale_price','listprice','amount','fiyat','satisfiyati'],
  stock: ['stock','quantity','qty','inventory','stok','adet','miktar'],
  image: ['image','imageurl','image_url','picture','img','gorsel','resim'],
  description: ['description','shortdescription','details','aciklama','urunaciklama']
};
const LABELS = { name:'Ürün adı', sku:'Stok kodu', barcode:'Barkod', price:'Fiyat', stock:'Stok', image:'Görsel URL', description:'Açıklama' };
const MARKETPLACES = ['Trendyol','Hepsiburada','N11','Amazon','OZON'];
const normalize = (s='') => String(s).toLocaleLowerCase('tr').replace(/[^a-z0-9_]/g,'');
const csvCell = value => '"' + String(value ?? '').replace(/"/g,'""') + '"';

function parseProducts(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) throw new Error('XML dosyası okunamadı. XML biçimini kontrol edin.');
  const candidates = [...doc.getElementsByTagName('*')].filter(el =>
    el.children.length > 0 && [...el.children].some(child => ['name','title','productname','urunadi','urun_adi'].includes(normalize(child.localName)))
  );
  const rows = candidates.filter(el => !candidates.some(parent => parent !== el && parent.contains(el) && candidates.includes(parent)));
  const productNodes = rows.length ? rows : [...doc.getElementsByTagName('*')].filter(el => {
    const keys = [...el.children].map(child => normalize(child.localName));
    return keys.some(k => FIELD_ALIASES.name.includes(k)) && keys.some(k => FIELD_ALIASES.price.includes(k));
  });
  if (!productNodes.length) throw new Error('Ürün kayıtları bulunamadı. XML içinde ürün adı ve fiyat alanları aranıyor.');
  return productNodes.slice(0,10000).map((node,index) => {
    const values = {};
    for (const field of Object.keys(FIELD_ALIASES)) {
      const child = [...node.children].find(el => FIELD_ALIASES[field].includes(normalize(el.localName)));
      values[field] = child ? (field === 'image' ? (child.textContent.trim() || child.getAttribute('url') || '') : child.textContent.trim()) : '';
    }
    if (!values.name) values.name = node.getAttribute('name') || 'Ürün ' + (index+1);
    return { id:index+1, ...values };
  }).filter(row => row.name || row.sku || row.barcode);
}

export default function XMLCenter() {
  const [xmlText,setXmlText] = useState('');
  const [fileName,setFileName] = useState('');
  const [products,setProducts] = useState([]);
  const [marketplace,setMarketplace] = useState('Trendyol');
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const fileRef = useRef(null);
  const [mapping,setMapping] = useState({ name:'name',sku:'sku',barcode:'barcode',price:'price',stock:'stock',image:'image',description:'description' });
  const parse = (text) => {
    setError(''); setNotice('');
    try { const result=parseProducts(text); setProducts(result); setXmlText(text); setNotice(result.length+' ürün başarıyla okundu.'); }
    catch(e) { setProducts([]); setError(e.message || 'XML okunamadı.'); }
  };
  const onFile = async e => {
    const file=e.target.files?.[0]; if(!file) return;
    if(file.size > 15*1024*1024) { setError('Dosya boyutu 15 MB sınırını aşamaz.'); return; }
    setFileName(file.name); parse(await file.text());
  };
  const columns = useMemo(() => Object.keys(LABELS),[]);
  const output = useMemo(() => products.map(p => columns.reduce((acc,key) => ({...acc,[mapping[key]]:p[key]}),{})),[products,mapping,columns]);
  const exportCsv = () => {
    if(!products.length) return;
    const header=columns.map(k=>LABELS[k]);
    const lines=[header.map(csvCell).join(','),...output.map(row=>columns.map(k=>csvCell(row[mapping[k]]||'')).join(','))];
    const blob=new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='entegre-ultra-'+marketplace.toLocaleLowerCase('tr')+'-urunler.csv'; a.click(); URL.revokeObjectURL(url);
    setNotice(marketplace+' için CSV dosyası hazırlandı. Bu çıktı doğrudan API yayını değildir; pazaryeri şablonuna göre son alan eşleştirmesi gerekebilir.');
  };
  return <div className="xml-center">
    <div className="xml-intro panel-card"><div className="xml-icon"><FileCode2 size={24}/></div><div><span className="eyebrow">ÜRÜN VERİ AKTARIMI</span><h2>XML Dönüştürme Merkezi</h2><p>Tedarikçi XML dosyanızı yükleyin, ürün alanlarını kontrol edin ve seçtiğiniz kanal için CSV çıktısı alın.</p></div></div>
    <div className="xml-grid">
      <section className="panel-card"><div className="panel-title"><div><h2>1. XML kaynağını ekleyin</h2><p>XML dosyası yükleyin veya içeriğini yapıştırın.</p></div><Upload size={20}/></div>
        <button type="button" className="xml-upload" onClick={()=>fileRef.current?.click()}><Upload size={20}/><b>{fileName || 'XML dosyası seç'}</b><small>En fazla 15 MB · .xml</small></button><input ref={fileRef} type="file" accept=".xml,text/xml,application/xml" hidden onChange={onFile}/>
        <label className="field-label">XML içeriği<textarea className="xml-textarea" value={xmlText} onChange={e=>setXmlText(e.target.value)} placeholder={'<products>\n  <product>\n    <name>Örnek ürün</name>\n    <price>199.90</price>\n  </product>\n</products>'}/></label>
        <button className="primary-button xml-parse" type="button" onClick={()=>parse(xmlText)} disabled={!xmlText.trim()}><RefreshCw size={16}/> XML dosyasını oku</button>
        <div className="notice-box">XML bağlantısını doğrudan URL üzerinden çekme, tedarikçi sunucusunun CORS izinleri veya güvenli sunucu aracısı gerektirir. Bu ilk aşamada dosya yükleme ve XML yapıştırma etkin.</div>
      </section>
      <section className="panel-card"><div className="panel-title"><div><h2>2. Hedef kanalı seçin</h2><p>Ürün verilerinizin dışa aktarım hedefi.</p></div><Boxes size={20}/></div>
        <label className="field-label">Pazaryeri<select className="wide-input" value={marketplace} onChange={e=>setMarketplace(e.target.value)}>{MARKETPLACES.map(m=><option key={m}>{m}</option>)}</select></label>
        <div className="xml-map-title">ALAN EŞLEŞTİRME</div>
        {columns.map(key=><label className="xml-map-row" key={key}><span>{LABELS[key]}</span><select className="wide-input" value={mapping[key]} onChange={e=>setMapping(prev=>({...prev,[key]:e.target.value}))}>{columns.map(col=><option key={col} value={col}>{LABELS[col]}</option>)}</select></label>)}
        <button className="primary-button xml-export" type="button" onClick={exportCsv} disabled={!products.length}><Download size={16}/> {marketplace} CSV çıktısı indir</button>
      </section>
    </div>
    {error && <div className="xml-alert error"><AlertCircle size={17}/>{error}</div>}
    {notice && <div className="xml-alert success"><CheckCircle2 size={17}/>{notice}</div>}
    <section className="panel-card xml-results"><div className="panel-title"><div><h2>3. Okunan ürünler</h2><p>{products.length.toLocaleString('tr-TR')} ürün · ilk 10.000 kayıt gösterilebilir</p></div><Boxes size={20}/></div>
      {!products.length ? <div className="empty-state compact"><div className="empty-icon"><FileCode2 size={26}/></div><h2>Henüz XML yüklenmedi</h2><p>XML dosyanızı eklediğinizde ürünler burada listelenecek.</p></div> :
      <div className="table-wrap"><table className="data-table"><thead><tr>{columns.slice(0,6).map(k=><th key={k}>{LABELS[k]}</th>)}</tr></thead><tbody>{products.slice(0,100).map(p=><tr key={p.id}><td>{p.name||'—'}</td><td>{p.sku||'—'}</td><td>{p.barcode||'—'}</td><td>{p.price||'—'}</td><td>{p.stock||'—'}</td><td>{p.image?<a href={p.image} target="_blank" rel="noreferrer">Görsel</a>:'—'}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
