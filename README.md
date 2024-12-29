# 🩺 Sağlık Tahlil Takip Uygulaması

## Proje Genel Bakış

Bu uygulama, sağlık profesyonelleri ve hastalar için geliştirilmiş kapsamlı bir tıbbi tahlil takip sistemidir. İki farklı kullanıcı profili ile çalışır: Doktor (Admin) ve Hasta.

### Özellikler

#### Doktor (Admin) Profili
- 👥 Hasta listesini görüntüleme
- 📋 Hastaların tüm tahlil sonuçlarını inceleme
- ✏️ Tahlil sonuçları için referans kılavuzları oluşturma
- 🔍 Detaylı tahlil raporları ve karşılaştırmaları yapma
- 📊 Hasta tahlil verilerini analiz etme

#### Hasta Profili
- 🩸 Kendi tahlil sonuçlarını görüntüleme
- 📈 Geçmiş tahlil sonuçlarını karşılaştırma
- 🕒 Tahlil geçmişini takip etme
- 🚨 Referans değerlerine göre uyarı alma

## Teknolojiler

- **Frontend:** React Native
- **Backend:** Firebase Firestore
- **State Management:** React Hooks
- **Routing:** Expo Router
- **Authentication:** Firebase Authentication

## Kurulum

### Gereksinimler
- Node.js
- npm veya yarn
- Expo CLI
- Firebase Hesabı

### Kurulum Adımları
1. Depoyu klonlayın
```bash
git clone https://github.com/kullanici-adi/medical-test-tracking.git
```

2. Bağımlılıkları yükleyin
```bash
cd medical-test-tracking
npm install
# veya
yarn install
```

3. Firebase Konfigürasyonu
- Firebase konsolundan bir proje oluşturun
- `google-services.json` ve `GoogleService-Info.plist` dosyalarını ekleyin
- Firebase ortam değişkenlerini `.env` dosyasına ekleyin

4. Uygulamayı Başlatın
```bash
npx expo run:android
```

## Veritabanı Yapısı

### Firestore Koleksiyonları
- `users`: Kullanıcı profilleri
- `test_results`: Tahlil sonuçları
- `guidelines`: Tahlil referans kılavuzları
- `admin`: Admin profilleri
  
## Güvenlik ve Yetkilendirme
- Firebase Authentication
- Rol bazlı erişim kontrolü
- Kullanıcı verilerinin şifrelenmesi

## Ekran Görüntüleri  

### Doktor Paneli  

<div align="center">  
  <table>  
    <tr>  
      <td align="center">  
        <strong>Ana Sayfa ve Genel Durum</strong><br>  
        <img src="https://github.com/user-attachments/assets/c5f693ef-3bee-46ec-bce0-5fc1848f9ee0" width="300">  
      </td>  
      <td align="center">  
        <strong>Hasta Listesi</strong><br>  
        <img src="https://github.com/user-attachments/assets/23606db9-61a1-4a6e-95d1-d589fd9de7a4" width="300">  
      </td>  
    </tr>  
    <tr>  
      <td align="center">  
        <strong>Tahlil Sonuçları Yönetimi</strong><br>  
        <img src="https://github.com/user-attachments/assets/bb76735d-3227-4790-93cf-ff3992e7d373" width="300">  
      </td>  
      <td align="center">  
        <strong>Referans Kılavuzu Oluşturma</strong><br>  
        <img src="https://github.com/user-attachments/assets/6b16a15b-d9fb-43c2-bf48-f3f3fceb57a1" width="300">  
      </td>  
    </tr>  
    <tr>  
      <td align="center" colspan="2">  
        <strong>Tahlil Sonuçları Karşılaştırma</strong><br>  
        <img src="https://github.com/user-attachments/assets/5863b602-cfb3-4b83-9ef9-a379a4762c61" width="600">  
      </td>  
    </tr>  
    <tr>  
      <td align="center">  
        <strong>Referans Kılavuzu Düzenleme</strong><br>  
        <img src="https://github.com/user-attachments/assets/a931ee0b-4c4a-427e-913d-410da0891a77" width="300">  
      </td>  
      <td align="center">  
        <strong>Doktor Profil Yönetimi</strong><br>  
        <img src="https://github.com/user-attachments/assets/65db050f-2aff-4ccb-af42-a91cdb117936" width="300">  
      </td>  
    </tr>  
  </table>  
</div>  

### Hasta Paneli  

<div align="center">  
  <table>  
    <tr>  
      <td align="center">  
        <strong>Ana Sayfa</strong><br>  
        <img src="https://github.com/user-attachments/assets/665f4868-8093-4365-9ba7-d5fb50bec79e" width="300">  
      </td>  
      <td align="center">  
        <strong>Kişisel Tahlil Geçmişi</strong><br>  
        <img src="https://github.com/user-attachments/assets/49b0cc77-3391-41b9-965a-b71e199880d9" width="300">  
      </td>  
    </tr>  
    <tr>  
      <td align="center">  
        <strong>Referans Değerleri Karşılaştırması</strong><br>  
        <img src="https://github.com/user-attachments/assets/1be5d233-1702-4042-8b7e-7720e9ecd5ba" width="300">  
      </td>  
      <td align="center">  
        <strong>Profil Sayfası</strong><br>  
        <img src="https://github.com/user-attachments/assets/65479dae-9fb1-4e99-8878-26d9475d80a1" width="300">  
      </td>  
    </tr>  
  </table>  
</div>  

## Katkıda Bulunma
1. Fork yapın
2. Yeni özellik dalı oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişiklikleri commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Dalınıza push yapın (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## Lisans
MIT Lisansı altında dağıtılmaktadır.

## İletişim
- Proje Linki: [[GitHub Deposu](https://github.com/Metecode/e-laboratory-system)]
- E-posta: ismail.ucar2@ogr.sakarya.edu.tr

## Teşekkürler 🙏
- React Native Topluluğu
- Firebase
- Expo
