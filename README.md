# Entegre Ultra

Entegre Ultra; React + Vite tabanlı yönetim paneli, kurumsal web sitesi ve Capacitor Android paketleme altyapısıdır.

## Geliştirme
- Node.js 20+
- `npm ci`
- `npm run dev`

## Kurumsal web sitesi
- Giriş dosyası: `public.html`
- Yayınlanan sayfa: GitHub Pages üzerinde `/public.html`
- GitHub Actions iş akışı: **Deploy Entegre Ultra Website**
- GitHub deposunda Settings > Pages > Build and deployment bölümünde Source değerini **GitHub Actions** seçin.

## Android APK
GitHub Actions içindeki **Build Android APK** iş akışını çalıştırın. Başarılı derlemenin ardından `entegre-ultra-debug-apk` adlı artifact içinden test APK'sı indirilebilir.

## Bayi başvuru sistemi
1. Supabase Dashboard > SQL Editor bölümünde önce `supabase/migrations/202611050001_dealer_applications.sql`, ardından `supabase/migrations/202611090001_harden_dealer_applications.sql` dosyalarının tamamını sırayla çalıştırın. İkinci migration bayi başvurusu alanlarına uzunluk sınırı koyar ve anonim istemcinin kayıt kimliği, tarih veya başvuru durumunu belirlemesini engeller.
2. Authentication > Users bölümünden yönetici hesabı oluşturun.
3. Yönetici kullanıcısının **app_metadata** alanına `{"role":"admin"}` ekleyin (user_metadata değil).
4. GitHub repository Settings > Secrets and variables > Actions bölümünde `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` değerlerini tanımlayın.
5. Başvuru formu ve yönetici başvuru listesi bu Supabase projesini kullanır.

Anonim ziyaretçiler yalnızca başvuru oluşturabilir. Başvuruları listeleme ve durum değiştirme işlemleri yalnızca app_metadata alanında admin rolü bulunan hesaplara açıktır. Supabase service-role anahtarını APK içine veya VITE_ değişkenlerine kesinlikle koymayın.

## Sürüm notu
Kurumsal web sayfası, yönetim panelinden ayrı olarak `public.html` üzerinden sunulur. Ürün, ödeme, pazaryeri ve bayi işlemlerinin gerçek zamanlı çalışması için ilgili servis ve API bağlantılarının tamamlanması gerekir.


## Güvenlik notları
- `VITE_SUPABASE_ANON_KEY` tarayıcı ve APK içinde görünür; bu anahtar gizli kabul edilmemelidir. Güvenlik, Supabase RLS politikaları ve daraltılmış tablo izinleriyle sağlanır.
- `service_role` anahtarını hiçbir `VITE_` değişkenine, web dosyasına veya APK'ya eklemeyin.
- Yeni bayi başvurusu güvenlik migration'ı Supabase SQL Editor'de çalıştırılmadan veritabanı tarafındaki sıkılaştırma canlıya uygulanmış sayılmaz.
