const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const sqlite3 = require('better-sqlite3');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// SQLite veritabani baglantisi
const dbPath = path.join(__dirname, 'database.sqlite');
const db = sqlite3(dbPath);

// Tablolari olustur
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    Ad_Soyad TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefon TEXT,
    sifre TEXT NOT NULL,
    yetki TEXT DEFAULT 'Operasyon Sorumlusu',
    ek_yetkiler TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS siparisler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    order_no TEXT,
    location TEXT,
    customer_name TEXT,
    customer_address TEXT,
    customer_country TEXT,
    customer_city TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    salesman TEXT,
    conference TEXT,
    agency TEXT,
    guide TEXT,
    products TEXT,
    process TEXT DEFAULT 'Sipariş Oluşturuldu',
    photos TEXT,
    cargo_company TEXT,
    cargo_tracking TEXT
  )
`);

// Musteriler tablosu
db.exec(`
  CREATE TABLE IF NOT EXISTS musteriler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    country TEXT,
    city TEXT,
    address TEXT,
    notes TEXT,
    total_orders INTEGER DEFAULT 0,
    total_spent REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Urunler tablosu
db.exec(`
  CREATE TABLE IF NOT EXISTS urunler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    default_price REAL,
    default_cost REAL,
    sizes TEXT,
    description TEXT,
    in_stock INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Demo verileri ekle (eger bos ise)
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const hashedPassword = bcrypt.hashSync('123456', 10);

  // Demo kullanicilar
  db.prepare(`
    INSERT INTO users (Ad_Soyad, email, telefon, sifre, yetki, ek_yetkiler)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Admin User', 'admin@test.com', '555-0001', hashedPassword, 'Patron', 'finansal_goruntuleme,rapor_goruntuleme,belge_olusturma');

  db.prepare(`
    INSERT INTO users (Ad_Soyad, email, telefon, sifre, yetki)
    VALUES (?, ?, ?, ?, ?)
  `).run('Test User', 'test@test.com', '555-0002', hashedPassword, 'Operasyon Sorumlusu');

  console.log('Demo kullanicilar olusturuldu:');
  console.log('  - admin@test.com / 123456 (Patron)');
  console.log('  - test@test.com / 123456 (Operasyon Sorumlusu)');
}

