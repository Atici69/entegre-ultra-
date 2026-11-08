import React, { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { FileCode2, Upload, Download, RefreshCw, CheckCircle2, AlertCircle, Boxes, FileSpreadsheet } from 'lucide-react';

const FIELD_ALIASES = {
  name: ['name','title','productname','product_name','urunadi','urun_adi','baslik','ürünadı','ürün_adi'],
  sku: ['sku','stockcode','stock_code','model','productcode','product_code','stok_kodu','kod'],
  barcode: ['barcode','gtin','ean','barkod'],
  category: ['category','categoryname','category_name','kategori','kategor adi','urun_kategorisi','ürün_kategorisi'],
  price: ['price','saleprice','sale_price','listprice','amount','fiyat','satisfiyati','satışfiyatı','satis_fiyati'],
  stock: ['stock','quantity','qty','inventory','stok','adet','miktar','stok_adedi'],
  image: ['image','imageurl','image_url','picture','img','gorsel','resim','görsel'],
  description: ['description','shortdescription','details','aciklama','urunaciklama','açıklama']
};
const LABELS = { name:'Ürün adı', sku:'Stok kodu', barcode:'Barkod', category:'Kategori', price:'Fiyat', stock:'Stok', image:'Görsel URL', description:'Açıklama' };
const MARKETPLACES = ['Trendyol','Hepsiburada','N11','Amazon','OZON'];
const normalize = (s='') => String(s).toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_]/g,'');
const xmlEscape = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');

function parseProducts(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('XML dosyası okunamadı. XML biçimini kontrol edin.');
  const nodes = [...doc.getElementsByTagName('*')].filter(el => {
    const keys = [...el.children].map(child => normalize(child.localName));
    return el.children.length > 0 && keys.some(k => FIELD_ALIASES.name.includes(k) || FIELD_ALIASES.sku.includes(k) || FIELD_ALIASES.barcode.includes(k));
  }).filter(el => ![...el.children].some(child => child.children.length > 0 && [...child.children].some(grand => FIELD_ALIASES.name.includes(normalize(grand.localName)) || FIELD_ALIASES.sku.includes(normalize(grand.localName)))));
  if (!nodes.length) throw new Error('Ürün kayıtları bulunamadı. Ürün adı veya stok kodu/barkod alanları aranıyor.');
  return nodes.slice(0,10000).map((node,index) => {
    const values = {};
    for (const field of Object.keys(FIELD_ALIASES)) {
      const child = [...node.children].find(el => FIELD_ALIASES[field].includes(normalize(el.localName)));
      values[field] = child ? (field === 'image' ? (child.textContent.trim() || child.getAttribute('url') || '') : child.textContent.trim()) : '';
    }
    if (!values.name) values.name = values.sku || values.barcode || 'Ürün ' + (index+1);
    return { id:index+1, ...values };
  });
}
function parseSheet(buffer) {
  const workbook = XLSX.read(buffer, { type:'array', cellDates:false });
  const first = workbook.Sheets[workbook.SheetNames[0]];
  if (!first) throw new Error('Excel dosyasında okunabilir çalışma sayfası bulunamadı.');
  const rows = XLSX.utils.sheet_to_json(first, { header:1, defval:'', raw:false, blankrows:false });
  if (rows.length < 2) throw new Error('Excel dosyasında başlık satırı ve en az bir ürün satırı bulunmalı.');
  const headers = rows[0].map(normalize);
  const indexes = {};
  for (const field of Object.keys(FIELD_ALIASES)) indexes[field] = headers.findIndex(h => FIELD_ALIASES[field].includes(h));
  const hasProductField = indexes.name >= 0 || indexes.sku >= 0 || indexes.barcode >= 0;
  if (!hasProductField) throw new Error('Excel başlıklarında ürün adı, stok kodu veya barkod bulunamadı.');
  return rows.slice(1,10001).map((row,index) => {
    const item = { id:index+1 };
    for (const field of Object.keys(FIELD_ALIASES)) item[field] = indexes[field] >= 0 ? String(row[indexes[field]] ?? '').trim() : '';
    if (!item.name) item.name = item.sku || item.barcode || 'Ürün ' + (index+1);
    return item;
  }).filter(p => p.name || p.sku || p.barcode);
}

