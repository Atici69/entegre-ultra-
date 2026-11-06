# Entegre Ultra — Üyelik ve kullanım limitleri

## Ücretsiz paket

- Hesap başına en fazla **1 XML tedarikçi bağlantısı** tanımlanabilir.
- Bu XML bağlantısından en fazla **100 ürün** içe aktarılabilir / aktif tutulabilir.
- İkinci XML bağlantısı ekleme denemesinde işlem engellenir ve ücretli paketleri gösteren yükseltme ekranı açılır.
- 100 ürün sınırı aşıldığında yeni ürünler içe aktarılmaz; kullanıcıya limit ve yükseltme seçeneği gösterilir.
- Ücretsiz kullanıcı, mevcut XML bağlantısını düzenleyebilir veya değiştirebilir; aynı anda yalnızca bir bağlantısı bulunabilir.

## Ücretli paketler

- XML bağlantısı, ürün adedi ve pazaryeri kanal limitleri satın alınan pakete göre belirlenir.
- Paket limitleri yönetici tarafından yapılandırılabilir olmalıdır.
- Ödeme ve abonelik durumu iyzico entegrasyonu üzerinden sunucu tarafında doğrulanmalıdır.

## Uygulama kuralları

- Limitler yalnızca arayüzde değil, sunucu/veritabanı tarafında da kontrol edilmelidir.
- İstemci tarafından gönderilen ürün adedi veya paket bilgisine güvenilmemelidir.
- Limit aşımında mevcut ürünler silinmemeli; yeni içe aktarma durdurulmalıdır.
- Ücretli özelliklere erişim, doğrulanmış aktif abonelik ve paket limitlerine göre verilmelidir.

> Not: Bu belge ürün gereksinimini tanımlar. Tek başına uygulama kodunda limitleri etkinleştirmez; XML içe aktarma ve abonelik akışlarına sunucu taraflı kontrollerin eklenmesi gerekir.
