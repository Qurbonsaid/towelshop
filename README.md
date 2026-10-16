# Towelshop — Professional Sochiq Yetkazib Berish va Hisob-kitob Tizimi (Mobile PWA)

Ishlab chiqarishga tayyor (production-ready), mobilga moslashtirilgan PWA ilova.
Faqat O'zbek (Lotin) alifbosidagi toza interfeys bilan yaratilgan. Hech qanday rasm yuklash imkoniyati yo'q.

---

## 🛠 Texnologiyalar to'plami (Tech Stack)

- **Frontend**: React 19 (Vite), Tailwind CSS, Lucide SVG Icons, React Leaflet (OpenStreetMap), Vite Plugin PWA (Workbox offline caching).
- **Backend / BaaS**: Firebase Authentication, Cloud Firestore, Firebase Cloud Messaging (FCM), Firebase Cloud Functions (Node.js).
- **Mobile First**: Smartfon brauzerlari va o'rnatiladigan PWA ilovalar uchun 44px+ sensor tugmalar, qulay bottom navigatsiya va kartochkali dizayn.

---

## 🔐 Autentifikatsiya va Rollar Tizimi

- **Telefon raqamidan emailga o'tkazish (Phone-to-Email Mapping)**:
  Foydalanuvchi tizimga 9 xonali telefon raqami (masalan: `901234567`) va parol bilan kiradi. Ilova buni avtomatik ravishda `901234567@towelshop.local` formatiga aylantirib Firebase Auth orqali tekshiradi.
- **Foydalanuvchi rollari (`/users/{uid}`)**:
  1. **Admin (Administrator)**:
     - Tizimga to'liq kirish huquqi.
     - Sartaroshxonalar, sartaroshlar va xodimlarni boshqarish (to'liq CRUD).
     - Barcha savdolarni istalgan vaqtda cheklovsiz tahrirlash (Master Sales Ledger).
     - Xodimlar savdo kiritganda yoki tahrirlaganda real vaqtda FCM push-bildirishnoma qabul qilish.
  2. **Staff (Xodim)**:
     - Sochiq yetkazib berish (savdo) va qaytarish (yig'im) oqimlarini rasmiylashtirish.
     - O'zi kiritgan sotuvlarni **faqat qat'iy 12 soatlik vaqt oralig'ida** tahrirlash (orqaga sanovchi taymer bilan). 12 soatdan so'ng tahrirlash bloklanadi.
     - Sartaroshxona yoki sartarosh qo'shish/o'chirish huquqi yo'q.
  3. **Barber (Mijoz sartarosh)**:
     - Tizimga kirmaydigan, ma'lumotlar bazasida Admin va Xodim tomonidan boshqariladigan mijoz obyekti.

---

## 📊 Ma'lumotlar sxemasi (Firestore Collections)

1. **`/barbershops`**
   - `id`: Hujjat ID si
   - `name`: Nomi (masalan: "Markaziy Barber Lounge")
   - `address`: Manzil / Mo'ljal
   - `phone`: Aloqa telefoni
   - `latitude`, `longitude`: Xaritadagi koordinatalar (Leaflet Map Modal orqali belgilanadi)
   - `createdAt`: serverTimestamp()

2. **`/barbers`**
   - `id`: Hujjat ID si
   - `barbershopId`: Biriktirilgan sartaroshxona ID si
   - `name`: Ism-familiyasi
   - `phone`: Telefon raqami
   - `contractType`: `"payForTaken"` (Olingan sochiq uchun darhol qarz) yoki `"payForUsed"` (Faqat ishlatilgan/qaytarilgan sochiq uchun)
   - `pricePerTowel`: Bitta toza sochiq narxi (so'm)
   - `debt`: Joriy qarz summasi
   - `overpaid`: Joriy haqdorlik (oldindan to'langan ortiqcha summa)
   - `createdAt`: serverTimestamp()

3. **`/sales`**
   - `id`: Hujjat ID si
   - `barberId`: Sartarosh ID si
   - `barbershopId`: Sartaroshxona ID si
   - `staffId`: Sotuvni amalga oshirgan xodim ID si
   - `staffName`: Xodim ismi
   - `barberName`: Sartarosh ismi
   - `barbershopName`: Sartaroshxona nomi
   - `quantityDelivered`: Yetkazilgan toza sochiq soni
   - `unitPrice`: 1 dona sochiq narxi
   - `totalPrice`: Jami summa (`quantityDelivered * unitPrice`)
   - `contractType`: Shartnoma turi
   - `note`: Izoh
   - `createdAt`: serverTimestamp()
   - `updatedAt`: serverTimestamp()

4. **`/returns`**
   - `id`: Hujjat ID si
   - `barberId`: Sartarosh ID si
   - `barbershopId`: Sartaroshxona ID si
   - `staffId`: Qabul qilib olgan xodim ID si
   - `staffName`: Xodim ismi
   - `quantityReturned`: Qaytarib olingan ishlatilgan sochiqlar soni
   - `note`: Izoh
   - `createdAt`: serverTimestamp()

5. **`/users/{uid}`**
   - `uid`: Foydalanuvchi ID si
   - `phone`: 9 xonali telefon raqami
   - `name`: Ism-familiyasi
   - `role`: `"admin"` yoki `"staff"`
   - `fcmTokens`: Web Push xabarnomalari uchun FCM tokenlari massivi
   - `createdAt`: serverTimestamp()

---

## 🔔 Push-bildirishnomalar (FCM + Cloud Functions)

- **Service Worker (`public/firebase-messaging-sw.js`)**: Fon rejimida (brauzer yopiq yoki minimallashtirilgan bo'lsa ham) xabarnomalarni ko'rsatish uchun ro'yxatdan o'tkazilgan.
- **Admin tokenini saqlash**: Admin tizimga kirganida brauzerdan ruxsat so'raladi va olingan Web Push tokeni `/users/{uid}.fcmTokens` maydoniga yoziladi.
- **Cloud Function Triggerlari (`functions/index.js`)**:
  - `onSaleCreated`: `/sales/{saleId}` hujjati yaratilganda ishga tushadi, barcha Adminlarga xabarnoma yuboradi:
    - Sarlavha: `Yangi sotuv amalga oshirildi`
    - Matn: `{staffName} hodim {barberName} sartaroshga {quantityDelivered} ta sochiq topshirdi. Summa: {totalPrice} so'm.`
  - `onSaleUpdated`: `/sales/{saleId}` tahrirlanganda Adminlarga push jo'natadi:
    - Sarlavha: `Sotuv tahrirlandi`
  - Muddati o'tgan yoki yaroqsiz tokenlarni avtomatik aniqlab Firestore dan o'chiradi.

---

## 🛡 Firestore Xavfsizlik Qoidalari (`firestore.rules`)

- **12 soatlik qat'iy cheklov**:
  ```javascript
  request.time < resource.data.createdAt + duration.value(12, 'h')
  ```
  Xodim faqat o'zi kiritgan sotuvni dastlabki 12 soat ichida tahrir qilishi mumkin. 12 soatdan so'ng tahrirlash huquqi faqat Adminga beriladi.

---

## 🚀 Ishga tushirish

1. **Bog'liqliklarni o'rnatish**:
   ```bash
   npm install
   ```

2. **Dasturni ishga tushirish**:
   ```bash
   npm run dev
   ```

3. **Production Build**:
   ```bash
   npm run build
   ```
