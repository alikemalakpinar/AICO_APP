import React, { useState, useContext } from 'react';
import { UserContext } from '../../App';
import {
  User,
  Lock,
  Bell,
  Globe,
  Database,
  Shield,
  Building2,
  Users,
  Palette,
  Moon,
  Sun,
  Save,
  Check,
  Info
} from 'lucide-react';

export default function SettingsScreen() {
  const { user } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    email: '',
    phone: '',
    language: 'tr',
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    orderAlerts: true,
    dailyReports: false,
    lowStockAlerts: true,
  });

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Güvenlik', icon: Lock },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
    { id: 'appearance', label: 'Görünüm', icon: Palette },
    { id: 'system', label: 'Sistem', icon: Database },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">Ayarlar</h1>
        <p className="text-neutral-500">Hesap ve uygulama ayarlarını yönetin</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 shrink-0">
          <div className="card p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab.id
                    ? 'bg-primary-accent text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
              >
                <tab.icon size={20} />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="card">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
                  <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-800">Profil Bilgileri</h2>
                    <p className="text-sm text-neutral-500">Kişisel bilgilerinizi güncelleyin</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-primary-accent text-white rounded-full flex items-center justify-center text-3xl font-bold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-neutral-800">{user?.username}</p>
                    <p className="text-neutral-500">{user?.role}</p>
                    {user?.branch_name && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-primary-accent">
                        <Building2 size={14} />
                        <span>{user.branch_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Kullanıcı Adı</label>
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">E-posta</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      className="input"
                      placeholder="ornek@mail.com"
                    />
                  </div>
                  <div>
                    <label className="label">Telefon</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="input"
                      placeholder="+90 555 123 4567"
                    />
                  </div>
                  <div>
                    <label className="label">Dil</label>
                    <select
                      value={profileForm.language}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, language: e.target.value }))}
                      className="select"
                    >
                      <option value="tr">Türkçe</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
                  <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center">
                    <Lock className="w-5 h-5 text-primary-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-800">Güvenlik Ayarları</h2>
                    <p className="text-sm text-neutral-500">Şifrenizi ve güvenlik ayarlarını yönetin</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="label">Mevcut Şifre</label>
                    <input
                      type="password"
                      value={securityForm.currentPassword}
                      onChange={(e) => setSecurityForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Yeni Şifre</label>
                    <input
                      type="password"
                      value={securityForm.newPassword}
                      onChange={(e) => setSecurityForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Yeni Şifre (Tekrar)</label>
                    <input
                      type="password"
                      value={securityForm.confirmPassword}
                      onChange={(e) => setSecurityForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="input"
                    />
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Güvenlik İpucu</p>
                    <p className="text-sm text-amber-700">
                      Güçlü bir şifre için en az 8 karakter, büyük/küçük harf, rakam ve özel karakter kullanın.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
                  <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center">
                    <Bell className="w-5 h-5 text-primary-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-800">Bildirim Ayarları</h2>
                    <p className="text-sm text-neutral-500">Hangi bildirimleri almak istediğinizi seçin</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries({
                    emailNotifications: { label: 'E-posta Bildirimleri', desc: 'Önemli güncellemeler için e-posta alın' },
                    orderAlerts: { label: 'Sipariş Uyarıları', desc: 'Yeni sipariş ve durum değişikliklerinde bildirim' },
                    dailyReports: { label: 'Günlük Raporlar', desc: 'Her gün özet rapor e-postası alın' },
                    lowStockAlerts: { label: 'Düşük Stok Uyarıları', desc: 'Stok azaldığında bildirim alın' },
                  }).map(([key, { label, desc }]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                      <div>
                        <p className="font-medium text-neutral-800">{label}</p>
                        <p className="text-sm text-neutral-500">{desc}</p>
                      </div>
                      <button
                        onClick={() => setNotificationSettings(prev => ({
                          ...prev,
                          [key]: !prev[key as keyof typeof notificationSettings]
                        }))}
                        className={`w-12 h-7 rounded-full transition-colors ${notificationSettings[key as keyof typeof notificationSettings]
                            ? 'bg-primary-accent'
                            : 'bg-neutral-300'
                          }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${notificationSettings[key as keyof typeof notificationSettings]
                            ? 'translate-x-6'
                            : 'translate-x-1'
                          }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
                  <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center">
                    <Palette className="w-5 h-5 text-primary-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-800">Görünüm Ayarları</h2>
                    <p className="text-sm text-neutral-500">Uygulama temasını özelleştirin</p>
                  </div>
                </div>

                <div>
                  <label className="label">Tema</label>
                  <div className="grid grid-cols-3 gap-4">
                    <button className="p-4 border-2 border-primary-accent bg-primary-accent/5 rounded-xl flex flex-col items-center gap-2">
                      <Sun size={24} className="text-primary-accent" />
                      <span className="font-medium text-primary-accent">Açık</span>
                    </button>
                    <button className="p-4 border-2 border-neutral-200 rounded-xl flex flex-col items-center gap-2 hover:border-neutral-300">
                      <Moon size={24} className="text-neutral-600" />
                      <span className="font-medium text-neutral-600">Koyu</span>
                    </button>
                    <button className="p-4 border-2 border-neutral-200 rounded-xl flex flex-col items-center gap-2 hover:border-neutral-300">
                      <Globe size={24} className="text-neutral-600" />
                      <span className="font-medium text-neutral-600">Sistem</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
                  <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center">
                    <Database className="w-5 h-5 text-primary-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-800">Sistem Bilgileri</h2>
                    <p className="text-sm text-neutral-500">Uygulama ve sistem bilgileri</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-neutral-50 rounded-xl">
                    <p className="text-sm text-neutral-500">Uygulama Versiyonu</p>
                    <p className="font-semibold text-neutral-800">AICO ERP v1.0.0</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-xl">
                    <p className="text-sm text-neutral-500">Platform</p>
                    <p className="font-semibold text-neutral-800">Electron + React</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-xl">
                    <p className="text-sm text-neutral-500">Kullanıcı Rolü</p>
                    <p className="font-semibold text-neutral-800">{user?.role || '-'}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-xl">
                    <p className="text-sm text-neutral-500">Bağlı Şube</p>
                    <p className="font-semibold text-neutral-800">{user?.branch_name || 'Tüm Şubeler'}</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Destek</p>
                    <p className="text-sm text-blue-700">
                      Yardım veya geri bildirim için support@aico.com adresine e-posta gönderebilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-6 pt-6 border-t border-neutral-200 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn btn-primary flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : saved ? (
                  <>
                    <Check size={18} />
                    <span>Kaydedildi!</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Değişiklikleri Kaydet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
