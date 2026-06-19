# StarClaim Mobile

Mobil Solana entegrasyonu geçici olarak devre dışıdır. Uygulama Expo SDK 54 uyumlu Expo Go ile 2D/3D harita geliştirme ve cihaz testleri için çalıştırılabilir.

## Kurulum

```bash
npm install
```

## Expo Go

```bash
npx expo start
```

Terminalde gösterilen QR kodu Expo Go ile tarayın. Telefon ve bilgisayar aynı ağda olmalıdır.

## Yerel Android Derlemesi

USB hata ayıklama açık bir Android cihaz bağladıktan sonra:

```bash
npx expo run:android
```

## EAS Development Build

```bash
npx eas build --profile development --platform android
```

Solana cüzdan bağlantısı, mesaj imzalama ve SOL ödeme seçeneği bu mobil sürümde sunulmaz. Backend geçmiş kayıt uyumluluğu korunur.