// Demo siparisler ekle (eger bos ise)
const orderCount = db.prepare('SELECT COUNT(*) as count FROM siparisler').get();
if (orderCount.count === 0) {
  const demoOrders = [
    {
      date: '2024-12-09',
      order_no: 'ORD-001',
      location: 'Istanbul',
      customer_name: 'Ahmet Yilmaz',
      customer_address: 'Kadikoy, Istanbul',
      customer_country: 'Almanya',
      customer_city: 'Berlin',
      customer_phone: '+90 532 111 2233',
      customer_email: 'ahmet@example.com',
      salesman: 'Mehmet Demir',
      conference: 'Hali Fuari 2024',
      agency: 'Premium Tours',
      guide: 'Ali Kaya',
      products: JSON.stringify([
        { name: 'El Dokuma Hali', quantity: '2', size: '200x300', price: '1500', cost: '800', notes: 'Ozel siparis' },
        { name: 'Ipek Hali', quantity: '1', size: '150x200', price: '2500', cost: '1200', notes: '' }
      ]),
      process: 'Teslim Edildi'
    },
    {
      date: '2024-12-08',
      order_no: 'ORD-002',
      location: 'Ankara',
      customer_name: 'Hans Mueller',
      customer_address: 'Munich, Germany',
      customer_country: 'Almanya',
      customer_city: 'Munih',
      customer_phone: '+49 123 456 7890',
      customer_email: 'hans@example.de',
      salesman: 'Ayse Ozturk',
      conference: '',
      agency: 'Euro Travel',
      guide: 'Fatma Yildiz',
      products: JSON.stringify([
        { name: 'Antik Hali', quantity: '1', size: '300x400', price: '5000', cost: '2500', notes: 'Koleksiyon parcasi' }
      ]),
      process: 'Transfer Aşamasında'
    },
    {
      date: '2024-12-07',
      order_no: 'ORD-003',
      location: 'Izmir',
      customer_name: 'Marie Dubois',
      customer_address: 'Paris, France',
      customer_country: 'Fransa',
      customer_city: 'Paris',
      customer_phone: '+33 1 23 45 67 89',
      customer_email: 'marie@example.fr',
      salesman: 'Mehmet Demir',
      conference: 'Dekorasyon Fuari',
      agency: 'France Tours',
      guide: 'Kemal Aslan',
      products: JSON.stringify([
        { name: 'Modern Hali', quantity: '3', size: '100x150', price: '800', cost: '400', notes: '' },
        { name: 'Kilim', quantity: '2', size: '80x120', price: '350', cost: '150', notes: 'Hediye paketleme' }
      ]),
      process: 'Sipariş Oluşturuldu'
    }
  ];

  const insertOrder = db.prepare(`
    INSERT INTO siparisler (date, order_no, location, customer_name, customer_address,
      customer_country, customer_city, customer_phone, customer_email,
      salesman, conference, agency, guide, products, process)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  demoOrders.forEach(order => {
    insertOrder.run(
      order.date, order.order_no, order.location, order.customer_name, order.customer_address,
      order.customer_country, order.customer_city, order.customer_phone, order.customer_email,
      order.salesman, order.conference, order.agency, order.guide, order.products, order.process
    );
  });

  console.log('Demo siparisler olusturuldu (3 siparis)');
}

console.log('SQLite veritabanina baglandi');

// ==================== API ENDPOINTS ====================

// Kullanici kaydi
app.post('/api/register', async (req, res) => {
  const { Ad_Soyad, email, telefon, sifre, sifre_tekrar } = req.body;

  if (sifre !== sifre_tekrar) {
    return res.status(400).json({ error: 'Sifreler eslesmiyor' });
  }

  try {
    const hashedPassword = await bcrypt.hash(sifre, 10);

    const stmt = db.prepare(`
      INSERT INTO users (Ad_Soyad, email, telefon, sifre, yetki)
      VALUES (?, ?, ?, ?, 'Operasyon Sorumlusu')
    `);

    const result = stmt.run(Ad_Soyad, email, telefon, hashedPassword);

    res.status(201).json({
      message: 'Kullanici basariyla kaydedildi',
      userId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Kayit hatasi:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Bu email adresi zaten kayitli' });
    }
    res.status(500).json({ error: 'Kayit islemi basarisiz' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, sifre } = req.body;

  if (!email || !sifre) {
    return res.status(400).json({ error: 'Email ve sifre gerekli' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ error: 'Email veya sifre hatali' });
    }

    const isPasswordValid = await bcrypt.compare(sifre, user.sifre);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email veya sifre hatali' });
    }

    const permissions = user.ek_yetkiler ? user.ek_yetkiler.split(',') : [];

    res.json({
      message: 'Giris basarili',
      userId: user.id,
      yetki: user.yetki,
      Ad_Soyad: user.Ad_Soyad,
      permissions: permissions
    });
  } catch (error) {
    console.error('Login hatasi:', error);
    res.status(500).json({ error: 'Giris islemi basarisiz' });
  }
});

// Siparis olusturma
app.post('/api/orders', (req, res) => {
  const orderData = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO siparisler (date, order_no, location, customer_name, customer_address,
        customer_country, customer_city, customer_phone, customer_email,
        salesman, conference, agency, guide, products, process)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      orderData.date,
      orderData.orderNo,
      orderData.location,
      orderData.customerInfo.nameSurname,
      orderData.customerInfo.address,
      orderData.customerInfo.country,
      orderData.customerInfo.city,
      orderData.customerInfo.phone,
      orderData.customerInfo.email,
      orderData.shipping.salesman,
      orderData.shipping.conference,
      orderData.shipping.agency,
      orderData.shipping.guide,
      JSON.stringify(orderData.products),
      'Sipariş Oluşturuldu'
    );

    res.status(201).json({
      message: 'Siparis basariyla kaydedildi',
      orderId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Siparis kaydetme hatasi:', error);
    res.status(500).json({ error: 'Siparis kaydedilemedi' });
  }
});

// Tum siparisleri getir
app.get('/api/orders', (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM siparisler ORDER BY date DESC').all();
    res.json(orders);
  } catch (error) {
    console.error('Siparisleri getirme hatasi:', error);
    res.status(500).json({ error: 'Siparisler getirilemedi' });
  }
});

// Siparis durumunu guncelle
app.put('/api/orders/:id/process', (req, res) => {
  const { id } = req.params;
  const { process } = req.body;

  try {
    const result = db.prepare('UPDATE siparisler SET process = ? WHERE id = ?').run(process, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Siparis bulunamadi' });
    }

    res.json({
      message: 'Siparis durumu basariyla guncellendi',
      process: process,
      orderId: id
    });
  } catch (error) {
    console.error('Durum guncelleme hatasi:', error);
    res.status(500).json({ error: 'Siparis durumu guncellenemedi' });
  }
});

// Kullanici listesi
app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, Ad_Soyad, email, telefon, yetki FROM users').all();
    res.json(users);
  } catch (error) {
    console.error('Kullanici listesi hatasi:', error);
    res.status(500).json({ error: 'Kullanici listesi alinamadi' });
  }
});

// Kullanici yetkisini guncelle
app.put('/api/users/:id/role', (req, res) => {
  const { id } = req.params;
  const { yetki } = req.body;

  const validRoles = ['Operasyon Sorumlusu', 'Depo Görevlisi', 'Lojistik Sorumlusu'];
  if (!validRoles.includes(yetki)) {
    return res.status(400).json({ error: 'Gecersiz yetki' });
  }

  try {
    const user = db.prepare('SELECT yetki FROM users WHERE id = ?').get(id);

    if (!user) {
      return res.status(404).json({ error: 'Kullanici bulunamadi' });
    }

    if (user.yetki === 'Patron') {
      return res.status(403).json({ error: 'Patron rolundeki kullanicinin yetkisi degistirilemez' });
    }

    db.prepare('UPDATE users SET yetki = ? WHERE id = ?').run(yetki, id);

    res.json({
      message: 'Yetki basariyla guncellendi',
      userId: id,
      yetki: yetki
    });
  } catch (error) {
    console.error('Yetki guncelleme hatasi:', error);
    res.status(500).json({ error: 'Yetki guncellenemedi' });
  }
});

// Kullanicinin ek yetkilerini getir
app.get('/api/users/:id/permissions', (req, res) => {
  const { id } = req.params;

  try {
    const user = db.prepare('SELECT ek_yetkiler FROM users WHERE id = ?').get(id);

    if (!user) {
      return res.status(404).json({ error: 'Kullanici bulunamadi' });
    }

    const permissions = user.ek_yetkiler ? user.ek_yetkiler.split(',') : [];
    res.json({ permissions });
  } catch (error) {
    console.error('Ek yetkileri getirme hatasi:', error);
    res.status(500).json({ error: 'Ek yetkiler getirilemedi' });
  }
});

// Kullanicinin ek yetkilerini guncelle
app.put('/api/users/:id/permissions', (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;

  try {
    const user = db.prepare('SELECT yetki FROM users WHERE id = ?').get(id);

    if (!user) {
      return res.status(404).json({ error: 'Kullanici bulunamadi' });
    }

    if (user.yetki === 'Patron') {
      return res.status(403).json({ error: 'Patron rolundeki kullanicinin ek yetkileri degistirilemez' });
    }

    const permissionsString = Array.isArray(permissions) ? permissions.join(',') : '';
    db.prepare('UPDATE users SET ek_yetkiler = ? WHERE id = ?').run(permissionsString, id);

    res.json({
      message: 'Ek yetkiler basariyla guncellendi',
      userId: id,
      permissions: permissions
    });
  } catch (error) {
    console.error('Ek yetki guncelleme hatasi:', error);
    res.status(500).json({ error: 'Ek yetkiler guncellenemedi' });
  }
});

// ==================== MUSTERI API ENDPOINTS ====================

// Tum musterileri getir
app.get('/api/customers', (req, res) => {
  try {
    const customers = db.prepare('SELECT * FROM musteriler ORDER BY name ASC').all();
    res.json(customers);
  } catch (error) {
    console.error('Musteri listesi hatasi:', error);
    res.status(500).json({ error: 'Musteriler getirilemedi' });
  }
});

// Musteri ara
app.get('/api/customers/search', (req, res) => {
  const { q } = req.query;
  try {
    const customers = db.prepare(`
      SELECT * FROM musteriler
      WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?
      ORDER BY name ASC
    `).all(`%${q}%`, `%${q}%`, `%${q}%`);
    res.json(customers);
  } catch (error) {
    console.error('Musteri arama hatasi:', error);
    res.status(500).json({ error: 'Arama basarisiz' });
  }
});

// Yeni musteri ekle
app.post('/api/customers', (req, res) => {
  const { name, email, phone, country, city, address, notes } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO musteriler (name, email, phone, country, city, address, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, email, phone, country, city, address, notes);

    res.status(201).json({
      message: 'Musteri basariyla eklendi',
      customerId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Musteri ekleme hatasi:', error);
    res.status(500).json({ error: 'Musteri eklenemedi' });
  }
});

// Musteri guncelle
app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, phone, country, city, address, notes } = req.body;

  try {
    const result = db.prepare(`
      UPDATE musteriler SET name=?, email=?, phone=?, country=?, city=?, address=?, notes=?
      WHERE id=?
    `).run(name, email, phone, country, city, address, notes, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Musteri bulunamadi' });
    }

    res.json({ message: 'Musteri guncellendi', customerId: id });
  } catch (error) {
    console.error('Musteri guncelleme hatasi:', error);
    res.status(500).json({ error: 'Musteri guncellenemedi' });
  }
});

// Musteri sil
app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;

  try {
    const result = db.prepare('DELETE FROM musteriler WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Musteri bulunamadi' });
    }

    res.json({ message: 'Musteri silindi' });
  } catch (error) {
    console.error('Musteri silme hatasi:', error);
    res.status(500).json({ error: 'Musteri silinemedi' });
  }
});

// ==================== URUN API ENDPOINTS ====================

// Tum urunleri getir
app.get('/api/products', (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM urunler ORDER BY name ASC').all();
    res.json(products);
  } catch (error) {
    console.error('Urun listesi hatasi:', error);
    res.status(500).json({ error: 'Urunler getirilemedi' });
  }
});

// Yeni urun ekle
app.post('/api/products', (req, res) => {
  const { name, category, default_price, default_cost, sizes, description, in_stock } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO urunler (name, category, default_price, default_cost, sizes, description, in_stock)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, category, default_price, default_cost, sizes, description, in_stock ? 1 : 0);

    res.status(201).json({
      message: 'Urun basariyla eklendi',
      productId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Urun ekleme hatasi:', error);
    res.status(500).json({ error: 'Urun eklenemedi' });
  }
});

// Urun guncelle
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, category, default_price, default_cost, sizes, description, in_stock } = req.body;

  try {
    const result = db.prepare(`
      UPDATE urunler SET name=?, category=?, default_price=?, default_cost=?, sizes=?, description=?, in_stock=?
      WHERE id=?
    `).run(name, category, default_price, default_cost, sizes, description, in_stock ? 1 : 0, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Urun bulunamadi' });
    }

    res.json({ message: 'Urun guncellendi', productId: id });
  } catch (error) {
    console.error('Urun guncelleme hatasi:', error);
    res.status(500).json({ error: 'Urun guncellenemedi' });
  }
});

// Urun sil
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;

  try {
    const result = db.prepare('DELETE FROM urunler WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Urun bulunamadi' });
    }

    res.json({ message: 'Urun silindi' });
  } catch (error) {
    console.error('Urun silme hatasi:', error);
    res.status(500).json({ error: 'Urun silinemedi' });
  }
});

// Server'i baslat
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('========================================');
  console.log(`  Server ${PORT} portunda calisiyor`);
  console.log('========================================');
  console.log('');
  console.log('API Endpoints:');
  console.log(`  http://localhost:${PORT}/api/login`);
  console.log(`  http://localhost:${PORT}/api/register`);
  console.log(`  http://localhost:${PORT}/api/orders`);
  console.log(`  http://localhost:${PORT}/api/users`);
  console.log('');
  console.log('Demo Giris Bilgileri:');
  console.log('  Patron: admin@test.com / 123456');
  console.log('  User:   test@test.com / 123456');
  console.log('');
});
