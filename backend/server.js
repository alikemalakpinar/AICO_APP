const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const sqlite3 = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Uploads klasörünü oluştur
const uploadsDir = path.join(__dirname, 'uploads');
const passportDir = path.join(uploadsDir, 'passports');
const signaturesDir = path.join(uploadsDir, 'signatures');
const documentsDir = path.join(uploadsDir, 'documents');

[uploadsDir, passportDir, signaturesDir, documentsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static dosyalar için uploads klasörünü serve et
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// SQLite veritabani baglantisi
const dbPath = path.join(__dirname, 'database.sqlite');

// Veritabani dosyasi var mi kontrol et, yoksa veya sorunluysa sil ve yeniden olustur
try {
  // Dosya varsa yazma izni kontrol et
  if (fs.existsSync(dbPath)) {
    fs.accessSync(dbPath, fs.constants.W_OK);
  }
} catch (err) {
  console.log('Veritabani dosyasi yazilabilir degil, yeniden olusturuluyor...');
  try {
    fs.unlinkSync(dbPath);
  } catch (e) {
    // Dosya silinemezse devam et
  }
}

const db = sqlite3(dbPath);

function addColumnIfNotExists(table, column, type) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = columns.some(c => c.name === column);

  if (!exists) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    console.log(`Added column ${column} to ${table} table`);
  }
}


// ==================== DATABASE TABLES ====================

// Users tablosu
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    Ad_Soyad TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefon TEXT,
    sifre TEXT NOT NULL,
    yetki TEXT DEFAULT 'Operasyon Sorumlusu',
    ek_yetkiler TEXT,
    branch_id INTEGER,
    avatar TEXT,
    last_login TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Subeler (Branches) tablosu
