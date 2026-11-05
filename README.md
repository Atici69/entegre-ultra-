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
