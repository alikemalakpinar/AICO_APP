const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MySQL bağlantısı
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123qwe',
  database: 'world'
});

// Bağlantıyı test et
connection.connect((err) => {
  if (err) {
    console.error('MySQL bağlantı hatası:', err);
    return;
  }
  console.log('MySQL veritabanına bağlandı');
});

// Kullanıcı kaydı endpoint'i
app.post('/api/register', async (req, res) => {
  const { Ad_Soyad, email, telefon, sifre, sifre_tekrar } = req.body;

  // Şifrelerin eşleşip eşleşmediğini kontrol et
  if (sifre !== sifre_tekrar) {
    return res.status(400).json({ error: 'Şifreler eşleşmiyor' });
  }

  try {
    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(sifre, 10);

    const sql = `INSERT INTO users (Ad_Soyad, email, telefon, sifre, sifre_tekrar, yetki) 
                 VALUES (?, ?, ?, ?, ?, 'Operasyon Sorumlusu')`;
    
    connection.query(sql, [Ad_Soyad, email, telefon, hashedPassword, hashedPassword], (err, result) => {
      if (err) {
        console.error('Kullanıcı kayıt hatası:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Bu email adresi zaten kayıtlı' });
        }
        return res.status(500).json({ error: 'Kayıt işlemi başarısız' });
      }
      
      res.status(201).json({ 
        message: 'Kullanıcı başarıyla kaydedildi',
        userId: result.insertId 
      });
    });
  } catch (error) {
    console.error('Şifre hashleme hatası:', error);
    res.status(500).json({ error: 'Kayıt işlemi başarısız' });
  }
});

