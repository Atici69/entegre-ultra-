# Hepsiburada SIT Entegrasyonu

Durum: Hazırlık aşaması. Bu dosya API bağlantısının çalıştığını veya ürün aktarıldığını göstermez.

## Resmî dokümantasyon kaynakları (10 Kasım 2026)

- [Hepsiburada Developer Portal](https://developers.hepsiburada.com/tr/)
- [Katalog Ürün Entegrasyonu – önemli bilgiler](https://developers.hepsiburada.com/tr/companies/hepsiburada?guide=katalog-onemli-bilgiler&product=katalog-urun-entegrasyonu&view=guide)
- [Listeleme Entegrasyonu – önemli bilgiler](https://developers.hepsiburada.com/tr/companies/hepsiburada?category=baslangic&op=Listing+Bilgilerini+Sorgulama&product=listeleme&version=v1&view=endpoint)
- [Sipariş Entegrasyonu – önemli bilgiler](https://developers.hepsiburada.com/tr/companies/hepsiburada?category=baslangic&guide=siparis-entegrasyonu-onemli-bilgiler&product=siparis-olusturma-entegrasyonu&version=v1.0&view=guide)
- [Sipariş Webhook modeli](https://developers.hepsiburada.com/tr/companies/hepsiburada?guide=siparis-webhook-modeli&product=siparis-olusturma-entegrasyonu&view=guide)

## Resmî dokümandan doğrulanan teknik notlar

- Katalog API'si HTTP Basic Authentication kullanır; kategori bilgisi ürün oluşturmak için gereklidir.
- Katalog ürün gönderiminde ürün verisi beklenen modelde JSON dosyası olarak form-data ile yüklenir. Yanıttaki trackingId ile işlem durumu izlenir.
- Katalog dokümanında sayfalama için page değerinin 0'dan başladığı, size değerinin en fazla 100 olduğu ve MerchantId'nin zorunlu olduğu belirtilir.
- Katalog servisinde IP başına dakikada 180 istek limiti belirtilmiştir.
- Listeleme servisinde aynı anda devam eden/bekleyen güncelleme işlemi sayısı 5'i geçmemelidir; tek istekte en fazla 4.000 SKU güncellenebilir. Fiyat/stok sıfır gönderimi listeyi satışa kapatmak için kullanılabilir.
- Sipariş servisinin ödemesi tamamlanmış siparişleri listeleyen SIT endpoint'i `https://oms-external-sit.hepsiburada.com/orders/merchantid/{merchantId}` şeklindedir. Bu endpoint Basic Auth ve zorunlu User-Agent header'ı ister; limit parametresi zorunludur ve varsayılan/en yüksek değer 100'dür.
- Webhook için entegratörün kendi test web servisinin BaseURL'sini Hepsiburada'ya bildirmesi, Hepsiburada'nın tanımlama yapması ve test siparişiyle akışın doğrulanması gerekir. Webhook Basic Auth kullanır.
- Endpoint ve payload'lar geliştirme öncesinde her operasyonun güncel endpoint sayfasından ayrıca doğrulanmalıdır; bu notlar tek başına çalışan API adaptörü değildir.

## Hedef

Hepsiburada SIT ortamında katalog, listeleme, fiyat/stok, sipariş ve webhook akışlarını Trend Entegre web ve Android uygulamasında ortak servis katmanı üzerinden çalıştırmak. İlk kabul testi 20 test ürünüdür.

## Güvenlik mimarisi

- Hepsiburada kimlik doğrulaması yalnızca sunucu tarafında yapılır.
- Merchant kimliği, Secret Key ve User-Agent gibi entegrasyon ayarları istemci bundle'ına, APK'ya, Git geçmişine veya loglara yazılmaz.
- İstemci yalnızca kimliği doğrulanmış backend/Edge Function uç noktalarını çağırır.
- SIT ve canlı ortam ayrı secret kümeleri ve ayrı yapılandırmayla tutulur. Canlı ortam ayrıca açık onay olmadan etkinleştirilmez.
- Webhook kimlik doğrulama ve güvenlik kontrolleri yalnızca güncel Hepsiburada dokümanına göre uygulanır.
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

- Dokümanların ana rehberleri bulundu. Katalog, listeleme, sipariş ve webhook altındaki kullanılacak tüm endpoint sözleşmeleri kodlamadan önce ayrı ayrı doğrulanmalıdır.
- Supabase Edge Functions veya ayrı backend dağıtım erişimi henüz doğrulanmadı.
- Sohbette daha önce açıkça paylaşılmış test portal parolası ve API Secret Key yenilenmelidir. Yeni değerler sohbete veya repoya gönderilmemeli; sunucu secret manager'a doğrudan girilmelidir.

## Şu anki durum

- Uygulama React + Vite + Capacitor tabanlıdır.
- Mevcut ürün verisinin bir kısmı localStorage'dadır.
- Mevcut depoda Hepsiburada backend/Edge Function kodu tespit edilmemiştir.
- Bu doküman resmî kaynak bağlantıları ve doğrulanmış entegrasyon notlarıyla güncellenmiştir; çalışan API adaptörü değildir.