db.exec(`
  CREATE TABLE IF NOT EXISTS subeler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'Türkiye',
    phone TEXT,
    email TEXT,
    manager_id INTEGER,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Musteriler tablosu (enhanced)
db.exec(`
  CREATE TABLE IF NOT EXISTS musteriler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    phone_country_code TEXT DEFAULT '+90',
    phone_formatted TEXT,
    country TEXT,
    country_code TEXT,
    city TEXT,
    state TEXT,
    address TEXT,
    postal_code TEXT,
    shipping_address TEXT,
    shipping_city TEXT,
    shipping_state TEXT,
    shipping_country TEXT,
    shipping_postal_code TEXT,
    tax_number TEXT,
    passport_number TEXT,
    id_number TEXT,
    notes TEXT,
    documents TEXT,
    total_orders INTEGER DEFAULT 0,
    total_spent REAL DEFAULT 0,
    latitude REAL,
    longitude REAL,
    customer_type TEXT DEFAULT 'individual',
    created_by INTEGER,
    updated_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Urunler tablosu (enhanced)
db.exec(`
  CREATE TABLE IF NOT EXISTS urunler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT,
    barcode TEXT,
    category TEXT,
    default_price REAL,
    default_cost REAL,
    price_local REAL,
    price_usd REAL,
    currency TEXT DEFAULT 'TRY',
    width REAL,
    height REAL,
    sqm REAL,
    unit_type TEXT DEFAULT 'piece',
    sizes TEXT,
    description TEXT,
    in_stock INTEGER DEFAULT 1,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_alert INTEGER DEFAULT 5,
    branch_id INTEGER,
    images TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Sube Stok tablosu
db.exec(`
  CREATE TABLE IF NOT EXISTS sube_stok (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    location TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES subeler(id),
    FOREIGN KEY (product_id) REFERENCES urunler(id)
  )
`);

// Siparisler tablosu (enhanced)
db.exec(`
  CREATE TABLE IF NOT EXISTS siparisler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    order_no TEXT UNIQUE,
    order_type TEXT DEFAULT 'sale',
    branch_id INTEGER,
    location TEXT,
    customer_id INTEGER,
    customer_name TEXT,
    customer_address TEXT,
    customer_country TEXT,
    customer_city TEXT,
    customer_state TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    customer_zip_code TEXT,
    customer_passport_no TEXT,
    customer_tax_no TEXT,
    shipping_address TEXT,
    shipping_city TEXT,
    shipping_state TEXT,
    shipping_country TEXT,
    shipping_postal_code TEXT,
    salesman TEXT,
    salesman_id INTEGER,
    conference TEXT,
    cruise TEXT,
    agency TEXT,
    guide TEXT,
    pax TEXT,
    products TEXT,
    subtotal REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    discount_type TEXT DEFAULT 'amount',
    tax REAL DEFAULT 0,
    total REAL DEFAULT 0,
    currency TEXT DEFAULT 'TRY',
    exchange_rate REAL DEFAULT 1,
    payment_method TEXT,
    process TEXT DEFAULT 'Sipariş Oluşturuldu',
    payment_status TEXT DEFAULT 'pending',
    photos TEXT,
    passport_image TEXT,
    customer_signature TEXT,
    cargo_company TEXT,
    cargo_tracking TEXT,
    bus_number TEXT,
    transport_number TEXT,
    estimated_delivery TEXT,
    actual_delivery TEXT,
    notes TEXT,
    internal_notes TEXT,
    created_by INTEGER,
    updated_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
// ==================== MIGRATIONS ====================

// urunler tablosu migration
addColumnIfNotExists('urunler', 'sku', 'TEXT');
addColumnIfNotExists('urunler', 'barcode', 'TEXT');
addColumnIfNotExists('urunler', 'category', 'TEXT');
addColumnIfNotExists('urunler', 'default_price', 'REAL');
addColumnIfNotExists('urunler', 'default_cost', 'REAL');
addColumnIfNotExists('urunler', 'price_local', 'REAL');
addColumnIfNotExists('urunler', 'price_usd', 'REAL');
addColumnIfNotExists('urunler', 'currency', "TEXT DEFAULT 'TRY'");
addColumnIfNotExists('urunler', 'width', 'REAL');
addColumnIfNotExists('urunler', 'height', 'REAL');
addColumnIfNotExists('urunler', 'sqm', 'REAL');
addColumnIfNotExists('urunler', 'unit_type', "TEXT DEFAULT 'piece'");
addColumnIfNotExists('urunler', 'sizes', 'TEXT');
addColumnIfNotExists('urunler', 'description', 'TEXT');
addColumnIfNotExists('urunler', 'in_stock', 'INTEGER DEFAULT 1');
addColumnIfNotExists('urunler', 'stock_quantity', 'INTEGER DEFAULT 0');
addColumnIfNotExists('urunler', 'min_stock_alert', 'INTEGER DEFAULT 5');
addColumnIfNotExists('urunler', 'branch_id', 'INTEGER');
addColumnIfNotExists('urunler', 'images', 'TEXT');
addColumnIfNotExists('urunler', 'updated_at', 'TEXT');


// Migration: Add new columns to siparisler table if they don't exist
const siparislerColumns = db.prepare("PRAGMA table_info(siparisler)").all().map(c => c.name);
const newColumns = [
  { name: 'customer_zip_code', type: 'TEXT' },
  { name: 'customer_passport_no', type: 'TEXT' },
  { name: 'customer_tax_no', type: 'TEXT' },
  { name: 'cruise', type: 'TEXT' },
  { name: 'pax', type: 'TEXT' },
  { name: 'payment_method', type: 'TEXT' },
  { name: 'passport_image', type: 'TEXT' },
  { name: 'customer_signature', type: 'TEXT' }
];
newColumns.forEach(col => {
  if (!siparislerColumns.includes(col.name)) {
    try {
      db.exec(`ALTER TABLE siparisler ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Added column ${col.name} to siparisler table`);
    } catch (e) {
      // Column might already exist
    }
  }
});

// Odemeler (Payments) tablosu
db.exec(`
  CREATE TABLE IF NOT EXISTS odemeler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    customer_id INTEGER,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'TRY',
    payment_method TEXT NOT NULL,
    card_type TEXT,
    card_last_four TEXT,
    installments INTEGER DEFAULT 1,
    transaction_id TEXT,
    status TEXT DEFAULT 'pending',
    payment_date TEXT DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES siparisler(id),
    FOREIGN KEY (customer_id) REFERENCES musteriler(id)
  )
`);

// Kur (Exchange Rates) tablosu
db.exec(`
  CREATE TABLE IF NOT EXISTS kur_oranlari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    currency_from TEXT NOT NULL,
    currency_to TEXT NOT NULL,
    rate REAL NOT NULL,
    auto_update INTEGER DEFAULT 1,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Islem Kayitlari (Activity Logs) tablosu
db.exec(`
  CREATE TABLE IF NOT EXISTS islem_kayitlari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    entity_name TEXT,
    old_value TEXT,
    new_value TEXT,
    details TEXT,
    ip_address TEXT,
    branch_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Musteri Belgeleri tablosu
db.exec(`
  CREATE TABLE IF NOT EXISTS musteri_belgeleri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    document_type TEXT NOT NULL,
    document_name TEXT,
    document_data TEXT,
    file_path TEXT,
    mime_type TEXT,
    uploaded_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES musteriler(id)
  )
`);

// Bildirimler tablosu
db.exec(`
  CREATE TABLE IF NOT EXISTS bildirimler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    entity_type TEXT,
    entity_id INTEGER,
    is_read INTEGER DEFAULT 0,
    email_sent INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Sevkiyat Gecmisi tablosu
db.exec(`
  CREATE TABLE IF NOT EXISTS sevkiyat_gecmisi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    location TEXT,
    notes TEXT,
    updated_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES siparisler(id)
  )
`);

// ==================== DEMO DATA ====================

// Demo subeler
const branchCount = db.prepare('SELECT COUNT(*) as count FROM subeler').get();
if (branchCount.count === 0) {
  const branches = [
    { name: 'Bilgins ByKync', code: 'BYK-001', city: 'İstanbul', state: 'Marmara', address: 'Kapalıçarşı No:45' },
    { name: 'PashaPort Rug & Jewellery', code: 'PPR-001', city: 'İstanbul', state: 'Marmara', address: 'Sultanahmet' },
    { name: 'Pasha Rug Village', code: 'PRV-001', city: 'İstanbul', state: 'Marmara', address: 'Arasta Bazaar' },
    { name: 'ByHand Rugs', code: 'BHR-001', city: 'İstanbul', state: 'Marmara', address: 'Grand Bazaar' }
  ];

  const insertBranch = db.prepare(`
    INSERT INTO subeler (name, code, city, state, address)
    VALUES (?, ?, ?, ?, ?)
  `);

  branches.forEach(b => insertBranch.run(b.name, b.code, b.city, b.state, b.address));
  console.log('Demo subeler olusturuldu');
}

// Demo kullanicilar
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const hashedPassword = bcrypt.hashSync('123456', 10);

  db.prepare(`
    INSERT INTO users (Ad_Soyad, email, telefon, sifre, yetki, ek_yetkiler, branch_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('Admin User', 'admin@test.com', '555-0001', hashedPassword, 'Patron', 'finansal_goruntuleme,rapor_goruntuleme,belge_olusturma', 1);

  db.prepare(`
    INSERT INTO users (Ad_Soyad, email, telefon, sifre, yetki, branch_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Test User', 'test@test.com', '555-0002', hashedPassword, 'Operasyon Sorumlusu', 1);

  db.prepare(`
    INSERT INTO users (Ad_Soyad, email, telefon, sifre, yetki, branch_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Depo Sorumlusu', 'depo@test.com', '555-0003', hashedPassword, 'Depo Görevlisi', 2);

  console.log('Demo kullanicilar olusturuldu');
}

// Demo kur oranlari
const exchangeCount = db.prepare('SELECT COUNT(*) as count FROM kur_oranlari').get();
if (exchangeCount.count === 0) {
  const rates = [
    { from: 'USD', to: 'TRY', rate: 34.50 },
    { from: 'EUR', to: 'TRY', rate: 36.20 },
    { from: 'GBP', to: 'TRY', rate: 43.50 },
    { from: 'TRY', to: 'USD', rate: 0.029 },
    { from: 'TRY', to: 'EUR', rate: 0.028 }
  ];

  const insertRate = db.prepare(`
    INSERT INTO kur_oranlari (currency_from, currency_to, rate)
    VALUES (?, ?, ?)
  `);

  rates.forEach(r => insertRate.run(r.from, r.to, r.rate));
  console.log('Demo kur oranlari olusturuldu');
}

// Demo siparisler
const orderCount = db.prepare('SELECT COUNT(*) as count FROM siparisler').get();
if (orderCount.count === 0) {
  const demoOrders = [
    {
      date: '2024-12-09',
      order_no: generateOrderNumber(),
      order_type: 'sale',
      branch_id: 1,
      location: 'Istanbul',
      customer_name: 'Ahmet Yilmaz',
      customer_address: 'Kadikoy, Istanbul',
      customer_country: 'Almanya',
      customer_city: 'Berlin',
      customer_state: 'Berlin',
      customer_phone: '+90 532 111 2233',
      customer_email: 'ahmet@example.com',
      salesman: 'Mehmet Demir',
      conference: 'Hali Fuari 2024',
      agency: 'Premium Tours',
      guide: 'Ali Kaya',
      products: JSON.stringify([
        { name: 'El Dokuma Hali', quantity: 2, size: '200x300', width: 200, height: 300, sqm: 6, price: 1500, cost: 800, notes: 'Ozel siparis' },
        { name: 'Ipek Hali', quantity: 1, size: '150x200', width: 150, height: 200, sqm: 3, price: 2500, cost: 1200, notes: '' }
      ]),
      subtotal: 5500,
      total: 5500,
      process: 'Teslim Edildi',
      payment_status: 'paid'
    },
    {
      date: '2024-12-08',
      order_no: generateOrderNumber(),
      order_type: 'sale',
      branch_id: 2,
      location: 'Ankara',
      customer_name: 'Hans Mueller',
      customer_address: 'Munich, Germany',
      customer_country: 'Almanya',
      customer_city: 'Munih',
      customer_state: 'Bavaria',
      customer_phone: '+49 123 456 7890',
      customer_email: 'hans@example.de',
      salesman: 'Ayse Ozturk',
      conference: '',
      agency: 'Euro Travel',
      guide: 'Fatma Yildiz',
      products: JSON.stringify([
        { name: 'Antik Hali', quantity: 1, size: '300x400', width: 300, height: 400, sqm: 12, price: 5000, cost: 2500, notes: 'Koleksiyon parcasi' }
      ]),
      subtotal: 5000,
      total: 5000,
      process: 'Transfer Aşamasında',
      payment_status: 'partial'
    },
    {
      date: '2024-12-07',
      order_no: generateOrderNumber(),
      order_type: 'sale',
      branch_id: 3,
      location: 'Izmir',
      customer_name: 'Marie Dubois',
      customer_address: 'Paris, France',
      customer_country: 'Fransa',
      customer_city: 'Paris',
      customer_state: 'Île-de-France',
      customer_phone: '+33 1 23 45 67 89',
      customer_email: 'marie@example.fr',
      salesman: 'Mehmet Demir',
      conference: 'Dekorasyon Fuari',
      agency: 'France Tours',
      guide: 'Kemal Aslan',
      products: JSON.stringify([
        { name: 'Modern Hali', quantity: 3, size: '100x150', width: 100, height: 150, sqm: 1.5, price: 800, cost: 400, notes: '' },
        { name: 'Kilim', quantity: 2, size: '80x120', width: 80, height: 120, sqm: 0.96, price: 350, cost: 150, notes: 'Hediye paketleme' }
      ]),
      subtotal: 3100,
      total: 3100,
      process: 'Sipariş Oluşturuldu',
      payment_status: 'pending'
    }
  ];

  const insertOrder = db.prepare(`
    INSERT INTO siparisler (date, order_no, order_type, branch_id, location, customer_name, customer_address,
      customer_country, customer_city, customer_state, customer_phone, customer_email,
      salesman, conference, agency, guide, products, subtotal, total, process, payment_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  demoOrders.forEach(order => {
    insertOrder.run(
      order.date, order.order_no, order.order_type, order.branch_id, order.location,
      order.customer_name, order.customer_address, order.customer_country, order.customer_city,
      order.customer_state, order.customer_phone, order.customer_email, order.salesman,
      order.conference, order.agency, order.guide, order.products, order.subtotal,
      order.total, order.process, order.payment_status
    );
  });

  console.log('Demo siparisler olusturuldu');
}

// Demo urunler
const productCount = db.prepare('SELECT COUNT(*) as count FROM urunler').get();
if (productCount.count === 0) {
  const products = [
    { name: 'El Dokuma Halı', sku: 'ED-001', barcode: '8690001000001', category: 'El Dokuma', price: 1500, cost: 800, price_usd: 43.48, width: 200, height: 300, sqm: 6 },
    { name: 'İpek Halı', sku: 'IP-001', barcode: '8690001000002', category: 'İpek', price: 2500, cost: 1200, price_usd: 72.46, width: 150, height: 200, sqm: 3 },
    { name: 'Antik Halı', sku: 'AN-001', barcode: '8690001000003', category: 'Antika', price: 5000, cost: 2500, price_usd: 144.93, width: 300, height: 400, sqm: 12 },
    { name: 'Modern Halı', sku: 'MD-001', barcode: '8690001000004', category: 'Modern', price: 800, cost: 400, price_usd: 23.19, width: 100, height: 150, sqm: 1.5 },
    { name: 'Kilim', sku: 'KL-001', barcode: '8690001000005', category: 'Kilim', price: 350, cost: 150, price_usd: 10.14, width: 80, height: 120, sqm: 0.96 },
    { name: 'Yolluk Halı', sku: 'YL-001', barcode: '8690001000006', category: 'Yolluk', price: 450, cost: 200, price_usd: 13.04, width: 80, height: 300, sqm: 2.4 }
  ];

  const insertProduct = db.prepare(`
    INSERT INTO urunler (name, sku, barcode, category, default_price, default_cost, price_local, price_usd, width, height, sqm, stock_quantity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  products.forEach(p => {
    insertProduct.run(p.name, p.sku, p.barcode, p.category, p.price, p.cost, p.price, p.price_usd, p.width, p.height, p.sqm, 100);
  });

  console.log('Demo urunler olusturuldu');
}

console.log('SQLite veritabanina baglandi');

// ==================== HELPER FUNCTIONS ====================

function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

function logActivity(userId, userName, action, entityType, entityId, entityName, oldValue, newValue, details, branchId) {
  try {
    db.prepare(`
      INSERT INTO islem_kayitlari (user_id, user_name, action, entity_type, entity_id, entity_name, old_value, new_value, details, branch_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, userName, action, entityType, entityId, entityName,
           oldValue ? JSON.stringify(oldValue) : null,
           newValue ? JSON.stringify(newValue) : null,
           details, branchId);
  } catch (error) {
    console.error('Activity log hatasi:', error);
  }
}

function createNotification(userId, title, message, type, entityType, entityId) {
  try {
    db.prepare(`
      INSERT INTO bildirimler (user_id, title, message, type, entity_type, entity_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, title, message, type, entityType, entityId);
  } catch (error) {
    console.error('Notification hatasi:', error);
  }
}

function formatPhoneNumber(phone, countryCode) {
  if (!phone) return '';

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Format based on country code
  switch(countryCode) {
    case '+90': // Turkey
      if (cleaned.length === 10) {
        return `${cleaned.slice(0,3)} ${cleaned.slice(3,6)} ${cleaned.slice(6,8)} ${cleaned.slice(8)}`;
      }
      break;
    case '+1': // USA/Canada
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
      }
      break;
    case '+49': // Germany
      if (cleaned.length >= 10) {
        return `${cleaned.slice(0,3)} ${cleaned.slice(3,6)} ${cleaned.slice(6)}`;
      }
      break;
    case '+44': // UK
      if (cleaned.length === 10) {
        return `${cleaned.slice(0,4)} ${cleaned.slice(4)}`;
      }
      break;
    default:
      return cleaned;
  }

  return cleaned;
}

// ==================== API ENDPOINTS ====================

// ==================== AUTH ====================

// Kullanici kaydi
app.post('/api/register', async (req, res) => {
  const { Ad_Soyad, email, telefon, sifre, sifre_tekrar, branch_id } = req.body;

  if (sifre !== sifre_tekrar) {
    return res.status(400).json({ error: 'Sifreler eslesmiyor' });
  }

  try {
    const hashedPassword = await bcrypt.hash(sifre, 10);

    const stmt = db.prepare(`
      INSERT INTO users (Ad_Soyad, email, telefon, sifre, yetki, branch_id)
      VALUES (?, ?, ?, ?, 'Operasyon Sorumlusu', ?)
    `);

    const result = stmt.run(Ad_Soyad, email, telefon, hashedPassword, branch_id || 1);

    logActivity(result.lastInsertRowid, Ad_Soyad, 'register', 'user', result.lastInsertRowid, Ad_Soyad, null, null, 'Yeni kullanici kaydi', branch_id);

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
  const { email, sifre, branch_id } = req.body;

  if (!email || !sifre) {
    return res.status(400).json({ error: 'Email ve sifre gerekli' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ error: 'Email veya sifre hatali' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Hesabiniz devre disi birakilmis' });
    }

    const isPasswordValid = await bcrypt.compare(sifre, user.sifre);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email veya sifre hatali' });
    }

    // Update last login
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    // Log activity
    logActivity(user.id, user.Ad_Soyad, 'login', 'user', user.id, user.Ad_Soyad, null, null, 'Kullanici girisi', branch_id || user.branch_id);

    const permissions = user.ek_yetkiler ? user.ek_yetkiler.split(',') : [];

    // Get branch info
    let branch = null;
    const activeBranchId = branch_id || user.branch_id;
    if (activeBranchId) {
      branch = db.prepare('SELECT * FROM subeler WHERE id = ?').get(activeBranchId);
    }

    res.json({
      message: 'Giris basarili',
      userId: user.id,
      yetki: user.yetki,
      Ad_Soyad: user.Ad_Soyad,
      email: user.email,
      permissions: permissions,
      branch_id: activeBranchId,
      branch: branch
    });
  } catch (error) {
    console.error('Login hatasi:', error);
    res.status(500).json({ error: 'Giris islemi basarisiz' });
  }
});

// ==================== USERS ====================

// Kullanici listesi
app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.Ad_Soyad, u.email, u.telefon, u.yetki, u.branch_id, u.is_active, u.last_login,
             s.name as branch_name
      FROM users u
      LEFT JOIN subeler s ON u.branch_id = s.id
    `).all();
    res.json(users);
  } catch (error) {
    console.error('Kullanici listesi hatasi:', error);
    res.status(500).json({ error: 'Kullanici listesi alinamadi' });
  }
});

// Kullanici detay
app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  try {
    const user = db.prepare(`
      SELECT u.*, s.name as branch_name
      FROM users u
      LEFT JOIN subeler s ON u.branch_id = s.id
      WHERE u.id = ?
    `).get(id);

    if (!user) {
      return res.status(404).json({ error: 'Kullanici bulunamadi' });
    }

    // Remove password
    delete user.sifre;

    res.json(user);
  } catch (error) {
    console.error('Kullanici detay hatasi:', error);
    res.status(500).json({ error: 'Kullanici getirilemedi' });
  }
});

// Kullanici yetkisini guncelle
app.put('/api/users/:id/role', (req, res) => {
  const { id } = req.params;
  const { yetki, updated_by } = req.body;

  const validRoles = ['Operasyon Sorumlusu', 'Depo Görevlisi', 'Lojistik Sorumlusu'];
  if (!validRoles.includes(yetki)) {
    return res.status(400).json({ error: 'Gecersiz yetki' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

    if (!user) {
      return res.status(404).json({ error: 'Kullanici bulunamadi' });
    }

    if (user.yetki === 'Patron') {
      return res.status(403).json({ error: 'Patron rolundeki kullanicinin yetkisi degistirilemez' });
    }

    const oldRole = user.yetki;
    db.prepare('UPDATE users SET yetki = ? WHERE id = ?').run(yetki, id);

    logActivity(updated_by, null, 'update_role', 'user', id, user.Ad_Soyad, { yetki: oldRole }, { yetki }, 'Yetki degistirildi', user.branch_id);

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
  const { permissions, updated_by } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

    if (!user) {
      return res.status(404).json({ error: 'Kullanici bulunamadi' });
    }

    if (user.yetki === 'Patron') {
      return res.status(403).json({ error: 'Patron rolundeki kullanicinin ek yetkileri degistirilemez' });
    }

    const oldPermissions = user.ek_yetkiler;
    const permissionsString = Array.isArray(permissions) ? permissions.join(',') : '';
    db.prepare('UPDATE users SET ek_yetkiler = ? WHERE id = ?').run(permissionsString, id);

    logActivity(updated_by, null, 'update_permissions', 'user', id, user.Ad_Soyad, { permissions: oldPermissions }, { permissions: permissionsString }, 'Ek yetkiler degistirildi', user.branch_id);

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

// Kullanici subesini guncelle
app.put('/api/users/:id/branch', (req, res) => {
  const { id } = req.params;
  const { branch_id, updated_by } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'Kullanici bulunamadi' });
    }

    const oldBranch = user.branch_id;
    db.prepare('UPDATE users SET branch_id = ? WHERE id = ?').run(branch_id, id);

    logActivity(updated_by, null, 'update_branch', 'user', id, user.Ad_Soyad, { branch_id: oldBranch }, { branch_id }, 'Sube degistirildi', branch_id);

    res.json({ message: 'Sube basariyla guncellendi', userId: id, branch_id });
  } catch (error) {
    console.error('Sube guncelleme hatasi:', error);
    res.status(500).json({ error: 'Sube guncellenemedi' });
  }
});

// ==================== BRANCHES ====================

// Tum subeleri getir
app.get('/api/branches', (req, res) => {
  try {
    const branches = db.prepare(`
      SELECT s.*, u.Ad_Soyad as manager_name,
             (SELECT COUNT(*) FROM users WHERE branch_id = s.id) as user_count,
             (SELECT COUNT(*) FROM siparisler WHERE branch_id = s.id) as order_count
      FROM subeler s
      LEFT JOIN users u ON s.manager_id = u.id
      ORDER BY s.name ASC
    `).all();
    res.json(branches);
  } catch (error) {
    console.error('Sube listesi hatasi:', error);
    res.status(500).json({ error: 'Subeler getirilemedi' });
  }
});

// Sube detay
app.get('/api/branches/:id', (req, res) => {
  const { id } = req.params;
  try {
    const branch = db.prepare(`
      SELECT s.*, u.Ad_Soyad as manager_name
      FROM subeler s
      LEFT JOIN users u ON s.manager_id = u.id
      WHERE s.id = ?
    `).get(id);

    if (!branch) {
      return res.status(404).json({ error: 'Sube bulunamadi' });
    }

    // Get branch users
    const users = db.prepare('SELECT id, Ad_Soyad, yetki FROM users WHERE branch_id = ?').all(id);
    branch.users = users;

    // Get branch stock
    const stock = db.prepare(`
      SELECT ss.*, u.name as product_name, u.sku
      FROM sube_stok ss
      JOIN urunler u ON ss.product_id = u.id
      WHERE ss.branch_id = ?
    `).all(id);
    branch.stock = stock;

    res.json(branch);
  } catch (error) {
    console.error('Sube detay hatasi:', error);
    res.status(500).json({ error: 'Sube getirilemedi' });
  }
});

// Yeni sube ekle
app.post('/api/branches', (req, res) => {
  const { name, code, address, city, state, country, phone, email, manager_id, created_by } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO subeler (name, code, address, city, state, country, phone, email, manager_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, code, address, city, state, country || 'Türkiye', phone, email, manager_id);

    logActivity(created_by, null, 'create', 'branch', result.lastInsertRowid, name, null, req.body, 'Yeni sube eklendi', result.lastInsertRowid);

    res.status(201).json({
      message: 'Sube basariyla eklendi',
      branchId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Sube ekleme hatasi:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Bu sube kodu zaten mevcut' });
    }
    res.status(500).json({ error: 'Sube eklenemedi' });
  }
});

// Sube guncelle
app.put('/api/branches/:id', (req, res) => {
  const { id } = req.params;
  const { name, code, address, city, state, country, phone, email, manager_id, is_active, updated_by } = req.body;

  try {
    const oldBranch = db.prepare('SELECT * FROM subeler WHERE id = ?').get(id);
    if (!oldBranch) {
      return res.status(404).json({ error: 'Sube bulunamadi' });
    }

    const result = db.prepare(`
      UPDATE subeler SET name=?, code=?, address=?, city=?, state=?, country=?, phone=?, email=?, manager_id=?, is_active=?
      WHERE id=?
    `).run(name, code, address, city, state, country, phone, email, manager_id, is_active ? 1 : 0, id);

    logActivity(updated_by, null, 'update', 'branch', id, name, oldBranch, req.body, 'Sube guncellendi', id);

    res.json({ message: 'Sube guncellendi', branchId: id });
  } catch (error) {
    console.error('Sube guncelleme hatasi:', error);
    res.status(500).json({ error: 'Sube guncellenemedi' });
  }
});

// Sube sil
app.delete('/api/branches/:id', (req, res) => {
  const { id } = req.params;
  const { deleted_by } = req.body;

  try {
    const branch = db.prepare('SELECT * FROM subeler WHERE id = ?').get(id);
    if (!branch) {
      return res.status(404).json({ error: 'Sube bulunamadi' });
    }

    // Check if branch has users
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE branch_id = ?').get(id);
    if (userCount.count > 0) {
      return res.status(400).json({ error: 'Bu subede kullanicilar mevcut. Once kullanicilari baska subeye aktarin.' });
    }

    db.prepare('DELETE FROM subeler WHERE id = ?').run(id);

    logActivity(deleted_by, null, 'delete', 'branch', id, branch.name, branch, null, 'Sube silindi', null);

    res.json({ message: 'Sube silindi' });
  } catch (error) {
    console.error('Sube silme hatasi:', error);
    res.status(500).json({ error: 'Sube silinemedi' });
  }
});

// Subeye gore kullanici listesi
app.get('/api/branches/:id/users', (req, res) => {
  const { id } = req.params;
  try {
    const users = db.prepare(`
      SELECT id, Ad_Soyad, email, telefon, yetki, avatar, is_active
      FROM users
      WHERE branch_id = ? AND is_active = 1
      ORDER BY Ad_Soyad
    `).all(id);
    res.json(users);
  } catch (error) {
    console.error('Sube kullanicilari getirme hatasi:', error);
    res.status(500).json({ error: 'Kullanicilar alinamadi' });
  }
});

// Satis girisi (Sube + Kullanici + Sifre)
app.post('/api/login/sales', async (req, res) => {
  const { branch_id, user_id, sifre } = req.body;

  try {
    // Kullaniciyi kontrol et
    const user = db.prepare(`
      SELECT u.*, s.name as branch_name, s.code as branch_code
      FROM users u
      LEFT JOIN subeler s ON u.branch_id = s.id
      WHERE u.id = ? AND u.branch_id = ? AND u.is_active = 1
    `).get(user_id, branch_id);

    if (!user) {
      return res.status(401).json({ error: 'Kullanici bu subede bulunamadi' });
    }

    // Sifre kontrolu
    const passwordMatch = await bcrypt.compare(sifre, user.sifre);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Yanlis sifre' });
    }

    // Son giris guncelle
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(new Date().toISOString(), user.id);

    // Aktivite kaydi
    logActivity(user.id, user.Ad_Soyad, 'login', 'user', user.id, user.Ad_Soyad, null, null, `Satis girisi - ${user.branch_name}`, branch_id);

    // Yetkileri parse et
    let permissions = [];
    if (user.ek_yetkiler) {
      try {
        permissions = JSON.parse(user.ek_yetkiler);
      } catch (e) {}
    }

    res.json({
      id: user.id,
      Ad_Soyad: user.Ad_Soyad,
      email: user.email,
      telefon: user.telefon,
      yetki: user.yetki,
      permissions,
      branch_id: user.branch_id,
      branch_name: user.branch_name,
      branch_code: user.branch_code,
      avatar: user.avatar,
    });
  } catch (error) {
    console.error('Satis girisi hatasi:', error);
    res.status(500).json({ error: 'Giris basarisiz' });
  }
});

// ==================== CUSTOMERS ====================

// Tum musterileri getir
app.get('/api/customers', (req, res) => {
  const { branch_id } = req.query;
  try {
    let query = 'SELECT * FROM musteriler';
    let params = [];

    if (branch_id) {
      query += ' WHERE created_by IN (SELECT id FROM users WHERE branch_id = ?)';
      params.push(branch_id);
    }

    query += ' ORDER BY name ASC';

    const customers = db.prepare(query).all(...params);
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
      WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR tax_number LIKE ? OR passport_number LIKE ?
      ORDER BY name ASC
    `).all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    res.json(customers);
  } catch (error) {
    console.error('Musteri arama hatasi:', error);
    res.status(500).json({ error: 'Arama basarisiz' });
  }
});

// Musteri detay
app.get('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  try {
    const customer = db.prepare('SELECT * FROM musteriler WHERE id = ?').get(id);
    if (!customer) {
      return res.status(404).json({ error: 'Musteri bulunamadi' });
    }

    // Get customer orders
    const orders = db.prepare('SELECT * FROM siparisler WHERE customer_id = ? ORDER BY date DESC').all(id);
    customer.orders = orders;

    // Get customer documents
    const documents = db.prepare('SELECT * FROM musteri_belgeleri WHERE customer_id = ?').all(id);
    customer.documents = documents;

    // Get activity logs
    const logs = db.prepare(`
      SELECT * FROM islem_kayitlari
      WHERE entity_type = 'customer' AND entity_id = ?
      ORDER BY created_at DESC LIMIT 20
    `).all(id);
    customer.activity_logs = logs;

    res.json(customer);
  } catch (error) {
    console.error('Musteri detay hatasi:', error);
    res.status(500).json({ error: 'Musteri getirilemedi' });
  }
});

// Yeni musteri ekle
app.post('/api/customers', (req, res) => {
  const {
    name, email, phone, phone_country_code, country, country_code, city, state, address, postal_code,
    shipping_address, shipping_city, shipping_state, shipping_country, shipping_postal_code,
    tax_number, passport_number, id_number, notes, customer_type, latitude, longitude, created_by
  } = req.body;

  try {
    const phone_formatted = formatPhoneNumber(phone, phone_country_code || '+90');

    const stmt = db.prepare(`
      INSERT INTO musteriler (name, email, phone, phone_country_code, phone_formatted, country, country_code, city, state, address, postal_code,
        shipping_address, shipping_city, shipping_state, shipping_country, shipping_postal_code,
        tax_number, passport_number, id_number, notes, customer_type, latitude, longitude, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, email, phone, phone_country_code || '+90', phone_formatted, country, country_code, city, state, address, postal_code,
      shipping_address, shipping_city, shipping_state, shipping_country, shipping_postal_code,
      tax_number, passport_number, id_number, notes, customer_type || 'individual', latitude, longitude, created_by);

    logActivity(created_by, null, 'create', 'customer', result.lastInsertRowid, name, null, req.body, 'Yeni musteri eklendi', null);

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
  const {
    name, email, phone, phone_country_code, country, country_code, city, state, address, postal_code,
    shipping_address, shipping_city, shipping_state, shipping_country, shipping_postal_code,
    tax_number, passport_number, id_number, notes, customer_type, latitude, longitude, updated_by
  } = req.body;

  try {
    const oldCustomer = db.prepare('SELECT * FROM musteriler WHERE id = ?').get(id);
    if (!oldCustomer) {
      return res.status(404).json({ error: 'Musteri bulunamadi' });
    }

    const phone_formatted = formatPhoneNumber(phone, phone_country_code || '+90');

    const result = db.prepare(`
      UPDATE musteriler SET
        name=?, email=?, phone=?, phone_country_code=?, phone_formatted=?, country=?, country_code=?, city=?, state=?, address=?, postal_code=?,
        shipping_address=?, shipping_city=?, shipping_state=?, shipping_country=?, shipping_postal_code=?,
        tax_number=?, passport_number=?, id_number=?, notes=?, customer_type=?, latitude=?, longitude=?, updated_by=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(name, email, phone, phone_country_code || '+90', phone_formatted, country, country_code, city, state, address, postal_code,
      shipping_address, shipping_city, shipping_state, shipping_country, shipping_postal_code,
      tax_number, passport_number, id_number, notes, customer_type, latitude, longitude, updated_by, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Musteri bulunamadi' });
    }

    logActivity(updated_by, null, 'update', 'customer', id, name, oldCustomer, req.body, 'Musteri guncellendi', null);

    res.json({ message: 'Musteri guncellendi', customerId: id });
  } catch (error) {
    console.error('Musteri guncelleme hatasi:', error);
    res.status(500).json({ error: 'Musteri guncellenemedi' });
  }
});

// Musteri sil
app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const { deleted_by } = req.body;

  try {
    const customer = db.prepare('SELECT * FROM musteriler WHERE id = ?').get(id);
    if (!customer) {
      return res.status(404).json({ error: 'Musteri bulunamadi' });
    }

    // Delete customer documents first
    db.prepare('DELETE FROM musteri_belgeleri WHERE customer_id = ?').run(id);

    // Delete customer
    db.prepare('DELETE FROM musteriler WHERE id = ?').run(id);

    logActivity(deleted_by, null, 'delete', 'customer', id, customer.name, customer, null, 'Musteri silindi', null);

    res.json({ message: 'Musteri silindi' });
  } catch (error) {
    console.error('Musteri silme hatasi:', error);
    res.status(500).json({ error: 'Musteri silinemedi' });
  }
});

// Musteri belgesi ekle
app.post('/api/customers/:id/documents', (req, res) => {
  const { id } = req.params;
  const { document_type, document_name, document_data, mime_type, uploaded_by } = req.body;

  try {
    const customer = db.prepare('SELECT * FROM musteriler WHERE id = ?').get(id);
    if (!customer) {
      return res.status(404).json({ error: 'Musteri bulunamadi' });
    }

    const stmt = db.prepare(`
      INSERT INTO musteri_belgeleri (customer_id, document_type, document_name, document_data, mime_type, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(id, document_type, document_name, document_data, mime_type, uploaded_by);

    logActivity(uploaded_by, null, 'upload_document', 'customer', id, customer.name, null, { document_type, document_name }, 'Belge yuklendi', null);

    res.status(201).json({
      message: 'Belge basariyla yuklendi',
      documentId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Belge yukleme hatasi:', error);
    res.status(500).json({ error: 'Belge yuklenemedi' });
  }
});

// Musteri belgeleri
app.get('/api/customers/:id/documents', (req, res) => {
  const { id } = req.params;
  try {
    const documents = db.prepare('SELECT * FROM musteri_belgeleri WHERE customer_id = ?').all(id);
    res.json(documents);
  } catch (error) {
    console.error('Belge listesi hatasi:', error);
    res.status(500).json({ error: 'Belgeler getirilemedi' });
  }
});

// Belge sil
app.delete('/api/customers/:customerId/documents/:docId', (req, res) => {
  const { customerId, docId } = req.params;
  const { deleted_by } = req.body;

  try {
    const doc = db.prepare('SELECT * FROM musteri_belgeleri WHERE id = ? AND customer_id = ?').get(docId, customerId);
    if (!doc) {
      return res.status(404).json({ error: 'Belge bulunamadi' });
    }

    db.prepare('DELETE FROM musteri_belgeleri WHERE id = ?').run(docId);

    logActivity(deleted_by, null, 'delete_document', 'customer', customerId, doc.document_name, doc, null, 'Belge silindi', null);

    res.json({ message: 'Belge silindi' });
  } catch (error) {
    console.error('Belge silme hatasi:', error);
    res.status(500).json({ error: 'Belge silinemedi' });
  }
});

// ==================== PRODUCTS ====================

// Tum urunleri getir
app.get('/api/products', (req, res) => {
  const { branch_id, category } = req.query;
  try {
    let query = 'SELECT * FROM urunler WHERE 1=1';
    let params = [];

    if (branch_id) {
      query += ' AND (branch_id = ? OR branch_id IS NULL)';
      params.push(branch_id);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY name ASC';

    const products = db.prepare(query).all(...params);
    res.json(products);
  } catch (error) {
    console.error('Urun listesi hatasi:', error);
    res.status(500).json({ error: 'Urunler getirilemedi' });
  }
});

// Urun barkod ile ara
app.get('/api/products/barcode/:barcode', (req, res) => {
  const { barcode } = req.params;
  try {
    const product = db.prepare('SELECT * FROM urunler WHERE barcode = ?').get(barcode);
    if (!product) {
      return res.status(404).json({ error: 'Urun bulunamadi' });
    }
    res.json(product);
  } catch (error) {
    console.error('Barkod arama hatasi:', error);
    res.status(500).json({ error: 'Urun getirilemedi' });
  }
});

// Urun detay
app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  try {
    const product = db.prepare('SELECT * FROM urunler WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).json({ error: 'Urun bulunamadi' });
    }

    // Get branch stocks
    const stocks = db.prepare(`
      SELECT ss.*, s.name as branch_name
      FROM sube_stok ss
      JOIN subeler s ON ss.branch_id = s.id
      WHERE ss.product_id = ?
    `).all(id);
    product.branch_stocks = stocks;

    res.json(product);
  } catch (error) {
    console.error('Urun detay hatasi:', error);
    res.status(500).json({ error: 'Urun getirilemedi' });
  }
});

// Yeni urun ekle
app.post('/api/products', (req, res) => {
  const {
    name, sku, barcode, category, default_price, default_cost, price_local, price_usd, currency,
    width, height, unit_type, sizes, description, in_stock, stock_quantity, min_stock_alert, branch_id, images, created_by
  } = req.body;

  try {
    // Calculate sqm if dimensions provided
    const sqm = width && height ? (width * height / 10000) : null;

    const stmt = db.prepare(`
      INSERT INTO urunler (name, sku, barcode, category, default_price, default_cost, price_local, price_usd, currency,
        width, height, sqm, unit_type, sizes, description, in_stock, stock_quantity, min_stock_alert, branch_id, images)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, sku, barcode, category, default_price, default_cost, price_local || default_price, price_usd, currency || 'TRY',
      width, height, sqm, unit_type || 'piece', sizes, description, in_stock ? 1 : 0, stock_quantity || 0, min_stock_alert || 5, branch_id, images);

    logActivity(created_by, null, 'create', 'product', result.lastInsertRowid, name, null, req.body, 'Yeni urun eklendi', branch_id);

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
  const {
    name, sku, barcode, category, default_price, default_cost, price_local, price_usd, currency,
    width, height, unit_type, sizes, description, in_stock, stock_quantity, min_stock_alert, branch_id, images, updated_by
  } = req.body;

  try {
    const oldProduct = db.prepare('SELECT * FROM urunler WHERE id = ?').get(id);
    if (!oldProduct) {
      return res.status(404).json({ error: 'Urun bulunamadi' });
    }

    const sqm = width && height ? (width * height / 10000) : null;

    const result = db.prepare(`
      UPDATE urunler SET
        name=?, sku=?, barcode=?, category=?, default_price=?, default_cost=?, price_local=?, price_usd=?, currency=?,
        width=?, height=?, sqm=?, unit_type=?, sizes=?, description=?, in_stock=?, stock_quantity=?, min_stock_alert=?, branch_id=?, images=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(name, sku, barcode, category, default_price, default_cost, price_local, price_usd, currency,
      width, height, sqm, unit_type, sizes, description, in_stock ? 1 : 0, stock_quantity, min_stock_alert, branch_id, images, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Urun bulunamadi' });
    }

    logActivity(updated_by, null, 'update', 'product', id, name, oldProduct, req.body, 'Urun guncellendi', branch_id);

    res.json({ message: 'Urun guncellendi', productId: id });
  } catch (error) {
    console.error('Urun guncelleme hatasi:', error);
    res.status(500).json({ error: 'Urun guncellenemedi' });
  }
});

// Urun sil
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { deleted_by } = req.body;

  try {
    const product = db.prepare('SELECT * FROM urunler WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).json({ error: 'Urun bulunamadi' });
    }

    // Delete branch stocks first
    db.prepare('DELETE FROM sube_stok WHERE product_id = ?').run(id);

    // Delete product
    db.prepare('DELETE FROM urunler WHERE id = ?').run(id);

    logActivity(deleted_by, null, 'delete', 'product', id, product.name, product, null, 'Urun silindi', product.branch_id);

    res.json({ message: 'Urun silindi' });
  } catch (error) {
    console.error('Urun silme hatasi:', error);
    res.status(500).json({ error: 'Urun silinemedi' });
  }
});

// Sube stok guncelle
app.put('/api/products/:id/stock/:branchId', (req, res) => {
  const { id, branchId } = req.params;
  const { quantity, min_stock, location, updated_by } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM sube_stok WHERE product_id = ? AND branch_id = ?').get(id, branchId);

    if (existing) {
      db.prepare(`
        UPDATE sube_stok SET quantity=?, min_stock=?, location=?, updated_at=CURRENT_TIMESTAMP
        WHERE product_id=? AND branch_id=?
      `).run(quantity, min_stock, location, id, branchId);
    } else {
      db.prepare(`
        INSERT INTO sube_stok (branch_id, product_id, quantity, min_stock, location)
        VALUES (?, ?, ?, ?, ?)
      `).run(branchId, id, quantity, min_stock, location);
    }

    const product = db.prepare('SELECT name FROM urunler WHERE id = ?').get(id);
    logActivity(updated_by, null, 'update_stock', 'product', id, product?.name, existing, { quantity, min_stock, location }, 'Stok guncellendi', branchId);

    res.json({ message: 'Stok guncellendi' });
  } catch (error) {
    console.error('Stok guncelleme hatasi:', error);
    res.status(500).json({ error: 'Stok guncellenemedi' });
  }
});

// ==================== ORDERS ====================

// Siparis olusturma
app.post('/api/orders', (req, res) => {
  const orderData = req.body;

  try {
    const orderNo = orderData.order_no || generateOrderNumber();

    // Calculate totals
    let subtotal = 0;
    const products = orderData.products || [];
    products.forEach(p => {
      const price = parseFloat(p.price) || 0;
      const quantity = parseFloat(p.quantity) || 0;
      subtotal += price * quantity;
    });

    const discount = parseFloat(orderData.discount) || 0;
    const tax = parseFloat(orderData.tax) || 0;
    const total = orderData.total || (subtotal - discount + tax);

    const stmt = db.prepare(`
      INSERT INTO siparisler (date, order_no, order_type, branch_id, location, customer_id, customer_name, customer_address,
        customer_country, customer_city, customer_state, customer_phone, customer_email, customer_zip_code, customer_passport_no, customer_tax_no,
        shipping_address, shipping_city, shipping_state, shipping_country, shipping_postal_code,
        salesman, salesman_id, conference, cruise, agency, guide, pax, products, subtotal, discount, discount_type, tax, total, currency, exchange_rate,
        payment_method, process, payment_status, passport_image, customer_signature, notes, internal_notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      orderData.date || new Date().toISOString().split('T')[0],
      orderNo,
      orderData.order_type || 'sale',
      orderData.branch_id,
      orderData.location,
      orderData.customer_id,
      orderData.customerInfo?.nameSurname || orderData.customer_name,
      orderData.customerInfo?.address || orderData.customer_address,
      orderData.customerInfo?.country || orderData.customer_country,
      orderData.customerInfo?.city || orderData.customer_city,
      orderData.customerInfo?.state || orderData.customer_state,
      orderData.customerInfo?.phone || orderData.customer_phone,
      orderData.customerInfo?.email || orderData.customer_email,
      orderData.customerInfo?.zipCode || orderData.customer_zip_code,
      orderData.customerInfo?.passportNo || orderData.customer_passport_no,
      orderData.customerInfo?.taxNo || orderData.customer_tax_no,
      orderData.shipping_address,
      orderData.shipping_city,
      orderData.shipping_state,
      orderData.shipping_country,
      orderData.shipping_postal_code,
      orderData.shipping?.salesman || orderData.salesman,
      orderData.salesman_id,
      orderData.shipping?.conference || orderData.conference,
      orderData.shipping?.cruise || orderData.cruise,
      orderData.shipping?.agency || orderData.agency,
      orderData.shipping?.guide || orderData.guide,
      orderData.shipping?.pax || orderData.pax,
      JSON.stringify(products),
      subtotal,
      discount,
      orderData.discount_type || 'amount',
      tax,
      total,
      orderData.currency || 'USD',
      orderData.exchange_rate || 1,
      orderData.payment_method,
      'Sipariş Oluşturuldu',
      'pending',
      orderData.passport_image,
      orderData.customer_signature,
      orderData.notes,
      orderData.internal_notes,
      orderData.created_by
    );

    // Update customer totals if customer_id provided
    if (orderData.customer_id) {
      db.prepare(`
        UPDATE musteriler SET
          total_orders = total_orders + 1,
          total_spent = total_spent + ?
        WHERE id = ?
      `).run(total, orderData.customer_id);
    }

    // Add shipping history entry
    db.prepare(`
      INSERT INTO sevkiyat_gecmisi (order_id, status, notes, updated_by)
      VALUES (?, ?, ?, ?)
    `).run(result.lastInsertRowid, 'Sipariş Oluşturuldu', 'Siparis olusturuldu', orderData.created_by);

    logActivity(orderData.created_by, null, 'create', 'order', result.lastInsertRowid, orderNo, null, orderData, 'Yeni siparis olusturuldu', orderData.branch_id);

    // Create notification
    createNotification(null, 'Yeni Siparis', `${orderNo} numarali siparis olusturuldu`, 'info', 'order', result.lastInsertRowid);

    res.status(201).json({
      message: 'Siparis basariyla kaydedildi',
      orderId: result.lastInsertRowid,
      orderNo: orderNo
    });
  } catch (error) {
    console.error('Siparis kaydetme hatasi:', error);
    res.status(500).json({ error: 'Siparis kaydedilemedi' });
  }
});

// Tum siparisleri getir
app.get('/api/orders', (req, res) => {
  const { branch_id, status, order_type, customer_id, from_date, to_date } = req.query;

  try {
    let query = `
      SELECT s.*, b.name as branch_name
      FROM siparisler s
      LEFT JOIN subeler b ON s.branch_id = b.id
      WHERE 1=1
    `;
    let params = [];

    if (branch_id) {
      query += ' AND s.branch_id = ?';
      params.push(branch_id);
    }

    if (status) {
      query += ' AND s.process = ?';
      params.push(status);
    }

    if (order_type) {
      query += ' AND s.order_type = ?';
      params.push(order_type);
    }

    if (customer_id) {
      query += ' AND s.customer_id = ?';
      params.push(customer_id);
    }

    if (from_date) {
      query += ' AND s.date >= ?';
      params.push(from_date);
    }

    if (to_date) {
      query += ' AND s.date <= ?';
      params.push(to_date);
    }

    query += ' ORDER BY s.date DESC';

    const orders = db.prepare(query).all(...params);
    res.json(orders);
  } catch (error) {
    console.error('Siparisleri getirme hatasi:', error);
    res.status(500).json({ error: 'Siparisler getirilemedi' });
  }
});

// Siparis detay
app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  try {
    const order = db.prepare(`
      SELECT s.*, b.name as branch_name
      FROM siparisler s
      LEFT JOIN subeler b ON s.branch_id = b.id
      WHERE s.id = ?
    `).get(id);

    if (!order) {
      return res.status(404).json({ error: 'Siparis bulunamadi' });
    }

    // Get payments
    const payments = db.prepare('SELECT * FROM odemeler WHERE order_id = ?').all(id);
    order.payments = payments;

    // Get shipping history
    const history = db.prepare(`
      SELECT sh.*, u.Ad_Soyad as updated_by_name
      FROM sevkiyat_gecmisi sh
      LEFT JOIN users u ON sh.updated_by = u.id
      WHERE sh.order_id = ?
      ORDER BY sh.created_at DESC
    `).all(id);
    order.shipping_history = history;

    // Get activity logs
    const logs = db.prepare(`
      SELECT * FROM islem_kayitlari
      WHERE entity_type = 'order' AND entity_id = ?
      ORDER BY created_at DESC LIMIT 20
    `).all(id);
    order.activity_logs = logs;

    res.json(order);
  } catch (error) {
    console.error('Siparis detay hatasi:', error);
    res.status(500).json({ error: 'Siparis getirilemedi' });
  }
});

// Siparis guncelle
app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const oldOrder = db.prepare('SELECT * FROM siparisler WHERE id = ?').get(id);
    if (!oldOrder) {
      return res.status(404).json({ error: 'Siparis bulunamadi' });
    }

    const result = db.prepare(`
      UPDATE siparisler SET
        customer_name=?, customer_address=?, customer_country=?, customer_city=?, customer_state=?,
        customer_phone=?, customer_email=?, shipping_address=?, shipping_city=?, shipping_state=?,
        shipping_country=?, shipping_postal_code=?, salesman=?, agency=?, guide=?,
        cargo_company=?, cargo_tracking=?, bus_number=?, transport_number=?,
        estimated_delivery=?, notes=?, internal_notes=?, updated_by=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      updateData.customer_name, updateData.customer_address, updateData.customer_country,
      updateData.customer_city, updateData.customer_state, updateData.customer_phone,
      updateData.customer_email, updateData.shipping_address, updateData.shipping_city,
      updateData.shipping_state, updateData.shipping_country, updateData.shipping_postal_code,
      updateData.salesman, updateData.agency, updateData.guide,
      updateData.cargo_company, updateData.cargo_tracking, updateData.bus_number, updateData.transport_number,
      updateData.estimated_delivery, updateData.notes, updateData.internal_notes, updateData.updated_by, id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Siparis bulunamadi' });
    }

    logActivity(updateData.updated_by, null, 'update', 'order', id, oldOrder.order_no, oldOrder, updateData, 'Siparis guncellendi', oldOrder.branch_id);

    res.json({ message: 'Siparis guncellendi', orderId: id });
  } catch (error) {
    console.error('Siparis guncelleme hatasi:', error);
    res.status(500).json({ error: 'Siparis guncellenemedi' });
  }
});

// Siparis durumunu guncelle
app.put('/api/orders/:id/process', (req, res) => {
  const { id } = req.params;
  const { process, notes, updated_by } = req.body;

  try {
    const order = db.prepare('SELECT * FROM siparisler WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Siparis bulunamadi' });
    }

    const oldProcess = order.process;

    let updateQuery = 'UPDATE siparisler SET process = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP';
    let params = [process, updated_by];

    // Set actual delivery date if delivered
    if (process === 'Teslim Edildi') {
      updateQuery += ', actual_delivery = CURRENT_TIMESTAMP';
    }

    updateQuery += ' WHERE id = ?';
    params.push(id);

    db.prepare(updateQuery).run(...params);

    // Add shipping history entry
    db.prepare(`
      INSERT INTO sevkiyat_gecmisi (order_id, status, notes, updated_by)
      VALUES (?, ?, ?, ?)
    `).run(id, process, notes || `Durum degistirildi: ${oldProcess} -> ${process}`, updated_by);

    logActivity(updated_by, null, 'update_status', 'order', id, order.order_no, { process: oldProcess }, { process }, 'Siparis durumu guncellendi', order.branch_id);

    // Create notification for status change
    if (process === 'Transfer Aşamasında') {
      createNotification(null, 'Siparis Transferde', `${order.order_no} transfer asamasinda`, 'warning', 'order', id);
    } else if (process === 'Teslim Edildi') {
      createNotification(null, 'Siparis Teslim Edildi', `${order.order_no} teslim edildi`, 'success', 'order', id);
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

// Siparis imzasini guncelle
app.put('/api/orders/:id/signature', (req, res) => {
  const { id } = req.params;
  const { customer_signature, updated_by } = req.body;

  try {
    const order = db.prepare('SELECT * FROM siparisler WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Siparis bulunamadi' });
    }

    db.prepare(`
      UPDATE siparisler
      SET customer_signature = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(customer_signature, updated_by, id);

    logActivity(updated_by, null, 'update_signature', 'order', id, order.order_no, null, { signature_added: true }, 'Musteri imzasi eklendi', order.branch_id);

    res.json({
      message: 'Imza basariyla kaydedildi',
      orderId: id
    });
  } catch (error) {
    console.error('Imza kaydetme hatasi:', error);
    res.status(500).json({ error: 'Imza kaydedilemedi' });
  }
});

