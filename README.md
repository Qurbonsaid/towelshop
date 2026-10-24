# Towelshop — Sochiq Yetkazib Berish va Moliyaviy Hisob-kitob Tizimi (PWA)

**Towelshop** — sartaroshxonalarni 1 marta ishlatiladigan toza sochiqlar bilan ta'minlash, ishlatilgan sochiqlarni yig'ib olish, savdo va qarzdorliklarni yuritish hamda haydovchi-xodimning ombor va kassa aylanmasini nazorat qilish uchun mo'ljallangan serverless Progressive Web App (PWA).

Ilova mobil qurilmalarda (Android, iOS) hamda shaxsiy kompyuterlarda (Chrome, Edge, Brave) to'laqonli mustaqil dastur ko'rinishida ishlaydi.

---

## 🏢 Biznes modeli va ish jarayoni

1. **Admin (Biznes egasi):**
   - Sochiqlarni tayyorlaydi, yuvadi va omborda saqlaydi.
   - Xodimlarni (haydovchilarni) boshqaradi, ularning roli va hisobotlarini nazorat qiladi.
   - Butun tizimdagi ma'lumotlarni o'chirish (`delete`) huquqiga ega yagona shaxs.

2. **Xodim (Haydovchi):**
   - Ish kuni boshida yoki sochiq tugaganda Admin omboridan yangi sochiq olib ketadi.
   - Sartaroshxonalarga borib, sartaroshlarga yangi sochiqlarni yetkazadi, ishlatilganlarini qaytarib oladi.
   - Naqd va karta (Click) to'lovlarni qabul qiladi, zarurat bo'lganda chegirma beradi.
   - Kun yakunida kassadagi pulni va **sotilmay qolgan yangi sochiqlarni** omborga topshiradi va kunlik hisobotni yopadi.
   - Xodim barcha savdo, yetkazish va qabul qilish amallarini **cheklovlarsiz** (vaqt cheklovisiz) amalga oshira oladi.

