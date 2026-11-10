# Hepsiburada SIT Entegrasyonu

Durum: Hazırlık aşaması. Bu dosya API bağlantısının çalıştığını veya ürün aktarıldığını göstermez.

## Hedef
Hepsiburada SIT ortamında katalog, listeleme, fiyat/stok, sipariş ve webhook akışlarını Trend Entegre web ve Android uygulamasında ortak servis katmanı üzerinden çalıştırmak. İlk kabul testi 20 test ürünüdür.

## Güvenlik mimarisi
- Hepsiburada kimlik doğrulaması yalnızca sunucu tarafında yapılır.
- Merchant kimliği, Secret Key ve User-Agent gibi entegrasyon ayarları istemci bundle'ına, APK'ya, Git geçmişine veya loglara yazılmaz.
- İstemci yalnızca kimliği doğrulanmış backend/Edge Function uç noktalarını çağırır.
- SIT ve canlı ortam ayrı secret kümeleri ve ayrı yapılandırmayla tutulur. Canlı ortam ayrıca açık onay olmadan etkinleştirilmez.
- Webhook imza/doğrulama yöntemi yalnızca güncel Hepsiburada dokümanına göre uygulanır.
- Sipariş ve webhook işleme idempotent olmalı; tekrar gelen olay ikinci sipariş/işlem oluşturmamalıdır.

## Uygulama sırası
1. Güncel Developer Portal dokümanlarından endpoint, header, payload, hata kodu, sayfalama, rate limit ve webhook doğrulama sözleşmelerini doğrula.
2. Supabase projesi ve Edge Functions dağıtım erişimini doğrula; yoksa ayrı backend kararı al.
3. Sunucu tarafında Hepsiburada istemci/secret yapılandırmasını ve sağlık kontrolünü ekle.
4. Katalog ve kategori/özellik eşlemesini; barkod, varyant, görsel ve zorunlu alan kontrollerini ekle.
5. Listeleme oluşturma/güncelleme, fiyat ve stok senkronizasyonunu ekle.
6. Sipariş içe aktarma, durum eşlemesi ve webhook idempotency katmanını ekle.
7. Ortak web/APK ekranlarına mağaza bağlantısı, aktarım kuyruğu, sonuç ve hata ayrıntılarını bağla.
8. SIT'te 20 ürün, fiyat/stok güncellemesi, test siparişi ve tekrarlı webhook senaryolarını çalıştır.

## 20 ürünlük SIT kabul ölçütleri
- Tam 20 ürün seçilir ve aktarım öncesi doğrulamadan geçer.
- Her ürünün sonucu ve sağlayıcı yanıtı güvenli biçimde kaydedilir; secret/kişisel veri loglanmaz.
- Fiyat ve stok güncellemesi SIT'te doğrulanır.
- Test siparişi uygulama panelinde görünür.
- Aynı webhook olayı tekrarlandığında ikinci kayıt/yan etki oluşmaz.
- Hatalı ürünler için anlaşılır hata ve yeniden deneme akışı vardır.

## Blokajlar / gerekli girdiler
- Güncel Katalog Ürün, Listeleme, Sipariş ve Sipariş Webhook dokümanları henüz depoda/doğrulanmış girdiler arasında değildir. Endpoint ve payload uydurulmayacaktır.
- Supabase Edge Functions veya ayrı backend dağıtım erişimi henüz doğrulanmadı.
- Sohbette daha önce açıkça paylaşılmış test portal parolası ve API Secret Key yenilenmelidir. Yeni değerler sohbete veya repoya gönderilmemeli; Supabase Edge Function Secrets ya da sunucu secret manager'a doğrudan girilmelidir.

## Şu anki durum
- Uygulama React + Vite + Capacitor tabanlıdır.
- Mevcut ürün verisinin bir kısmı localStorage'dadır.
- Mevcut depoda Hepsiburada backend/Edge Function kodu tespit edilmemiştir.
- Bu commit yalnızca entegrasyon başlangıç planını ve güvenlik/kabul ölçütlerini kaydeder; çalışan API adaptörü değildir.