// Siparis sil
app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { deleted_by } = req.body;

  try {
    const order = db.prepare('SELECT * FROM siparisler WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Siparis bulunamadi' });
    }

    // Delete related data
    db.prepare('DELETE FROM odemeler WHERE order_id = ?').run(id);
    db.prepare('DELETE FROM sevkiyat_gecmisi WHERE order_id = ?').run(id);

    // Delete order
    db.prepare('DELETE FROM siparisler WHERE id = ?').run(id);

    logActivity(deleted_by, null, 'delete', 'order', id, order.order_no, order, null, 'Siparis silindi', order.branch_id);

    res.json({ message: 'Siparis silindi' });
  } catch (error) {
    console.error('Siparis silme hatasi:', error);
    res.status(500).json({ error: 'Siparis silinemedi' });
  }
});

// ==================== PAYMENTS ====================

// Odeme ekle
app.post('/api/payments', (req, res) => {
  const {
    order_id, customer_id, amount, currency, payment_method, card_type, card_last_four,
    installments, transaction_id, notes, created_by
  } = req.body;

  try {
    const order = db.prepare('SELECT * FROM siparisler WHERE id = ?').get(order_id);
    if (!order) {
      return res.status(404).json({ error: 'Siparis bulunamadi' });
    }

    const stmt = db.prepare(`
      INSERT INTO odemeler (order_id, customer_id, amount, currency, payment_method, card_type, card_last_four,
        installments, transaction_id, status, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)
    `);
    const result = stmt.run(order_id, customer_id, amount, currency || 'TRY', payment_method, card_type, card_last_four,
      installments || 1, transaction_id, notes, created_by);

    // Calculate total paid
    const totalPaid = db.prepare('SELECT SUM(amount) as total FROM odemeler WHERE order_id = ? AND status = ?').get(order_id, 'completed');
    const paidAmount = totalPaid?.total || 0;

    // Update payment status
    let paymentStatus = 'pending';
    if (paidAmount >= order.total) {
      paymentStatus = 'paid';
    } else if (paidAmount > 0) {
      paymentStatus = 'partial';
    }

    db.prepare('UPDATE siparisler SET payment_status = ? WHERE id = ?').run(paymentStatus, order_id);

    logActivity(created_by, null, 'create', 'payment', result.lastInsertRowid, `${order.order_no} - ${amount} ${currency}`, null, req.body, 'Odeme eklendi', order.branch_id);

    res.status(201).json({
      message: 'Odeme basariyla kaydedildi',
      paymentId: result.lastInsertRowid,
      paymentStatus: paymentStatus,
      totalPaid: paidAmount
    });
  } catch (error) {
    console.error('Odeme kaydetme hatasi:', error);
    res.status(500).json({ error: 'Odeme kaydedilemedi' });
  }
});