3. **Sartaroshlar bilan shartnoma turlari:**
   - **`payForTaken` (Olinganiga to'laydi):** Sartarosh olgan har bir yangi toza sochiq uchun darhol haq to'laydi yoki hisobiga qarz yoziladi (`quantityDelivered * pricePerTowel`).
   - **`payForUsed` (Ishlatilganiga to'laydi):** Sartarosh sochiqni zaxirada saqlaydi va faqat ishlatib, haydovchiga qaytarib topshirgan sochiqlari soni bo'yicha to'laydi (`returnedTowels * pricePerTowel`).

---

## ⚡️ Asosiy Imkoniyatlar

- **Yagona Oynali Savdo Formasi:**
  Xodim bitta qulay oynada bir vaqtning o'zida:
  - Berilgan yangi sochiqlar soni (`quantityDelivered`),
  - Qaytarib olingan ishlatilgan sochiqlar soni (`returnedTowels`),
  - Naqd pul to'lovi (`cashAmount`),
  - Click / Karta to'lovi (`cardAmount`),
  - Chegirma summasi (`discount`),
  - Izoh (`note`) kiritadi.
  Hamma hisob-kitob (sartaroshdagi yangi sochiqlar soni, yangi qarz yoki haqdorlik) **orqa fonda avtomatik** bajariladi va saqlashdan oldin jonli ko'rinadi (live preview).

- **Haydovchining Tovar Qoldig'i va Ombor Zaxirasi:**
  - Haydovchi har doim o'zida ayni vaqtda sotish uchun qancha yangi sochiq borligini (`currentStock`) ko'rib turadi.
  - Kun davomida "Ombordan sochiq olish" tugmasi orqali ombordan yuklangan sochiqlar tarixi (vaqtlari va soni) bilan qayd etib boriladi.
  - Kun yakunida sotilmay qolgan yangi sochiqlar (`unsoldTowelsReturned`) qayd etiladi va kassa hisoboti yopiladi.

- **Sartaroshxonalar Xaritasi (GPS & OpenStreetMap):**
  - Sartaroshxona nomi, telefoni, manzili va aniq koordinatalari saqlanadi.
  - Xodim interaktiv xaritadan yoki joylashuv (Geolokatsiya) orqali sartaroshxona o'rnini belgilashi va xaritada ko'rishi mumkin.

- **Push-bildirishnomalar (Firebase Cloud Messaging):**
  - Xodim savdo qilganida, to'lov qabul qilganda yoki kunlik hisobotni topshirganda Adminga real vaqtda push-xabarnoma boradi.

- **To'liq PWA (Kompyuter va Mobil):**
  - Offline rejimda ishlash imkoniyati (Workbox Service Worker).
  - Kompyuterda Chrome / Edge orqali mustaqil ish stoli ilovasi sifatida o'rnatish (192px va 512px PNG ikonkalar bilan ta'minlangan).

---

## 🔐 Foydalanuvchilar va Rollar

| Huquqlar / Imkoniyatlar | Admin | Yetkazuvchi (`delivery`) | Menejer (`manager`) |
|---|:---:|:---:|:---:|
| Tizimga telefon raqam va parol bilan kirish | ✅ | ✅ | ✅ |
| Yangi sartaroshxona va sartarosh qo'shish | ✅ | ✅ | ❌ |
| Savdo qilish (Yetkazish, Qaytarish, To'lov, Chegirma) | ✅ | ✅ | ❌ |
| O'z savdolarini va hisob-kitoblarni tahrirlash | ✅ | ✅ | ❌ |
| Yetkazuvchiga sochiq berish (Ombor yuklash) | ✅ | ❌ | ✅ |
| Sotilmay qaytgan sochiqlarni qabul qilish | ✅ | ❌ | ✅ |
| Xodimlarni boshqarish va rollarni belgilash | ✅ | ❌ | ❌ |
| Ma'lumotlarni butunlay o'chirish (`deleteDoc`) | ✅ | ❌ | ❌ |
| Push-bildirishnomalarni qabul qilish | ✅ | ❌ | ❌ |

---

## 📊 Ma'lumotlar Bazasi Sxemasi (Cloud Firestore)

Barcha kolleksiyalar optimallashtirilgan, ortiqcha va eski maydonlardan tozalangan:

### 1. `/barbershops` (Sartaroshxonalar)
```json
{
  "name": "Fed",
  "address": "Mustaqillik ko'chasi 14",
  "phone": "998400001",
  "latitude": 37.451077,
  "longitude": 67.153558,
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

### 2. `/barbers` (Sartaroshlar)
```json
{
  "barbershopId": "pofT0tPOQfBCiYUPnXrv",
  "name": "Husraf",
  "phone": "998441408",
  "contractType": "payForTaken", // yoki "payForUsed"
  "pricePerTowel": 3000,
  "towelsCount": 15,            // Sartaroshdagi bor sochiqlar soni
  "debt": 24000,                // Qarzdorlik summasi (so'm)
  "overpaid": 0,                // Haqdorlik / Ortiqcha to'lov (so'm)
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

### 3. `/sales` (Savdo va amallar tarixi)
```json
{
  "barberId": "7f6B5euuRBUTTEcOBHc5",
  "barbershopId": "CmNqYoInW6KeYn1JsQAW",
  "staffId": "4Fsq1WcdNTZ6giKWk5zgVrYUHM23",
  "staffName": "Каримов Абдулазиз",
  "barberName": "Izzat aka",
  "barbershopName": "Izzat aka movoro",
  "quantityDelivered": 8,       // Berilgan yangi sochiqlar
  "returnedTowels": 8,          // Qaytarib olingan ishlatilgan sochiqlar
  "unitPrice": 3000,            // 1 dona narxi
  "totalPrice": 24000,          // Hisoblangan xizmat summasi
  "contractType": "payForTaken",
  "cashAmount": 20000,          // Naqd to'lov
  "cardAmount": 4000,           // Karta / Click to'lov
  "discount": 0,                // Chegirma
  "note": "To'liq hisob-kitob qilindi",
  "date": "2026-10-20",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

### 4. `/dailyReports` (Kunlik hisobot va ombor oqimi)
```json
{
  "date": "2026-10-20",
  "staffId": "4Fsq1WcdNTZ6giKWk5zgVrYUHM23",
  "staffName": "Каримов Абдулазиз",
  "warehouseLoads": [           // Ombordan olinganlar tarixi
    {
      "time": "08:30",
      "count": 200,
      "note": "Ertalabki yuklash",
      "createdAt": "2026-10-20T03:30:00.000Z"
    }
  ],
  "totalLoadedFromWarehouse": 200, // Ombordan jami olingan
  "currentStock": 50,              // Ayni paytda mashinada bor yangi sochiqlar
  "totalDelivered": 150,           // Sartaroshlarga tarqatilgan
  "totalReturned": 130,            // Qaytarib olingan ishlatilgan
  "unsoldTowelsReturned": 50,      // Ish yakunida omborga topshirilgan sotilmagan yangi sochiqlar
  "cashAmount": 350000,            // Jami yig'ilgan naqd
  "cardAmount": 100000,            // Jami Click / Karta
  "discount": 10000,               // Jami chegirmalar
  "totalPaid": 450000,             // Jami qabul qilingan summa (Naqd + Karta)
  "salesCount": 18,                // Amalga oshirilgan savdolar soni
  "status": "closed",              // "active" yoki "closed"
  "updatedAt": "Timestamp",
  "closedAt": "Timestamp"
}
```

### 5. `/users` (Foydalanuvchilar)
```json
{
  "phone": "938001223",
  "name": "Каримов Абдулазиз",
  "role": "delivery",              // "admin", "delivery" (yoki eski "staff"), "manager"
  "fcmTokens": ["..."],
  "createdAt": "Timestamp"
}
```

---

## 🧮 Moliyaviy va Tovar Hisob-kitob Formulalari

1. **Sartaroshdagi sochiqlar soni:**
   $$\text{towelsCount}_{\text{yangi}} = \text{towelsCount}_{\text{eski}} + \text{quantityDelivered} - \text{returnedTowels}$$

2. **Hisoblangan xizmat summasi ($\text{totalPrice}$):**
   - Agar `contractType === "payForTaken"`: $\text{quantityDelivered} \times \text{unitPrice}$
   - Agar `contractType === "payForUsed"`: $\text{returnedTowels} \times \text{unitPrice}$

3. **Qarz va Haqdorlik balansi:**
   $$\text{totalCredit} = \text{cashAmount} + \text{cardAmount} + \text{discount}$$
   $$\text{Net} = (\text{debt} - \text{overpaid}) + \text{totalPrice} - \text{totalCredit}$$
   - Agar $\text{Net} > 0$ bo'lsa: $\text{debt} = \text{Net}, \quad \text{overpaid} = 0$
   - Agar $\text{Net} < 0$ bo'lsa: $\text{debt} = 0, \quad \text{overpaid} = |\text{Net}|$
   - Agar $\text{Net} = 0$ bo'lsa: $\text{debt} = 0, \quad \text{overpaid} = 0$

4. **Haydovchi mashinasidagi yangi sochiqlar qoldig'i:**
   $$\text{currentStock} = \text{totalLoadedFromWarehouse} - \text{totalDelivered} - \text{unsoldTowelsReturned}$$

---

## 🛠 Texnologiyalar To'plami

- **Frontend:** React 19, Vite, Tailwind CSS, React Router v7.
- **Xaritalar:** React Leaflet, Leaflet, OpenStreetMap.
- **PWA:** `vite-plugin-pwa`, Workbox, Web App Manifest, Service Worker.
- **Backend / Ma'lumotlar:** Google Firebase Cloud Firestore, Firebase Authentication, Firebase Cloud Messaging.
- **Admin Tooling:** Node.js, `firebase-admin` SDK (`towelshop-admin/optimize-database.js`).
- **Sifat va Tezlik:** `oxlint` (tezkor Rust asosidagi JS linter).

---

## 💻 Kompyuter va Telefonga O'rnatish (PWA)

### Kompyuterda (Google Chrome / Microsoft Edge / Brave):
1. Saytni brauzerda oching (`http://localhost:5173` yoki domen manzili).
2. Manzil qatori (URL bar)ning o'ng tomonida paydo bo'ladigan **"O'rnatish" (⬇️ yoki 🖥️)** belgisini bosing.
3. Yoki brauzer menyusidan (**⋮**) **"Towelshop ilovasini o'rnatish"** bandini tanlang.
4. Ilova alohida mustaqil oyna sifatida kompyuterga o'rnatiladi.

### Android (Chrome / Samsung Internet):
- Sayt ochilgach, ekranning yuqori o'ng burchagidagi **uch nuqta (⋮)** ni bosing va **"Ilovani o'rnatish"** (yoki "Bosh ekranga qo'shish") bandini tanlang.

### iPhone / iPad (Safari):
- Brauzerning pastki qismidagi **"Ulashish" (Share)** tugmasini bosing va menyudan **"Bosh ekranga qo'shish" (Add to Home Screen)** ni tanlang.

---

## 🚀 Ishga Tushirish

### 1. Bog'liqliklarni o'rnatish:
```bash
npm install
```

### 2. Dasturni lokal ishga tushirish (Dev mode):
```bash
npm run dev
```

### 3. Kod sifatini tekshirish (Linter):
```bash
npm run lint
```

### 4. Ishlab chiqarishga yig'ish (Production Build):
```bash
npm run build
```

---

## 🗄 Ma'lumotlar Bazasini Boshqarish (`towelshop-admin`)

Loyiha yonidagi `towelshop-admin` papkasi orqali Firebase Admin SDK yordamida ma'lumotlar bazasini batch rejimda optimallashtirish va eksport qilish mumkin:

```bash
cd ../towelshop-admin
node optimize-database.js
```
Bu skript:
- Barcha sartaroshlarni `towelsCount` tizimiga o'tkazadi va eski maydonlarni o'chiradi;
- Savdolardagi eski `receivedMoney`, `totalPaid` maydonlarini tozalab, `cashAmount`, `cardAmount`, `discount` sxemasiga moslaydi;
- Kunlik hisobotlarga ombor yuklamalari va qoldiqlarni biriktiradi;
- Toza ma'lumotlarni JSON fayllarga eksport qiladi.
