# Trend Entegre

React + Vite + Capacitor tabanlı yönetim paneli, kurumsal web sitesi ve Android uygulaması.

## Geliştirme
- Node.js 20+
- `npm install`
- `npm run dev`

## Firebase (ücretsiz başlangıç)
İlk aşamada Firebase Spark planı kullanılacak. Authentication (e-posta/şifre) ve Cloud Firestore ücretsiz kotaları içinde yapılandırılır. Telefon SMS doğrulaması ve Cloud Functions bu ilk sürüm kapsamına dahil değildir.

### Gerekli web yapılandırması
1. Firebase Console'da mevcut Trend Entegre projesini açın.
2. Project settings > General > Your apps bölümünden Web App yapılandırmasını alın.
3. GitHub Actions repository variables/secrets veya hosting build ortamına şu değişkenleri ekleyin:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_ADMIN_EMAILS` (virgülle ayrılmış yönetici e-posta adresleri)
4. Firebase Authentication > Sign-in method bölümünde Email/Password girişini etkinleştirin ve yönetici hesabını oluşturun.
5. Yönetici hesabının e-posta adresini Firebase Authentication üzerinden doğrulayın. `firestore.rules` dosyasındaki `REPLACE_WITH_ADMIN_EMAIL` yer tutucusunu aynı adresle değiştirip Firebase Console > Firestore Database > Rules bölümünde yayınlayın.
6. GitHub Actions iş akışının build adımına bu VITE değişkenlerinin verildiğini doğrulayın.

Firebase web config değerleri istemci uygulamasında görünür; bunlar parola değildir. Güvenlik Firestore Rules ve Authentication ile sağlanır. Service account/private key gibi sunucu sırlarını hiçbir `VITE_` değişkenine veya APK'ya koymayın.

## Firestore veri yapısı
- `dealer_applications/{id}`: herkese açık bayi başvurusu oluşturma; yönetici e-postaları listeleme ve durum güncelleme.
- `users/{uid}/products/{id}`, `users/{uid}/customers/{id}`: oturum açmış kullanıcının kendi kayıtları için ayrılmış alanlar.

## Android APK
GitHub Actions içindeki **Build Android APK** iş akışını çalıştırın. Firebase yapılandırma değişkenleri build sırasında verilmelidir.

## Ücretlendirme notu
Spark planında Firestore günlük ücretsiz kullanım kotası bulunur; kota aşılırsa ilgili ürün ay sonuna kadar durdurulabilir. Cloud Functions ve SMS Authentication gibi özellikler bu ücretsiz başlangıç mimarisine dahil değildir. Güncel koşullar: https://firebase.google.com/pricing
