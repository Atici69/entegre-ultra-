import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, ArrowRight, Building2, LockKeyhole, Store, UserRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey && /^https:\/\//i.test(supabaseUrl)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const roles = [
  { id: 'member', title: 'Üye Girişi', description: 'Mağaza ve ürün yönetimi', icon: Store },
  { id: 'dealer', title: 'Bayi Girişi', description: 'Bayi hesabınızla devam edin', icon: Building2 },
  { id: 'admin', title: 'Yönetici Girişi', description: 'Yetkili yönetim hesabı', icon: ShieldCheck }
];

function roleFor(user) {
  const role = user?.app_metadata?.role;
  if (role === 'admin' || role === 'dealer') return role;
  return 'member';
}

function allowedRole(user, selectedRole) {
  const storedRole = user?.app_metadata?.role;
  if (selectedRole === 'admin') return storedRole === 'admin';
  if (selectedRole === 'dealer') return storedRole === 'dealer';
  return !storedRole || storedRole === 'member';
}

export default function AuthGate({ appMode = false, onAuthenticated }) {
  const [selectedRole, setSelectedRole] = useState('member');
  const [view, setView] = useState('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const enter = (user) => {
    const role = roleFor(user);
    if (appMode && onAuthenticated) onAuthenticated(role);
    else window.location.assign('./index.html');
  };

  useEffect(() => {
    let alive = true;
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (alive && data.session?.user) enter(data.session.user);
    });
    return () => { alive = false; };
  }, []);

  const choose = (role) => {
    setSelectedRole(role);
    setView('login');
    setError('');
    setNotice('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!supabase) {
      setError('Giriş sistemi yapılandırılmamış. GitHub Actions secrets içindeki VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY ayarlarını kontrol edin.');
      return;
    }
    setBusy(true);
    try {
      if (view === 'signup') {
        if (selectedRole !== 'member') throw new Error('Yeni üyelik yalnızca Üye Girişi bölümünden oluşturulabilir.');
        const { data, error: signupError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } }
        });
        if (signupError) throw signupError;
        if (data.session?.user) {
          if (!allowedRole(data.session.user, 'member')) {
            await supabase.auth.signOut();
            throw new Error('Bu hesap üye girişi için yetkili değil.');
          }
          enter(data.session.user);
        } else {
          setNotice('Üyelik talebiniz alındı. Giriş yapmadan önce e-posta adresinize gönderilen doğrulama bağlantısını onaylayın.');
          setView('login');
        }
      } else {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        if (loginError) throw loginError;
        if (!allowedRole(data.user, selectedRole)) {
          await supabase.auth.signOut();
          throw new Error(selectedRole === 'admin'
            ? 'Bu hesap yönetici yetkisine sahip değil.'
            : selectedRole === 'dealer'
              ? 'Bu hesap bayi olarak yetkilendirilmemiş.'
              : 'Bu hesap üye girişi için uygun değil. Doğru giriş türünü seçin.');
        }
        enter(data.user);
      }
    } catch (err) {
      setError(err?.message || 'İşlem tamamlanamadı. Bilgilerinizi kontrol edip tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  };

  return <div className="te-auth-page">
    <style>{`
      .te-auth-page{min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(ellipse at 80% 10%,#244c7428,transparent 35%),linear-gradient(145deg,#0c1a2d,#142f4d 62%,#0e2239);font-family:Inter,system-ui,-apple-system,sans-serif;color:#172a42}
      .te-auth-card{width:min(100%,470px);padding:clamp(24px,5vw,42px);border:1px solid #ffffff30;border-radius:24px;background:#fff;box-shadow:0 28px 90px #020b1670}
      .te-auth-brand{display:flex;align-items:center;gap:12px;margin-bottom:27px}.te-auth-logo{width:49px;height:49px;border-radius:15px;display:grid;place-items:center;background:linear-gradient(140deg,#ffd35c,#f28a24);color:#142c49;font-weight:950;box-shadow:0 8px 22px #f28a2438}.te-auth-brand strong{font-size:20px;letter-spacing:-.7px;color:#122b49}.te-auth-brand strong span{color:#f28a24}.te-auth-brand small{display:block;margin-top:4px;color:#7d8b9d;font-size:8px;letter-spacing:1.7px;font-weight:850}
      .te-auth-eyebrow{font-size:9px;letter-spacing:1.8px;font-weight:900;color:#e78323}.te-auth-card h1{margin:10px 0 8px;font-size:30px;letter-spacing:-1.2px;color:#122b49}.te-auth-intro{margin:0 0 24px;color:#6c7c90;font-size:12px;line-height:1.7}
      .te-auth-roles{display:grid;gap:10px}.te-auth-role{display:flex;align-items:center;gap:13px;padding:15px;border:1px solid #e4e9ef;border-radius:13px;background:#fff;text-align:left;cursor:pointer;transition:.18s}.te-auth-role:hover{border-color:#f0a04a;transform:translateY(-1px);box-shadow:0 8px 22px #1c35510d}.te-auth-role-icon{width:43px;height:43px;display:grid;place-items:center;flex:none;border-radius:12px;background:#fff1e3;color:#e78323}.te-auth-role span:nth-child(2){flex:1}.te-auth-role strong{display:block;font-size:13px;color:#173451}.te-auth-role small{display:block;margin-top:4px;font-size:10px;color:#7c8998}.te-auth-arrow{color:#b0bac6}
      .te-auth-back{display:inline-flex;align-items:center;gap:7px;margin:0 0 19px;border:0;background:transparent;color:#63758b;font-size:11px;font-weight:750;cursor:pointer;padding:0}.te-auth-form{display:grid;gap:13px}.te-auth-form label{display:grid;gap:6px;font-size:10px;font-weight:800;color:#4c6078}.te-auth-form input{width:100%;min-width:0;padding:12px;border:1px solid #dce4ec;border-radius:9px;background:#fff;color:#1c3048;font:inherit;font-size:12px;outline:0}.te-auth-form input:focus{border-color:#8ca8c7;box-shadow:0 0 0 3px #eaf1fa}.te-auth-password{position:relative}.te-auth-password input{padding-right:43px}.te-auth-eye{position:absolute;right:7px;top:50%;transform:translateY(-50%);border:0;background:transparent;color:#708197;padding:7px;cursor:pointer}.te-auth-submit{display:flex;align-items:center;justify-content:center;gap:9px;margin-top:4px;padding:13px;border:0;border-radius:9px;background:linear-gradient(105deg,#f7a12e,#ef741d);color:#fff;font-size:12px;font-weight:850;cursor:pointer}.te-auth-submit:disabled{opacity:.6;cursor:wait}.te-auth-link{border:0;background:transparent;color:#2d5b87;font-size:11px;font-weight:750;cursor:pointer;padding:8px}.te-auth-error,.te-auth-notice{padding:11px;border-radius:8px;font-size:10px;line-height:1.6}.te-auth-error{background:#fff0ef;color:#a52a24}.te-auth-notice{background:#ecf8f1;color:#1f7850}.te-auth-foot{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;border-top:1px solid #edf0f4;margin-top:22px;padding-top:17px}.te-auth-foot a{font-size:10px;color:#708197;text-decoration:none}.te-auth-foot a:hover{color:#e78323}.te-auth-security{display:flex;align-items:center;gap:6px;margin-top:17px;color:#8b98a8;font-size:9px;line-height:1.6}.te-auth-security svg{flex:none;color:#e78323}
      @media(max-width:420px){.te-auth-page{padding:13px}.te-auth-card{padding:23px 18px;border-radius:19px}.te-auth-card h1{font-size:26px}}
    `}</style>
    <section className="te-auth-card">
      <div className="te-auth-brand"><div className="te-auth-logo">TE</div><div><strong>Trend <span>Entegre</span></strong><small>E-TİCARETİN ENTEGRE MERKEZİ</small></div></div>
      {view === 'choose' ? <>
        <span className="te-auth-eyebrow">GÜVENLİ ERİŞİM</span>
        <h1>Hoş geldiniz</h1>
        <p className="te-auth-intro">Devam etmek için giriş türünüzü seçin.</p>
        <div className="te-auth-roles">{roles.map(({id,title,description,icon:Icon}) => <button className="te-auth-role" key={id} onClick={() => choose(id)}><span className="te-auth-role-icon"><Icon size={21}/></span><span><strong>{title}</strong><small>{description}</small></span><ArrowRight className="te-auth-arrow" size={18}/></button>)}</div>
      </> : <>
        <button className="te-auth-back" onClick={() => { setView('choose'); setError(''); setNotice(''); }}><ArrowLeft size={15}/> Giriş türünü değiştir</button>
        <span className="te-auth-eyebrow">{roles.find(r => r.id === selectedRole)?.title.toLocaleUpperCase('tr-TR')}</span>
        <h1>{view === 'signup' ? 'Üyeliğinizi oluşturun' : 'Tekrar hoş geldiniz'}</h1>
        <p className="te-auth-intro">{selectedRole === 'admin' ? 'Yalnızca yetkilendirilmiş yönetici hesabı giriş yapabilir.' : selectedRole === 'dealer' ? 'Bayi paneli için size tanımlanmış hesapla giriş yapın.' : 'Mağaza hesabınıza güvenli şekilde giriş yapın.'}</p>
        <form className="te-auth-form" onSubmit={submit}>
          {view === 'signup' && <label>Ad soyad<input required maxLength={120} value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" placeholder="Adınız ve soyadınız"/></label>}
          <label>E-posta adresi<input required type="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" placeholder="ornek@firma.com"/></label>
          <label>Şifre<div className="te-auth-password"><input required type={showPassword ? 'text' : 'password'} minLength={6} value={password} onChange={e => setPassword(e.target.value)} autoComplete={view === 'signup' ? 'new-password' : 'current-password'} placeholder={view === 'signup' ? 'En az 6 karakter' : 'Şifreniz'}/><button className="te-auth-eye" type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
          {error && <div className="te-auth-error" role="alert">{error}</div>}
          {notice && <div className="te-auth-notice" role="status">{notice}</div>}
          <button className="te-auth-submit" type="submit" disabled={busy}>{busy ? 'İşleniyor…' : view === 'signup' ? 'Üyelik oluştur' : 'Giriş yap'} <ArrowRight size={16}/></button>
        </form>
        {selectedRole === 'member' && <button className="te-auth-link" onClick={() => { setView(view === 'signup' ? 'login' : 'signup'); setError(''); setNotice(''); }}>{view === 'signup' ? 'Zaten hesabınız var mı? Giriş yapın' : 'Hesabınız yok mu? Üye olun'}</button>}
      </>}
      <div className="te-auth-foot"><a href="./public.html?view=site">Kurumsal tanıtım sitesi</a><a href="./public.html?view=site#bayilik">Bayi başvurusu</a></div>
      <div className="te-auth-security"><LockKeyhole size={14}/> Erişim, hesabınıza tanımlı rol üzerinden doğrulanır. Yetki atamaları sunucu tarafında yapılmalıdır.</div>
    </section>
  </div>;
}
