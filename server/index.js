// Kullanıcı listesini getir
app.get('/api/users', (req, res) => {
  const query = 'SELECT id, Ad_Soyad, email, telefon, yetki FROM users';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Kullanıcı listesi alınamadı:', err);
      res.status(500).json({ error: 'Kullanıcı listesi alınamadı' });
      return;
    }
    res.json(results);
  });
}); 