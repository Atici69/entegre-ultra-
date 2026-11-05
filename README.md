# Entegre Ultra

Entegre Ultra'nun React + Vite arayüzü ve Capacitor 7 Android paketleme altyapısı.

## Gereksinimler
- Node.js 20+
- Android derlemesi için GitHub Actions veya Android Studio

## Yerel geliştirme
```bash
npm install
npm run dev
```

## Android APK
GitHub Actions içindeki **Build Android APK** iş akışını çalıştırın. Başarılı derlemenin ardından `entegre-ultra-debug-apk` adlı artifact içinden test APK'sı indirilebilir.

## İlk sürüm notları
- Bu sürüm arayüz prototipidir; gerçek kullanıcı hesabı, sunucu/veritabanı, ödeme ve pazaryeri API entegrasyonları henüz bağlanmamıştır.
- Ürün limitleri ve abonelik kuralları sonraki backend aşamasında uygulanacaktır.

## Bayi başvuru sistemi

1. Supabase Dashboard > SQL Editor bölümünde `supabase/migrations/202611050001_dealer_applications.sql` dosyasının tamamını çalıştırın.
2. Authentication > Users bölümünden yönetici hesabı oluşturun.
3. Yönetici kullanıcısının **app_metadata** alanına `{"role":"admin"}` ekleyin (user_metadata değil).
4. GitHub repository Settings > Secrets and variables > Actions bölümünde `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` değerlerini tanımlayın.
5. Bu değişiklikler main dalına gönderildiğinde Android APK iş akışı otomatik başlar. Başarılı derlemenin artifact dosyasını indirin.

Anonim ziyaretçiler yalnızca başvuru oluşturabilir. Başvuruları listeleme ve durum değiştirme işlemleri yalnızca app_metadata alanında admin rolü bulunan hesaplara açıktır. Supabase service-role anahtarını APK içine veya VITE_ değişkenlerine kesinlikle koymayın.