// Siparis odemeleri
app.get('/api/orders/:id/payments', (req, res) => {
  const { id } = req.params;
  try {
    const payments = db.prepare(`
      SELECT p.*, u.Ad_Soyad as created_by_name
      FROM odemeler p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.order_id = ?
      ORDER BY p.payment_date DESC
    `).all(id);

    const order = db.prepare('SELECT total FROM siparisler WHERE id = ?').get(id);
    const totalPaid = payments.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0);

    res.json({
      payments,
      orderTotal: order?.total || 0,
      totalPaid,
      remaining: (order?.total || 0) - totalPaid
    });
  } catch (error) {
    console.error('Odeme listesi hatasi:', error);
    res.status(500).json({ error: 'Odemeler getirilemedi' });
  }
});

// Odeme iptal
app.put('/api/payments/:id/cancel', (req, res) => {
  const { id } = req.params;
  const { cancelled_by, reason } = req.body;

  try {
    const payment = db.prepare('SELECT * FROM odemeler WHERE id = ?').get(id);
    if (!payment) {
      return res.status(404).json({ error: 'Odeme bulunamadi' });
    }

    db.prepare('UPDATE odemeler SET status = ?, notes = ? WHERE id = ?').run('cancelled', reason, id);

    // Recalculate payment status
    const totalPaid = db.prepare('SELECT SUM(amount) as total FROM odemeler WHERE order_id = ? AND status = ?').get(payment.order_id, 'completed');
    const order = db.prepare('SELECT total FROM siparisler WHERE id = ?').get(payment.order_id);

    let paymentStatus = 'pending';
    if ((totalPaid?.total || 0) >= order.total) {
      paymentStatus = 'paid';
    } else if ((totalPaid?.total || 0) > 0) {
      paymentStatus = 'partial';
    }

    db.prepare('UPDATE siparisler SET payment_status = ? WHERE id = ?').run(paymentStatus, payment.order_id);

    logActivity(cancelled_by, null, 'cancel', 'payment', id, null, payment, { status: 'cancelled', reason }, 'Odeme iptal edildi', null);

    res.json({ message: 'Odeme iptal edildi' });
  } catch (error) {
    console.error('Odeme iptal hatasi:', error);
    res.status(500).json({ error: 'Odeme iptal edilemedi' });
  }
});