// Login endpoint'i
app.post('/api/login', async (req, res) => {
  const { email, sifre } = req.body;

  if (!email || !sifre) {
    return res.status(400).json({ error: 'Email ve şifre gerekli' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';
  
  connection.query(sql, [email], async (err, results) => {
    if (err) {
      console.error('Login hatası:', err);
      return res.status(500).json({ error: 'Giriş işlemi başarısız' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Email veya şifre hatalı' });
    }

    const user = results[0];

    try {
      const isPasswordValid = await bcrypt.compare(sifre, user.sifre);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Email veya şifre hatalı' });
      }

      // Parse permissions from ek_yetkiler
      const permissions = user.ek_yetkiler ? user.ek_yetkiler.split(',') : [];

      res.json({ 
        message: 'Giriş başarılı',
        userId: user.id,
        yetki: user.yetki,
        Ad_Soyad: user.Ad_Soyad,
        permissions: permissions
      });
    } catch (error) {
      console.error('Şifre karşılaştırma hatası:', error);
      res.status(500).json({ error: 'Giriş işlemi başarısız' });
    }
  });
});

// Sipariş oluşturma endpoint'i
app.post('/api/orders', (req, res) => {
  const orderData = req.body;
  
  const orderValues = {
    date: orderData.date,
    order_no: orderData.orderNo,
    location: orderData.location,
    customer_name: orderData.customerInfo.nameSurname,
    customer_address: orderData.customerInfo.address,
    customer_country: orderData.customerInfo.country,
    customer_city: orderData.customerInfo.city,
    customer_phone: orderData.customerInfo.phone,
    customer_email: orderData.customerInfo.email,
    salesman: orderData.shipping.salesman,
    conference: orderData.shipping.conference,
    agency: orderData.shipping.agency,
    guide: orderData.shipping.guide,
    products: JSON.stringify(orderData.products),
    process: 'Sipariş Oluşturuldu'
  };

  const sql = `INSERT INTO siparisler (
    date, order_no, location, customer_name, customer_address, 
    customer_country, customer_city, customer_phone, customer_email,
    salesman, conference, agency, guide, products, process
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = Object.values(orderValues);

  connection.query(sql, values, (err, result) => {
    if (err) {
      console.error('Sipariş kaydetme hatası:', err);
      res.status(500).json({ error: 'Sipariş kaydedilemedi' });
      return;
    }
    res.status(201).json({ 
      message: 'Sipariş başarıyla kaydedildi',
      orderId: result.insertId 
    });
  });
});

// Tüm siparişleri getirme endpoint'i
app.get('/api/orders', (req, res) => {
  const sql = 'SELECT * FROM siparisler ORDER BY date DESC';
  
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Siparişleri getirme hatası:', err);
      res.status(500).json({ error: 'Siparişler getirilemedi' });
      return;
    }
    res.json(results);
  });
});

// Sipariş durumunu güncelleme endpoint'i
app.put('/api/orders/:id/process', (req, res) => {
  const { id } = req.params;
  const { process } = req.body;

  console.log('Gelen istek parametreleri:', { id, process });

  const sql = 'UPDATE siparisler SET process = ? WHERE id = ?';
  
  connection.query(sql, [process, id], (err, result) => {
    if (err) {
      console.error('MySQL güncelleme hatası:', err);
      res.status(500).json({ error: 'Sipariş durumu güncellenemedi', details: err.message });
      return;
    }

    console.log('MySQL güncelleme sonucu:', result);

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Sipariş bulunamadı' });
      return;
    }

    res.json({ 
      message: 'Sipariş durumu başarıyla güncellendi',
      process: process,
      orderId: id 
    });
  });
});

// Kullanıcı listesini getir
app.get('/api/users', (req, res) => {
  const query = 'SELECT id, Ad_Soyad, email, telefon, yetki FROM users';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Kullanıcı listesi alınamadı:', err);
      res.status(500).json({ error: 'Kullanıcı listesi alınamadı' });
      return;
    }
    res.json(results);
  });
});

// Kullanıcı yetkisini güncelle
app.put('/api/users/:id/role', (req, res) => {
  const { id } = req.params;
  const { yetki } = req.body;

  // Geçerli yetki kontrolü
  const validRoles = ['Operasyon Sorumlusu', 'Depo Görevlisi', 'Lojistik Sorumlusu'];
  if (!validRoles.includes(yetki)) {
    return res.status(400).json({ error: 'Geçersiz yetki' });
  }

  // Önce mevcut kullanıcının yetkisini kontrol et
  connection.query('SELECT yetki FROM users WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Kullanıcı kontrolü hatası:', err);
      return res.status(500).json({ error: 'Yetki güncellenemedi' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    // Patron rolündeki kullanıcının yetkisi değiştirilemez
    if (results[0].yetki === 'Patron') {
      return res.status(403).json({ error: 'Patron rolündeki kullanıcının yetkisi değiştirilemez' });
    }

    // Yetki güncelleme
    const sql = 'UPDATE users SET yetki = ? WHERE id = ?';
    connection.query(sql, [yetki, id], (updateErr, result) => {
      if (updateErr) {
        console.error('Yetki güncelleme hatası:', updateErr);
        return res.status(500).json({ error: 'Yetki güncellenemedi' });
      }

      res.json({ 
        message: 'Yetki başarıyla güncellendi',
        userId: id,
        yetki: yetki
      });
    });
  });
});

// Kullanıcının ek yetkilerini getir
app.get('/api/users/:id/permissions', (req, res) => {
  const { id } = req.params;

  const sql = 'SELECT ek_yetkiler FROM users WHERE id = ?';
  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Ek yetkileri getirme hatası:', err);
      return res.status(500).json({ error: 'Ek yetkiler getirilemedi' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    const permissions = results[0].ek_yetkiler ? results[0].ek_yetkiler.split(',') : [];
    res.json({ permissions });
  });
});

// Kullanıcının ek yetkilerini güncelle
app.put('/api/users/:id/permissions', (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;

  // Önce kullanıcının Patron olup olmadığını kontrol et
  connection.query('SELECT yetki FROM users WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Kullanıcı kontrolü hatası:', err);
      return res.status(500).json({ error: 'Ek yetkiler güncellenemedi' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    // Patron rolündeki kullanıcının ek yetkileri değiştirilemez
    if (results[0].yetki === 'Patron') {
      return res.status(403).json({ error: 'Patron rolündeki kullanıcının ek yetkileri değiştirilemez' });
    }

    // Ek yetkileri güncelle
    const permissionsString = Array.isArray(permissions) ? permissions.join(',') : '';
    const sql = 'UPDATE users SET ek_yetkiler = ? WHERE id = ?';
    
    connection.query(sql, [permissionsString, id], (updateErr, result) => {
      if (updateErr) {
        console.error('Ek yetki güncelleme hatası:', updateErr);
        return res.status(500).json({ error: 'Ek yetkiler güncellenemedi' });
      }

      res.json({ 
        message: 'Ek yetkiler başarıyla güncellendi',
        userId: id,
        permissions: permissions
      });
    });
  });
});

// Server'ı başlat
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
  console.log('API adresi: http://192.168.0.13:3000');
}); 