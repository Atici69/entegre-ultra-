import React, { useEffect, useRef, useState } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db } from './firebase.js';
import { migrateLocalXmlSources } from './xmlSources.js';
import { Cloud, RefreshCw, LogIn, LogOut, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

const safeId = value => String(value).replaceAll('/', '_');
const readLocalProducts = () => {
  try { return JSON.parse(localStorage.getItem('eu_products') || '[]'); }
  catch { return []; }
};

async function migrateProducts(user) {
  const localProducts = readLocalProducts();
  const productsRef = collection(db, 'users', user.uid, 'products');
  const remote = await getDocs(productsRef);
  const existingIds = new Set(remote.docs.map(item => item.id));
  for (let start = 0; start < localProducts.length; start += 400) {
    const batch = writeBatch(db);
    let writes = 0;
    localProducts.slice(start, start + 400).forEach(product => {
      const id = safeId(product.id ?? `legacy-${start}`);
      if (!existingIds.has(id)) {
        batch.set(doc(productsRef, id), product);
        writes += 1;
      }
    });
    if (writes) await batch.commit();
  }
  const snapshot = await getDocs(productsRef);
  const cloudProducts = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  const merged = new Map(localProducts.map(product => [String(product.id), product]));
  cloudProducts.forEach(product => merged.set(String(product.id), product));
  return [...merged.values()];
}

export default function CloudSync({ products, onProductsLoaded }) {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const syncLock = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser || null);
      setReady(false);
      if (!currentUser) { setNotice('Giriş yapılmadı. Veriler bu cihazda korunur.'); return; }
      if (syncLock.current) return;
      syncLock.current = true;
      setBusy(true); setError('');
      try {
        const [sourceResult, cloudProducts] = await Promise.all([
          migrateLocalXmlSources(currentUser),
          migrateProducts(currentUser)
        ]);
        onProductsLoaded(cloudProducts);
        setNotice(`Bulut eşitlemesi tamamlandı. XML kaynakları: ${sourceResult.total} yerel kayıttan ${sourceResult.migrated} yeni kaynak aktarıldı. Ürünler: ${cloudProducts.length}.`);
        setReady(true);
      } catch (err) {
        setError(err?.message || 'Bulut aktarımı tamamlanamadı. Yerel kayıtlarınız korunuyor.');
      } finally {
        setBusy(false);
        syncLock.current = false;
      }
    });
    return unsubscribe;
  }, [onProductsLoaded]);



  const submit = async event => {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      if (mode === 'register') await createUserWithEmailAndPassword(auth, email.trim(), password);
      else await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword('');
      setNotice('Hesap doğrulandı. Bulut aktarımı başlatılıyor…');
    } catch (err) {
      setError(err?.code === 'auth/email-already-in-use' ? 'Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin.' : err?.code === 'auth/weak-password' ? 'Şifre en az 6 karakter olmalıdır.' : err?.message || 'Hesap işlemi başarısız.');
    } finally { setBusy(false); }
  };

  const logout = async () => {
    setBusy(true);
    try { await signOut(auth); setReady(false); setNotice('Oturum kapatıldı. Yerel kayıtlar korunuyor.'); }
    catch (err) { setError(err?.message || 'Oturum kapatılamadı.'); }
    finally { setBusy(false); }
  };

  return <div className="panel-card data-panel">
    <div className="panel-title"><div><h2>Bulut hesabı ve veri eşitleme</h2><p>XML kaynaklarınızı ve ürünlerinizi web ile Android arasında ortak kullanın.</p></div><Cloud size={21}/></div>
    {user ? <>
      <div className="notice-box"><strong>Bağlı hesap:</strong> {user.email || user.uid}</div>
      <div className="button-row" style={{marginTop:12}}>
        <button className="secondary-button" type="button" onClick={() => window.location.reload()} disabled={busy}><RefreshCw size={16}/> Eşitleme durumunu yenile</button>
        <button className="secondary-button" type="button" onClick={logout} disabled={busy}><LogOut size={16}/> Çıkış yap</button>
      </div>
    </> : <form className="entry-form" onSubmit={submit}>
      <p>Mevcut yerel kayıtları hesabınıza aktarabilmek için e-posta ve şifrenizle giriş yapın. Hesabınız yoksa kayıt oluşturun.</p>
      <label>E-posta<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="E-posta adresiniz"/></label>
      <label>Şifre<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} required value={password} onChange={event => setPassword(event.target.value)} placeholder="En az 6 karakter"/></label>
      <div className="button-row">
        <button className="primary-button" type="submit" disabled={busy}>{mode === 'login' ? <><LogIn size={16}/> Giriş yap</> : <><UserPlus size={16}/> Hesap oluştur</>}</button>
        <button className="secondary-button" type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} disabled={busy}>{mode === 'login' ? 'Yeni hesap oluştur' : 'Giriş ekranına dön'}</button>
      </div>
    </form>}
    {busy && <div className="notice-box">İşlem sürüyor. Büyük XML kaynaklarında aktarım biraz zaman alabilir…</div>}
    {notice && <div className="xml-alert success"><CheckCircle2 size={17}/>{notice}</div>}
    {error && <div className="xml-alert error"><AlertCircle size={17}/>{error}</div>}
    <p className="muted-note">Güvenlik: Her hesap yalnızca kendi users/{'{uid}'} alanındaki verileri okuyabilir. Yerel kayıtlar aktarım sırasında silinmez.</p>
  </div>;
}