export default function XMLCenter() {
  const [xmlText,setXmlText] = useState('');
  const [fileName,setFileName] = useState('');
  const [products,setProducts] = useState([]);
  const [marketplace,setMarketplace] = useState('Trendyol');
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [limit,setLimit] = useState('all');
  const [pricePercent,setPricePercent] = useState('0');
  const fileRef = useRef(null);
  const excelRef = useRef(null);
  const [mapping,setMapping] = useState({ name:'name',sku:'sku',barcode:'barcode',category:'category',price:'price',stock:'stock',image:'image',description:'description' });
  const columns = useMemo(() => Object.keys(LABELS),[]);
  const selectedProducts = useMemo(() => {
    const count = limit === 'all' ? products.length : Number(limit);
    const pct = Number(pricePercent) || 0;
    return products.slice(0,count).map(p => ({ ...p, price: p.price !== '' && Number.isFinite(Number(p.price)) ? (Number(p.price) * (1 + pct/100)).toFixed(2) : p.price }));
  },[products,limit,pricePercent]);
  const output = useMemo(() => selectedProducts.map(p => columns.reduce((acc,key) => ({...acc,[mapping[key]]:p[key]}),{})),[selectedProducts,mapping,columns]);
  const downloadBlob = (blob, filename) => { const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); };
  const parse = text => {
    setError(''); setNotice('');
    try { const result=parseProducts(text); setProducts(result); setXmlText(text); setLimit('all'); setNotice(result.length+' ürün XML dosyasından okundu.'); }
    catch(e) { setProducts([]); setError(e.message || 'XML okunamadı.'); }
  };
  const onXmlFile = async e => {
    const file=e.target.files?.[0]; if(!file) return;
    if(file.size > 15*1024*1024) { setError('Dosya boyutu 15 MB sınırını aşamaz.'); return; }
    setFileName(file.name); parse(await file.text()); e.target.value='';
  };
  const onExcelFile = async e => {
    const file=e.target.files?.[0]; if(!file) return;
    setError(''); setNotice('');
    if(file.size > 15*1024*1024) { setError('Dosya boyutu 15 MB sınırını aşamaz.'); e.target.value=''; return; }
    try {
      const result=parseSheet(await file.arrayBuffer());
      setProducts(result); setFileName(file.name); setXmlText(''); setLimit('all');
      setNotice(file.name+' dosyasından '+result.length+' ürün okundu. XML oluşturabilirsiniz.');
    } catch(err) { setProducts([]); setError(err.message || 'Excel dosyası okunamadı.'); }
    e.target.value='';
  };
  const buildXml = () => {
    if(!selectedProducts.length) return;
    const rows = selectedProducts.map(p => '<product>'+columns.map(key => '<'+key+'>'+xmlEscape(p[key])+'</'+key+'>').join('')+'</product>').join('');
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<products>'+rows+'</products>';
    downloadBlob(new Blob([xml],{type:'application/xml;charset=utf-8;'}),'entegre-ultra-'+marketplace.toLocaleLowerCase('tr')+'-urunler.xml');
    setNotice(selectedProducts.length+' ürün XML dosyasına dönüştürüldü ve indirildi.');
  };
  const exportExcel = () => {
    if(!selectedProducts.length) return;
    const data = [columns.map(k=>LABELS[k]),...output.map(row=>columns.map(k=>row[mapping[k]] ?? ''))];
    const sheet = XLSX.utils.aoa_to_sheet(data);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book,sheet,'Ürünler');
    XLSX.writeFile(book,'entegre-ultra-urunler.xlsx');
    setNotice(selectedProducts.length+' ürün gerçek XLSX çalışma kitabına aktarıldı.');
  };
  const exportCsv = () => {
    if(!selectedProducts.length) return;
    const csv = [columns.map(k=>LABELS[k]),...output.map(row=>columns.map(k=>row[mapping[k]] ?? ''))].map(row=>row.map(v=>'"'+String(v ?? '').replace(/"/g,'""')+'"').join(',')).join('\r\n');
    downloadBlob(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'}),'entegre-ultra-'+marketplace.toLocaleLowerCase('tr')+'-urunler.csv');
    setNotice('CSV dosyası hazırlandı.');
  };
  return <div className="xml-center">
    <div className="xml-intro panel-card"><div className="xml-icon"><FileCode2 size={24}/></div><div><span className="eyebrow">ÜRÜN VERİ AKTARIMI</span><h2>XML Ürün Merkezi</h2><p>XML veya Excel dosyanızı yükleyin; ürünleri seçin, fiyatları düzenleyin ve XML çıktısı oluşturun.</p></div></div>
    <div className="xml-grid">
      <section className="panel-card"><div className="panel-title"><div><h2>1. Dosyanızı yükleyin</h2><p>XML veya Excel/CSV dosyası seçebilirsiniz.</p></div><Upload size={20}/></div>
        <button type="button" className="xml-upload" onClick={()=>fileRef.current?.click()}><Upload size={20}/><b>XML dosyası seç</b><small>En fazla 15 MB · .xml</small></button>
        <input ref={fileRef} type="file" accept=".xml,text/xml,application/xml" hidden onChange={onXmlFile}/>
        <button type="button" className="xml-upload" onClick={()=>excelRef.current?.click()}><FileSpreadsheet size={20}/><b>Excel'i XML'e dönüştür</b><small>En fazla 15 MB · .xlsx, .xls, .csv</small></button>
        <input ref={excelRef} type="file" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" hidden onChange={onExcelFile}/>
        {fileName && <div className="notice-box">Seçilen dosya: {fileName}</div>}
        <label className="field-label">XML içeriği<textarea className="xml-textarea" value={xmlText} onChange={e=>setXmlText(e.target.value)} placeholder={'<products>\n  <product>\n    <name>Örnek ürün</name>\n    <price>199.90</price>\n  </product>\n</products>'}/></label>
        <button className="primary-button xml-parse" type="button" onClick={()=>parse(xmlText)} disabled={!xmlText.trim()}><RefreshCw size={16}/> XML içeriğini oku</button>
        <div className="notice-box">Excel başlıkları ürün adı, stok kodu, barkod, kategori, fiyat, stok, görsel ve açıklama alanlarıyla otomatik eşleştirilir. Bulunamayan alanlar boş bırakılır.</div>
      </section>
      <section className="panel-card"><div className="panel-title"><div><h2>2. Dönüşüm ayarları</h2><p>Ürün adedini ve fiyat kuralını belirleyin.</p></div><Boxes size={20}/></div>
        <label className="field-label">Hedef pazaryeri<select className="wide-input" value={marketplace} onChange={e=>setMarketplace(e.target.value)}>{MARKETPLACES.map(m=><option key={m}>{m}</option>)}</select></label>
        <label className="field-label">Dönüştürülecek ürün sayısı<select className="wide-input" value={limit} onChange={e=>setLimit(e.target.value)}><option value="10">İlk 10 ürün</option><option value="30">İlk 30 ürün</option><option value="100">İlk 100 ürün</option><option value="all">Tüm ürünler ({products.length})</option></select></label>
        <label className="field-label">Fiyat değişimi (%)<input className="wide-input" type="number" step="0.1" value={pricePercent} onChange={e=>setPricePercent(e.target.value)} placeholder="Örn. 15 veya -5"/></label>
        <div className="notice-box">{Number(pricePercent)>0 ? 'Fiyatlar yüzde '+pricePercent+' artırılarak çıktıya uygulanır.' : Number(pricePercent)<0 ? 'Fiyatlar yüzde '+Math.abs(Number(pricePercent))+' azaltılarak çıktıya uygulanır.' : 'Fiyatlar mevcut değerleriyle korunur.'}</div>
        <div className="xml-map-title">ALAN EŞLEŞTİRME</div>
        {columns.map(key=><label className="xml-map-row" key={key}><span>{LABELS[key]}</span><select className="wide-input" value={mapping[key]} onChange={e=>setMapping(prev=>({...prev,[key]:e.target.value}))}>{columns.map(col=><option key={col} value={col}>{LABELS[col]}</option>)}</select></label>)}
        <div className="xml-export-actions"><button className="primary-button xml-export" type="button" onClick={buildXml} disabled={!selectedProducts.length}><Download size={16}/> XML indir</button><button className="secondary-button xml-export" type="button" onClick={exportExcel} disabled={!selectedProducts.length}><Download size={16}/> XLSX indir</button><button className="secondary-button xml-export" type="button" onClick={exportCsv} disabled={!selectedProducts.length}><Download size={16}/> CSV indir</button></div>
      </section>
    </div>
    {error && <div className="xml-alert error"><AlertCircle size={17}/>{error}</div>}
    {notice && <div className="xml-alert success"><CheckCircle2 size={17}/>{notice}</div>}
    <section className="panel-card xml-results"><div className="panel-title"><div><h2>3. Ürün önizlemesi</h2><p>{products.length.toLocaleString('tr-TR')} ürün yüklendi · {selectedProducts.length.toLocaleString('tr-TR')} ürün çıktıya dahil</p></div><Boxes size={20}/></div>
      {!products.length ? <div className="empty-state compact"><div className="empty-icon"><FileCode2 size={26}/></div><h2>Henüz dosya yüklenmedi</h2><p>Excel veya XML dosyanızı eklediğinizde ürünler burada listelenecek.</p></div> :
      <div className="table-wrap"><table className="data-table"><thead><tr>{columns.slice(0,7).map(k=><th key={k}>{LABELS[k]}</th>)}</tr></thead><tbody>{selectedProducts.slice(0,100).map(p=><tr key={p.id}><td>{p.name||'—'}</td><td>{p.sku||'—'}</td><td>{p.barcode||'—'}</td><td>{p.category||'—'}</td><td>{p.price||'—'}</td><td>{p.stock||'—'}</td><td>{p.image?<a href={p.image} target="_blank" rel="noreferrer">Görsel</a>:'—'}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