// ==================== EXCHANGE RATES ====================

// Kur oranlari
app.get('/api/exchange-rates', (req, res) => {
  try {
    const rates = db.prepare('SELECT * FROM kur_oranlari ORDER BY currency_from').all();
    res.json(rates);
  } catch (error) {
    console.error('Kur oranlari hatasi:', error);
    res.status(500).json({ error: 'Kur oranlari getirilemedi' });
  }
});

// Kur orani guncelle
app.put('/api/exchange-rates/:id', (req, res) => {
  const { id } = req.params;
  const { rate, auto_update, updated_by } = req.body;

  try {
    const oldRate = db.prepare('SELECT * FROM kur_oranlari WHERE id = ?').get(id);
    if (!oldRate) {
      return res.status(404).json({ error: 'Kur orani bulunamadi' });
    }

    db.prepare('UPDATE kur_oranlari SET rate = ?, auto_update = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(rate, auto_update ? 1 : 0, id);

    logActivity(updated_by, null, 'update', 'exchange_rate', id, `${oldRate.currency_from}/${oldRate.currency_to}`, { rate: oldRate.rate }, { rate }, 'Kur orani guncellendi', null);

    res.json({ message: 'Kur orani guncellendi' });
  } catch (error) {
    console.error('Kur guncelleme hatasi:', error);
    res.status(500).json({ error: 'Kur orani guncellenemedi' });
  }
});

// Yeni kur orani ekle
app.post('/api/exchange-rates', (req, res) => {
  const { currency_from, currency_to, rate, auto_update, created_by } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO kur_oranlari (currency_from, currency_to, rate, auto_update)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(currency_from, currency_to, rate, auto_update ? 1 : 0);

    logActivity(created_by, null, 'create', 'exchange_rate', result.lastInsertRowid, `${currency_from}/${currency_to}`, null, req.body, 'Yeni kur orani eklendi', null);

    res.status(201).json({
      message: 'Kur orani eklendi',
      rateId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Kur ekleme hatasi:', error);
    res.status(500).json({ error: 'Kur orani eklenemedi' });
  }
});

// Para birimi donustur
app.get('/api/exchange-rates/convert', (req, res) => {
  const { amount, from, to } = req.query;

  try {
    if (from === to) {
      return res.json({ amount: parseFloat(amount), converted: parseFloat(amount), rate: 1 });
    }

    const rate = db.prepare('SELECT rate FROM kur_oranlari WHERE currency_from = ? AND currency_to = ?').get(from, to);

    if (!rate) {
      // Try reverse conversion
      const reverseRate = db.prepare('SELECT rate FROM kur_oranlari WHERE currency_from = ? AND currency_to = ?').get(to, from);
      if (reverseRate) {
        const converted = parseFloat(amount) / reverseRate.rate;
        return res.json({ amount: parseFloat(amount), converted, rate: 1 / reverseRate.rate });
      }
      return res.status(404).json({ error: 'Kur orani bulunamadi' });
    }

    const converted = parseFloat(amount) * rate.rate;
    res.json({ amount: parseFloat(amount), converted, rate: rate.rate });
  } catch (error) {
    console.error('Kur donusturme hatasi:', error);
    res.status(500).json({ error: 'Donusturulemedi' });
  }
});

// ==================== ACTIVITY LOGS ====================

// Islem kayitlari
app.get('/api/activity-logs', (req, res) => {
  const { user_id, entity_type, entity_id, branch_id, from_date, to_date, limit = 100 } = req.query;

  try {
    let query = `
      SELECT il.*, u.Ad_Soyad as user_name_display
      FROM islem_kayitlari il
      LEFT JOIN users u ON il.user_id = u.id
      WHERE 1=1
    `;
    let params = [];

    if (user_id) {
      query += ' AND il.user_id = ?';
      params.push(user_id);
    }

    if (entity_type) {
      query += ' AND il.entity_type = ?';
      params.push(entity_type);
    }

    if (entity_id) {
      query += ' AND il.entity_id = ?';
      params.push(entity_id);
    }

    if (branch_id) {
      query += ' AND il.branch_id = ?';
      params.push(branch_id);
    }

    if (from_date) {
      query += ' AND il.created_at >= ?';
      params.push(from_date);
    }

    if (to_date) {
      query += ' AND il.created_at <= ?';
      params.push(to_date);
    }

    query += ` ORDER BY il.created_at DESC LIMIT ?`;
    params.push(parseInt(limit));

    const logs = db.prepare(query).all(...params);
    res.json(logs);
  } catch (error) {
    console.error('Islem kayitlari hatasi:', error);
    res.status(500).json({ error: 'Islem kayitlari getirilemedi' });
  }
});

// Son islemler
app.get('/api/activity-logs/recent', (req, res) => {
  const { limit = 50 } = req.query;

  try {
    const logs = db.prepare(`
      SELECT il.*, u.Ad_Soyad as user_name_display
      FROM islem_kayitlari il
      LEFT JOIN users u ON il.user_id = u.id
      ORDER BY il.created_at DESC
      LIMIT ?
    `).all(parseInt(limit));

    res.json(logs);
  } catch (error) {
    console.error('Son islemler hatasi:', error);
    res.status(500).json({ error: 'Son islemler getirilemedi' });
  }
});

// ==================== NOTIFICATIONS ====================

// Bildirimler
app.get('/api/notifications', (req, res) => {
  const { user_id, is_read } = req.query;

  try {
    let query = 'SELECT * FROM bildirimler WHERE 1=1';
    let params = [];

    if (user_id) {
      query += ' AND (user_id = ? OR user_id IS NULL)';
      params.push(user_id);
    }

    if (is_read !== undefined) {
      query += ' AND is_read = ?';
      params.push(is_read === 'true' ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const notifications = db.prepare(query).all(...params);
    res.json(notifications);
  } catch (error) {
    console.error('Bildirimler hatasi:', error);
    res.status(500).json({ error: 'Bildirimler getirilemedi' });
  }
});

// Bildirimi okundu olarak isaretle
app.put('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;

  try {
    db.prepare('UPDATE bildirimler SET is_read = 1 WHERE id = ?').run(id);
    res.json({ message: 'Bildirim okundu olarak isaretlendi' });
  } catch (error) {
    console.error('Bildirim guncelleme hatasi:', error);
    res.status(500).json({ error: 'Bildirim guncellenemedi' });
  }
});

// Tum bildirimleri okundu olarak isaretle
app.put('/api/notifications/read-all', (req, res) => {
  const { user_id } = req.body;

  try {
    let query = 'UPDATE bildirimler SET is_read = 1';
    let params = [];

    if (user_id) {
      query += ' WHERE user_id = ? OR user_id IS NULL';
      params.push(user_id);
    }

    db.prepare(query).run(...params);
    res.json({ message: 'Tum bildirimler okundu' });
  } catch (error) {
    console.error('Bildirimler guncelleme hatasi:', error);
    res.status(500).json({ error: 'Bildirimler guncellenemedi' });
  }
});

// ==================== ANALYTICS ====================

// Dashboard istatistikleri
app.get('/api/analytics/dashboard', (req, res) => {
  const { branch_id } = req.query;

  try {
    let orderQuery = 'SELECT * FROM siparisler';
    let params = [];

    if (branch_id) {
      orderQuery += ' WHERE branch_id = ?';
      params.push(branch_id);
    }

    const orders = db.prepare(orderQuery).all(...params);
    const customers = db.prepare('SELECT COUNT(*) as count FROM musteriler').get();
    const products = db.prepare('SELECT COUNT(*) as count FROM urunler').get();

    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1);

    let monthlyRevenue = 0;
    let monthlyExpenses = 0;
    let yearlyRevenue = 0;
    let yearlyExpenses = 0;

    const statusCounts = {
      pending: 0,
      transfer: 0,
      delivered: 0,
      cancelled: 0
    };

    const paymentCounts = {
      paid: 0,
      partial: 0,
      pending: 0
    };

    orders.forEach(order => {
      const orderDate = new Date(order.date);
      const products = JSON.parse(order.products || '[]');

      let orderRevenue = 0;
      let orderExpense = 0;

      products.forEach(product => {
        const price = parseFloat(product.price) || 0;
        const cost = parseFloat(product.cost) || 0;
        const quantity = parseInt(product.quantity) || 0;
        orderRevenue += price * quantity;
        orderExpense += cost * quantity;
      });

      if (orderDate >= firstDayOfMonth) {
        monthlyRevenue += orderRevenue;
        monthlyExpenses += orderExpense;
      }

      if (orderDate >= firstDayOfYear) {
        yearlyRevenue += orderRevenue;
        yearlyExpenses += orderExpense;
      }

      switch(order.process) {
        case 'Sipariş Oluşturuldu': statusCounts.pending++; break;
        case 'Transfer Aşamasında': statusCounts.transfer++; break;
        case 'Teslim Edildi': statusCounts.delivered++; break;
        case 'İptal Edildi': statusCounts.cancelled++; break;
      }

      switch(order.payment_status) {
        case 'paid': paymentCounts.paid++; break;
        case 'partial': paymentCounts.partial++; break;
        case 'pending': paymentCounts.pending++; break;
      }
    });

    res.json({
      totalOrders: orders.length,
      totalCustomers: customers.count,
      totalProducts: products.count,
      statusCounts,
      paymentCounts,
      monthly: {
        revenue: monthlyRevenue,
        expenses: monthlyExpenses,
        profit: monthlyRevenue - monthlyExpenses,
        profitMargin: monthlyRevenue > 0 ? ((monthlyRevenue - monthlyExpenses) / monthlyRevenue * 100).toFixed(1) : 0
      },
      yearly: {
        revenue: yearlyRevenue,
        expenses: yearlyExpenses,
        profit: yearlyRevenue - yearlyExpenses,
        profitMargin: yearlyRevenue > 0 ? ((yearlyRevenue - yearlyExpenses) / yearlyRevenue * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Dashboard istatistikleri hatasi:', error);
    res.status(500).json({ error: 'Istatistikler getirilemedi' });
  }
});

// Aylik gelir/gider trend
app.get('/api/analytics/monthly-trends', (req, res) => {
  const { branch_id } = req.query;

  try {
    let query = 'SELECT * FROM siparisler';
    let params = [];

    if (branch_id) {
      query += ' WHERE branch_id = ?';
      params.push(branch_id);
    }

    query += ' ORDER BY date ASC';

    const orders = db.prepare(query).all(...params);
    const monthlyData = {};

    orders.forEach(order => {
      const date = new Date(order.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, expenses: 0, orders: 0 };
      }

      const products = JSON.parse(order.products || '[]');
      products.forEach(product => {
        const price = parseFloat(product.price) || 0;
        const cost = parseFloat(product.cost) || 0;
        const quantity = parseInt(product.quantity) || 0;
        monthlyData[monthKey].revenue += price * quantity;
        monthlyData[monthKey].expenses += cost * quantity;
      });
      monthlyData[monthKey].orders++;
    });

    const trends = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
      profit: data.revenue - data.expenses
    }));

    res.json(trends);
  } catch (error) {
    console.error('Aylik trend hatasi:', error);
    res.status(500).json({ error: 'Trendler getirilemedi' });
  }
});

// Ulke bazinda siparis dagilimi
app.get('/api/analytics/orders-by-country', (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT customer_country, COUNT(*) as order_count,
             SUM(total) as total_revenue
      FROM siparisler
      WHERE customer_country IS NOT NULL AND customer_country != ''
      GROUP BY customer_country
      ORDER BY order_count DESC
    `).all();

    res.json(orders);
  } catch (error) {
    console.error('Ulke dagilimi hatasi:', error);
    res.status(500).json({ error: 'Ulke dagilimi getirilemedi' });
  }
});

// En cok satan urunler
app.get('/api/analytics/top-products', (req, res) => {
  try {
    const orders = db.prepare('SELECT products FROM siparisler').all();
    const productStats = {};

    orders.forEach(order => {
      const products = JSON.parse(order.products || '[]');
      products.forEach(product => {
        const name = product.name || 'Bilinmeyen';
        if (!productStats[name]) {
          productStats[name] = { quantity: 0, revenue: 0, sqm: 0 };
        }
        const qty = parseInt(product.quantity) || 0;
        const price = parseFloat(product.price) || 0;
        const sqm = parseFloat(product.sqm) || 0;
        productStats[name].quantity += qty;
        productStats[name].revenue += qty * price;
        productStats[name].sqm += qty * sqm;
      });
    });

    const topProducts = Object.entries(productStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json(topProducts);
  } catch (error) {
    console.error('Top products hatasi:', error);
    res.status(500).json({ error: 'En cok satanlar getirilemedi' });
  }
});

// En iyi musteriler
app.get('/api/analytics/top-customers', (req, res) => {
  try {
    const customers = db.prepare(`
      SELECT m.*,
             (SELECT COUNT(*) FROM siparisler WHERE customer_id = m.id) as order_count,
             (SELECT SUM(total) FROM siparisler WHERE customer_id = m.id) as total_revenue
      FROM musteriler m
      ORDER BY total_revenue DESC
      LIMIT 10
    `).all();

    res.json(customers);
  } catch (error) {
    console.error('Top customers hatasi:', error);
    res.status(500).json({ error: 'En iyi musteriler getirilemedi' });
  }
});

// Sube bazli performans
app.get('/api/analytics/branch-performance', (req, res) => {
  try {
    const branches = db.prepare(`
      SELECT s.*,
             (SELECT COUNT(*) FROM siparisler WHERE branch_id = s.id) as order_count,
             (SELECT SUM(total) FROM siparisler WHERE branch_id = s.id) as total_revenue,
             (SELECT COUNT(*) FROM users WHERE branch_id = s.id) as user_count
      FROM subeler s
      WHERE s.is_active = 1
      ORDER BY total_revenue DESC
    `).all();

    res.json(branches);
  } catch (error) {
    console.error('Branch performance hatasi:', error);
    res.status(500).json({ error: 'Sube performansi getirilemedi' });
  }
});

// ==================== SHIPPING HISTORY ====================

// Sevkiyat gecmisi
app.get('/api/orders/:id/shipping-history', (req, res) => {
  const { id } = req.params;
  try {
    const history = db.prepare(`
      SELECT sh.*, u.Ad_Soyad as updated_by_name
      FROM sevkiyat_gecmisi sh
      LEFT JOIN users u ON sh.updated_by = u.id
      WHERE sh.order_id = ?
      ORDER BY sh.created_at DESC
    `).all(id);
    res.json(history);
  } catch (error) {
    console.error('Sevkiyat gecmisi hatasi:', error);
    res.status(500).json({ error: 'Sevkiyat gecmisi getirilemedi' });
  }
});

// Sevkiyat notu ekle
app.post('/api/orders/:id/shipping-history', (req, res) => {
  const { id } = req.params;
  const { status, location, notes, updated_by } = req.body;

  try {
    const order = db.prepare('SELECT * FROM siparisler WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Siparis bulunamadi' });
    }

    const stmt = db.prepare(`
      INSERT INTO sevkiyat_gecmisi (order_id, status, location, notes, updated_by)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(id, status, location, notes, updated_by);

    res.status(201).json({
      message: 'Sevkiyat notu eklendi',
      historyId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Sevkiyat notu ekleme hatasi:', error);
    res.status(500).json({ error: 'Sevkiyat notu eklenemedi' });
  }
});

// ==================== PHONE FORMAT HELPER ====================

app.get('/api/utils/format-phone', (req, res) => {
  const { phone, country_code } = req.query;
  try {
    const formatted = formatPhoneNumber(phone, country_code || '+90');
    res.json({ formatted, full: `${country_code || '+90'} ${formatted}` });
  } catch (error) {
    res.status(500).json({ error: 'Formatlama hatasi' });
  }
});

// Country codes listesi
app.get('/api/utils/country-codes', (req, res) => {
  const countryCodes = [
    { code: '+90', country: 'Türkiye', flag: '🇹🇷', format: 'XXX XXX XX XX' },
    { code: '+1', country: 'ABD/Kanada', flag: '🇺🇸', format: '(XXX) XXX-XXXX' },
    { code: '+44', country: 'Birleşik Krallık', flag: '🇬🇧', format: 'XXXX XXXXXX' },
    { code: '+49', country: 'Almanya', flag: '🇩🇪', format: 'XXX XXXXXXXX' },
    { code: '+33', country: 'Fransa', flag: '🇫🇷', format: 'X XX XX XX XX' },
    { code: '+39', country: 'İtalya', flag: '🇮🇹', format: 'XXX XXX XXXX' },
    { code: '+34', country: 'İspanya', flag: '🇪🇸', format: 'XXX XX XX XX' },
    { code: '+31', country: 'Hollanda', flag: '🇳🇱', format: 'XX XXX XXXX' },
    { code: '+32', country: 'Belçika', flag: '🇧🇪', format: 'XXX XX XX XX' },
    { code: '+41', country: 'İsviçre', flag: '🇨🇭', format: 'XX XXX XX XX' },
    { code: '+43', country: 'Avusturya', flag: '🇦🇹', format: 'XXX XXXXXXX' },
    { code: '+46', country: 'İsveç', flag: '🇸🇪', format: 'XX XXX XX XX' },
    { code: '+47', country: 'Norveç', flag: '🇳🇴', format: 'XXX XX XXX' },
    { code: '+45', country: 'Danimarka', flag: '🇩🇰', format: 'XX XX XX XX' },
    { code: '+358', country: 'Finlandiya', flag: '🇫🇮', format: 'XX XXX XXXX' },
    { code: '+48', country: 'Polonya', flag: '🇵🇱', format: 'XXX XXX XXX' },
    { code: '+420', country: 'Çekya', flag: '🇨🇿', format: 'XXX XXX XXX' },
    { code: '+36', country: 'Macaristan', flag: '🇭🇺', format: 'XX XXX XXXX' },
    { code: '+30', country: 'Yunanistan', flag: '🇬🇷', format: 'XXX XXX XXXX' },
    { code: '+7', country: 'Rusya', flag: '🇷🇺', format: 'XXX XXX XX XX' },
    { code: '+81', country: 'Japonya', flag: '🇯🇵', format: 'XX XXXX XXXX' },
    { code: '+86', country: 'Çin', flag: '🇨🇳', format: 'XXX XXXX XXXX' },
    { code: '+82', country: 'Güney Kore', flag: '🇰🇷', format: 'XX XXXX XXXX' },
    { code: '+91', country: 'Hindistan', flag: '🇮🇳', format: 'XXXXX XXXXX' },
    { code: '+971', country: 'BAE', flag: '🇦🇪', format: 'XX XXX XXXX' },
    { code: '+966', country: 'Suudi Arabistan', flag: '🇸🇦', format: 'XX XXX XXXX' },
    { code: '+972', country: 'İsrail', flag: '🇮🇱', format: 'XX XXX XXXX' },
    { code: '+61', country: 'Avustralya', flag: '🇦🇺', format: 'XXX XXX XXX' },
    { code: '+55', country: 'Brezilya', flag: '🇧🇷', format: 'XX XXXXX XXXX' },
    { code: '+52', country: 'Meksika', flag: '🇲🇽', format: 'XX XXXX XXXX' }
  ];

  res.json(countryCodes);
});

// ==================== FILE UPLOAD ENDPOINTS ====================

// Helper: Base64'ten dosya kaydet
function saveBase64File(base64Data, folder, filename) {
  try {
    // base64 header'ı varsa kaldır
    let data = base64Data;
    if (data.includes(',')) {
      data = data.split(',')[1];
    }

    const buffer = Buffer.from(data, 'base64');
    const filePath = path.join(__dirname, 'uploads', folder, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${folder}/${filename}`;
  } catch (error) {
    console.error('Dosya kaydetme hatasi:', error);
    return null;
  }
}

// Pasaport fotoğrafı yükle
app.post('/api/upload/passport', (req, res) => {
  const { image_data, order_id, filename } = req.body;

  try {
    if (!image_data) {
      return res.status(400).json({ error: 'Resim verisi gerekli' });
    }

    const ext = filename?.split('.').pop() || 'jpg';
    const newFilename = `passport_${order_id || Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const filePath = saveBase64File(image_data, 'passports', newFilename);

    if (!filePath) {
      return res.status(500).json({ error: 'Dosya kaydedilemedi' });
    }

    // Sipariş varsa passport_image alanını güncelle
    if (order_id) {
      db.prepare('UPDATE siparisler SET passport_image = ? WHERE id = ?').run(filePath, order_id);
    }

    res.json({
      message: 'Pasaport fotoğrafı yüklendi',
      file_path: filePath,
      full_url: `${req.protocol}://${req.get('host')}${filePath}`
    });
  } catch (error) {
    console.error('Pasaport yükleme hatası:', error);
    res.status(500).json({ error: 'Pasaport fotoğrafı yüklenemedi' });
  }
});

// Müşteri imzası yükle
app.post('/api/upload/signature', (req, res) => {
  const { signature_data, order_id, filename } = req.body;

  try {
    if (!signature_data) {
      return res.status(400).json({ error: 'İmza verisi gerekli' });
    }

    const newFilename = `signature_${order_id || Date.now()}_${crypto.randomBytes(4).toString('hex')}.png`;
    const filePath = saveBase64File(signature_data, 'signatures', newFilename);

    if (!filePath) {
      return res.status(500).json({ error: 'Dosya kaydedilemedi' });
    }

    // Sipariş varsa customer_signature alanını güncelle
    if (order_id) {
      db.prepare('UPDATE siparisler SET customer_signature = ? WHERE id = ?').run(filePath, order_id);
    }

    res.json({
      message: 'İmza kaydedildi',
      file_path: filePath,
      full_url: `${req.protocol}://${req.get('host')}${filePath}`
    });
  } catch (error) {
    console.error('İmza kaydetme hatası:', error);
    res.status(500).json({ error: 'İmza kaydedilemedi' });
  }
});

// Belge yükle
app.post('/api/upload/document', (req, res) => {
  const { document_data, customer_id, document_type, document_name, mime_type, uploaded_by } = req.body;

  try {
    if (!document_data) {
      return res.status(400).json({ error: 'Belge verisi gerekli' });
    }

    const ext = mime_type?.includes('png') ? 'png' : 'jpg';
    const newFilename = `doc_${customer_id || 'unknown'}_${document_type || 'other'}_${Date.now()}.${ext}`;
    const filePath = saveBase64File(document_data, 'documents', newFilename);

    if (!filePath) {
      return res.status(500).json({ error: 'Dosya kaydedilemedi' });
    }

    // Veritabanına kaydet
    if (customer_id) {
      const stmt = db.prepare(`
        INSERT INTO musteri_belgeleri (customer_id, document_type, document_name, file_path, mime_type, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(customer_id, document_type, document_name || newFilename, filePath, mime_type, uploaded_by);

      res.json({
        message: 'Belge yüklendi',
        document_id: result.lastInsertRowid,
        file_path: filePath,
        full_url: `${req.protocol}://${req.get('host')}${filePath}`
      });
    } else {
      res.json({
        message: 'Belge yüklendi',
        file_path: filePath,
        full_url: `${req.protocol}://${req.get('host')}${filePath}`
      });
    }
  } catch (error) {
    console.error('Belge yükleme hatası:', error);
    res.status(500).json({ error: 'Belge yüklenemedi' });
  }
});

// Siparişe pasaport fotoğrafı güncelle
app.put('/api/orders/:id/passport', (req, res) => {
  const { id } = req.params;
  const { passport_image, updated_by } = req.body;

  try {
    const order = db.prepare('SELECT * FROM siparisler WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }

    let imagePath = passport_image;

    // Eğer base64 ise dosya olarak kaydet
    if (passport_image && passport_image.startsWith('data:')) {
      const filename = `passport_${id}_${Date.now()}.jpg`;
      imagePath = saveBase64File(passport_image, 'passports', filename);
    }

    db.prepare(`
      UPDATE siparisler SET passport_image = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(imagePath, updated_by, id);

    logActivity(updated_by, null, 'update_passport', 'order', id, order.order_no, null, { passport_image: true }, 'Pasaport fotoğrafı güncellendi', order.branch_id);

    res.json({
      message: 'Pasaport fotoğrafı güncellendi',
      passport_image: imagePath
    });
  } catch (error) {
    console.error('Pasaport güncelleme hatası:', error);
    res.status(500).json({ error: 'Pasaport fotoğrafı güncellenemedi' });
  }
});

// ==================== BARCODE SEARCH ====================

// Barkod ile ürün ara (query param destekli)
app.get('/api/products/search/barcode', (req, res) => {
  const { code } = req.query;

  try {
    if (!code) {
      return res.status(400).json({ error: 'Barkod kodu gerekli' });
    }

    const product = db.prepare('SELECT * FROM urunler WHERE barcode = ?').get(code);

    if (product) {
      res.json({
        found: true,
        product: product
      });
    } else {
      res.json({
        found: false,
        barcode: code,
        message: 'Bu barkod sistemde kayıtlı değil'
      });
    }
  } catch (error) {
    console.error('Barkod arama hatası:', error);
    res.status(500).json({ error: 'Barkod araması yapılamadı' });
  }
});

// SKU ile ürün ara
app.get('/api/products/search/sku', (req, res) => {
  const { code } = req.query;

  try {
    if (!code) {
      return res.status(400).json({ error: 'SKU kodu gerekli' });
    }

    const product = db.prepare('SELECT * FROM urunler WHERE sku = ?').get(code);

    if (product) {
      res.json({
        found: true,
        product: product
      });
    } else {
      res.json({
        found: false,
        sku: code,
        message: 'Bu SKU sistemde kayıtlı değil'
      });
    }
  } catch (error) {
    console.error('SKU arama hatası:', error);
    res.status(500).json({ error: 'SKU araması yapılamadı' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  try {
    // Database kontrolü
    const dbCheck = db.prepare('SELECT 1 as ok').get();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbCheck ? 'connected' : 'error',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Server'i baslat
const PORT = process.env.PORT || 3000;
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
  console.log(`  http://localhost:${PORT}/api/customers`);
  console.log(`  http://localhost:${PORT}/api/products`);
  console.log(`  http://localhost:${PORT}/api/branches`);
  console.log(`  http://localhost:${PORT}/api/payments`);
  console.log(`  http://localhost:${PORT}/api/exchange-rates`);
  console.log(`  http://localhost:${PORT}/api/activity-logs`);
  console.log(`  http://localhost:${PORT}/api/notifications`);
  console.log(`  http://localhost:${PORT}/api/analytics/dashboard`);
  console.log('');
  console.log('Demo Giris Bilgileri:');
  console.log('  Patron: admin@test.com / 123456');
  console.log('  User:   test@test.com / 123456');
  console.log('  Depo:   depo@test.com / 123456');
  console.log('');
});
