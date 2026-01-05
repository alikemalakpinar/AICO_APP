# AICO ERP - Masaüstü Uygulaması

Profesyonel Turizm & Halı Ticareti Yönetim Sistemi - Electron + React masaüstü versiyonu.

## Özellikler

- 📊 **Dashboard**: Canlı satış istatistikleri ve grafikler
- 🛒 **Sipariş Yönetimi**: Sipariş oluşturma, düzenleme, takip
- 📦 **Ürün Yönetimi**: Envanter ve stok takibi
- 👥 **Müşteri Yönetimi**: Müşteri veritabanı
- 💳 **Ödeme Takibi**: Ödeme işlemleri ve raporlar
- ⚙️ **Ayarlar**: Kullanıcı ve sistem ayarları

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme modunda çalıştır
npm run dev

# Production build oluştur
npm run build

# Electron paketi oluştur (Windows)
npm run build:win

# Electron paketi oluştur (macOS)
npm run build:mac

# Electron paketi oluştur (Linux)
npm run build:linux
```

## Gereksinimler

- Node.js 18+
- npm veya yarn
- Backend sunucusu çalışıyor olmalı (varsayılan: http://localhost:3000)

## Proje Yapısı

```
desktop/
├── electron/           # Electron ana süreç dosyaları
│   ├── main.js         # Ana süreç
│   └── preload.js      # Preload script
├── src/                # React kaynak kodları
│   ├── components/     # React bileşenleri
│   │   └── screens/    # Ekran bileşenleri
│   ├── styles/         # CSS dosyaları
│   ├── App.tsx         # Ana uygulama bileşeni
│   └── main.tsx        # Giriş noktası
├── public/             # Statik dosyalar
└── package.json        # Proje yapılandırması
```

## Teknolojiler

- **Electron**: Masaüstü uygulama framework'ü
- **React 18**: UI kütüphanesi
- **TypeScript**: Tip güvenliği
- **Vite**: Hızlı build tool
- **TailwindCSS**: Utility-first CSS
- **Recharts**: Grafik kütüphanesi
- **Lucide Icons**: İkon seti
- **React Router**: Yönlendirme

## Lisans

© 2024 AICO Bilişim. Tüm hakları saklıdır.
