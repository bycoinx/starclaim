# StarClaim Mobile (Cockpit AAA)

Bu uygulama Solana ve 3D (Three.js/GL) bileşenleri içerdiği için standart **Expo Go** uygulaması ile çalışmaz. Uygulamayı fiziksel bir Android cihazda çalıştırmak için bir "Development Client" (Geliştirme İstemcisi) oluşturmanız gerekmektedir.

## 🚀 Kurulum ve Çalıştırma

### 1. Bağımlılıkları Yükleyin
```bash
npm install --legacy-peer-deps
```

### 2. Fiziksel Cihazda Çalıştırma (Önerilen)
Fiziksel Android telefonunuzu USB ile bilgisayara bağlayın (USB Hata Ayıklama açık olmalıdır).

Ardından şu komutu çalıştırın:
```bash
npx expo run:android
```
*Bu komut uygulamayı derleyip telefonunuza yükleyecektir. Bir kez yüklendikten sonra kod değişiklikleri anında (hot reload) yansır.*

### 3. Polyfills Notu
Solana web3.js kütüphanesinin React Native ortamında çalışabilmesi için `polyfills.js` dosyası `app/_layout.js` içerisinde en üstte import edilmiştir.

### 4. Alternatif: EAS Build (Bulut Derleme)
Eğer bilgisayarınızda Android SDK yüklü değilse veya derleme işlemi RAM'inizi zorluyorsa, Expo'nun bulut servislerini kullanabilirsiniz:
```bash
npx eas build --profile development --platform android
```
Derleme bittiğinde verilen APK'yı telefonunuza kurun ve `npx expo start --dev-client` komutu ile çalıştırın.
