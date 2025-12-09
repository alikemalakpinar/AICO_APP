# Koyuncu Halı Yönetim Sistemi - Yetki ve İzin Kılavuzu

## Varsayılan Roller ve Yetkileri

### 1. Patron
- Tam yetkili kullanıcı
- Varsayılan Erişimler:
  * Ana sayfa istatistikleri (tüm veriler)
  * Finansal veriler (aylık ciro, giderler, net kar)
  * Raporlar görüntüleme
  * Belge oluşturma
  * Personel yönetimi
  * Sipariş oluşturma
  * Sipariş listeleme
  * Personel ekleme/düzenleme
  * Yetki ve rol atama
  * Ek yetki verme

### 2. Operasyon Sorumlusu
- Varsayılan Erişimler:
  * Ana sayfa temel istatistikleri
  * Sipariş oluşturma
  * Sipariş listeleme
  * Belge oluşturma

### 3. Depo Görevlisi
- Varsayılan Erişimler:
  * Ana sayfa temel istatistikleri
  * Sipariş listeleme
  * Sipariş durumu güncelleme

### 4. Lojistik Sorumlusu
- Varsayılan Erişimler:
  * Ana sayfa temel istatistikleri
  * Sipariş listeleme
  * Sipariş durumu güncelleme

## Ek Yetkiler

Sistem üç farklı ek yetki sunmaktadır. Bu yetkiler Patron tarafından diğer kullanıcılara verilebilir:

### 1. Finansal Görüntüleme (finansal_goruntuleme)
- Erişim sağlanan özellikler:
  * Ana sayfada finansal widget'ları görüntüleme
  * Aylık ciro bilgisi
  * Aylık gider bilgisi
  * Net kar bilgisi

### 2. Rapor Görüntüleme (rapor_goruntuleme)
- Erişim sağlanan özellikler:
  * Ana sayfada "Raporlar" butonunu görüntüleme
  * Finansal özet raporlarına erişim
  * Detaylı satış raporlarını görüntüleme
  * Sipariş istatistiklerini görüntüleme

### 3. Belge Oluşturma (belge_olusturma)
- Erişim sağlanan özellikler:
  * Siparişler sayfasında "Belge Oluştur" butonunu görüntüleme
  * CSV formatında sipariş raporları oluşturma
  * Oluşturulan belgeleri indirme ve paylaşma

## Yetki Yönetimi

### Rol Değiştirme
- Sadece Patron rolündeki kullanıcılar:
  * Diğer kullanıcıların rollerini değiştirebilir
  * Patron rolü değiştirilemez
  * Mevcut roller: Operasyon Sorumlusu, Depo Görevlisi, Lojistik Sorumlusu

### Ek Yetki Atama
- Patron rolündeki kullanıcılar:
  * Herhangi bir kullanıcıya ek yetki verebilir
  * Birden fazla ek yetki aynı anda verilebilir
  * Ek yetkiler birbirinden bağımsız çalışır
  * Patron rolündeki kullanıcının yetkileri değiştirilemez

## Ana Sayfa Görünümü

### Temel Görünüm (Tüm Kullanıcılar)
- Kullanıcı adı ve ünvan bilgisi
- Güncel tarih
- Toplam sipariş sayısı
- Teslim edilen sipariş sayısı
- Transfer aşamasındaki sipariş sayısı
- İptal edilen sipariş sayısı

### Finansal Görünüm (Patron + finansal_goruntuleme yetkisi olanlar)
- Aylık ciro
- Aylık giderler
- Net kar

### Hızlı İşlemler
- Yeni Sipariş (Depo Görevlisi ve Lojistik Sorumlusu hariç)
- Raporlar (Patron + rapor_goruntuleme yetkisi olanlar)

## Önemli Notlar

1. Varsayılan roller değiştirilemez, sadece kullanıcıların rolleri değiştirilebilir
2. Ek yetkiler istenildiği zaman geri alınabilir
3. Patron rolündeki kullanıcının yetkileri değiştirilemez
4. Kullanıcılar birden fazla ek yetkiye sahip olabilir
5. Ek yetkiler kullanıcının mevcut rolünden bağımsız çalışır 