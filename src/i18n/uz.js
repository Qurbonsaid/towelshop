export const uz = {
  appName: "Towelshop",
  appDescription:
    "Sartaroshxonalar uchun professional sochiq yetkazib berish va hisob-kitob tizimi",

  roles: {
    admin: "Administrator",
    delivery: "Yetkazish (Haydovchi)",
    manager: "Menejer (Omborchi)",
    staff: "Yetkazish (Haydovchi)",
    barber: "Sartarosh",
  },

  contractTypes: {
    payForTaken: "Olingan sochiq uchun to'lov",
    payForTakenDesc: "Har bir yangi olingan sochiq uchun darhol hisoblanadi",
    payForUsed: "Ishlatilgan sochiq uchun to'lov",
    payForUsedDesc:
      "Faqat qaytarib olingan/ishlatilgan sochiqlar bo'yicha hisoblanadi",
  },

  login: {
    title: "Tizimga kirish",
    subtitle: "Telefon raqamingiz va parolingiz bilan kiring",
    phoneLabel: "Telefon raqami (9 xonali)",
    phonePlaceholder: "90 123 45 67",
    passwordLabel: "Parol",
    passwordPlaceholder: "Parolingizni kiriting",
    submit: "Tizimga kirish",
    loading: "Tekshirilmoqda...",
    phoneError:
      "Telefon raqami to'liq 9 xonali bo'lishi kerak (masalan: 901234567)",
    invalidCredentials: "Telefon raqami yoki parol noto'g'ri",
  },

  nav: {
    barbershops: "Sartaroshxonalar",
    sales: "Savdolar",
    stats: "Statistika",
    staff: "Xodimlar",
    warehouse: "Ombor",
    profile: "Profil",
    map: "Xarita",
    logout: "Chiqish",
  },

  manager: {
    title: "Ombor nazorati",
    subtitle: "Yetkazuvchilarga sochiq berish va qoldiqni qabul qilish",
    giveTowels: "Sochiq berish",
    receiveTowels: "Qoldiqni qabul qilish",
    driverList: "Yetkazuvchilar ro'yxati",
    loadedToday: "Ombordan berildi",
    deliveredToday: "Tarqatildi",
    inCar: "Mashinada",
    returnedUsed: "Qaytarilgan (ishlatilgan)",
    returnedUnsold: "Sotilmay qaytgan",
    noDrivers: "Hozircha yetkazuvchilar mavjud emas",
    loadModalTitle: "Yetkazuvchiga sochiq berish",
    receiveModalTitle: "Sotilmagan sochiqlarni qabul qilish",
    countLabel: "Beriladigan sochiqlar soni (dona)",
    unsoldLabel: "Sotilmagan yangi sochiqlar soni (dona)",
    confirmGive: "Berishni tasdiqlash",
    confirmReceive: "Qabul qilish va kunni yopish",
  },

  common: {
    loading: "Yuklanmoqda...",
    save: "Saqlash",
    cancel: "Bekor qilish",
    delete: "O'chirish",
    edit: "Tahrirlash",
    close: "Yopish",
    search: "Qidirish...",
    filter: "Filtrlash",
    all: "Barchasi",
    actions: "Amallar",
    date: "Sana",
    time: "Vaqt",
    note: "Izoh",
    notePlaceholder: "Qo'shimcha izoh kiritish (ixtiyoriy)...",
    sum: "so'm",
    pcs: "dona",
    quantity: "Miqdori",
    price: "Narxi",
    total: "Jami",
    status: "Holat",
    confirm: "Tasdiqlash",
    error: "Xatolik yuz berdi. Qaytadan urinib ko'ring.",
    success: "Muvaffaqiyatli saqlandi!",
    phone: "Telefon",
    name: "Ism-familiya",
    address: "Manzil",
    coordinates: "Koordinatalar",
  },

  fcm: {
    bannerTitle: "Push-bildirishnomalarni yoqish",
    bannerText:
      "Xodimlar tomonidan amalga oshirilgan barcha sotuvlar va tahrirlashlarni darhol ekranda ko'rib boring.",
    enableBtn: "Bildirishnomalarni yoqish",
    statusActive: "Bildirishnomalar yoqilgan (Faol)",
    statusDenied: "Brauzerda ruxsat berilmagan",
    statusUnsupported:
      "Ushbu brauzerda push bildirishnoma qo'llab-quvvatlanmaydi",
    testBtn: "Sinov bildirishnomasi",
    testSent: "Sinov bildirishnomasi yuborildi!",
    newSaleTitle: "Yangi sotuv amalga oshirildi",
    saleUpdatedTitle: "Sotuv tahrirlandi",
  },

  admin: {
    title: "Administrator Boshqaruv Markazi",
    subtitle:
      "Barcha sartaroshxonalar, sotuvlar, xodimlar va moliyaviy oqimlar",
    stats: {
      dailyTitle: "Kunlik sotuv",
      monthlyTitle: "Oylik sotuv",
      allTimeTitle: "Umumiy sotuv",
      totalDebtTitle: "Umumiy qarzdorlik",
      totalOverpaidTitle: "Ortiqcha to'lovlar",
      salesCount: "ta sotuv",
      towelCount: "dona sochiq",
    },
    tabs: {
      stats: "Statistika",
      sales: "Sotuvlar jurnali",
      returns: "Qaytarimlar",
      barbershops: "Sartaroshxonalar",
      barbers: "Sartaroshlar",
      staff: "Xodimlar",
    },
    masterLedger: {
      title: "Barcha sotuvlar tarixi",
      fullEditNotice:
        "Administrator har qanday sotuv ma'lumotini istalgan paytda vaqt cheklovisiz to'liq tahrirlashi mumkin.",
      searchPlaceholder: "Xodim, sartaroshxona yoki sartarosh ismi bo'yicha...",
      noSales: "Hozircha sotuvlar mavjud emas.",
      editModalTitle: "Sotuvni tahrirlash (Admin)",
      deleteConfirm: "Ushbu sotuv yozuvini o'chirishni tasdiqlaysizmi?",
    },
    returnsLedger: {
      title: "Qaytarilgan sochiqlar jurnali",
      noReturns: "Hozircha qaytarimlar mavjud emas.",
    },
    barbershops: {
      title: "Sartaroshxonalar ro'yxati",
      addBtn: "Sartaroshxona qo'shish",
      editBtn: "Tahrirlash",
      nameLabel: "Sartaroshxona nomi",
      namePlaceholder: "Masalan: Barber King, Afsona",
      addressLabel: "Manzil / Mo'ljal",
      addressPlaceholder: "Chilonzor 9-mavze, 12-uy",
      phoneLabel: "Telefon raqami",
      phonePlaceholder: "901234567",
      locationLabel: "Tanlang",
      pickLocation: "Xaritadan tanlash",
      locationSelected: "Joylashuv belgilangan",
      noLocationSelected: "Joylashuv belgilanmagan",
      deleteConfirm:
        "Sartaroshxonani o'chirmoqchimisiz? Undagi sartaroshlar ham hisobdan chiqariladi.",
      totalBarbers: "sartarosh bor",
    },
    barbers: {
      title: "Sartaroshlar (Mijozlar)",
      addBtn: "Yangi sartarosh",
      editTitle: "Sartarosh ma'lumotlarini tahrirlandi",
      editBody: "Sartarosh ma'lumotlari xodim tomonidan tahrirlandi!",
      barbershopLabel: "Biriktirilgan sartaroshxona",
      nameLabel: "Sartarosh ismi va familiyasi",
      namePlaceholder: "Jasur Rustamov",
      phoneLabel: "Telefon raqami (9 xonali)",
      phonePlaceholder: "901234567",
      contractTypeLabel: "Hisob-kitob shartnomasi turi",
      priceLabel: "Bitta toza sochiq narxi (so'm)",
      pricePlaceholder: "3000",
      initialDebtLabel: "Boshlang'ich qarz summasi (so'm)",
      initialOverpaidLabel: "Boshlang'ich ortiqcha to'lov (so'm)",
      initialTowelsLabel: "Hozirda qo'lidagi sochiqlar soni (dona)",
      filterByShop: "Sartaroshxona bo'yicha filtrlash",
      currentDebt: "Qarz",
      currentOverpaid: "Haqdorlik",
      settlePaymentBtn: "To'lov qabul qilish",
      settlePaymentTitle: "Sartaroshdan to'lov qabul qilish",
      paymentAmountLabel: "To'langan summa (so'm)",
      deleteConfirm: "Sartaroshni o'chirmoqchimisiz?",
    },
    staff: {
      title: "Tizim xodimlari",
      addBtn: "Yangi xodim qo'shish",
      nameLabel: "Xodim ismi",
      namePlaceholder: "Alisher Valiyev",
      phoneLabel: "Telefon raqami (Login uchun 9 xonali)",
      phonePlaceholder: "907778899",
      passwordLabel: "Boshlang'ich parol",
      passwordPlaceholder: "Kamida 6 ta belgi",
      roleLabel: "Vazifasi (Roli)",
      staffRoleDesc:
        "Faqat savdo va qaytarim kiritadi, 12 soat ichida tahrirlay oladi.",
      adminRoleDesc: "To'liq tizim huquqlari va boshqaruviga ega.",
      deleteConfirm: "Ushbu xodim profilini o'chirishni tasdiqlaysizmi?",
    },
  },

  staff: {
    title: "Xodim Ish Paneli",
    deliveryTab: "Yetkazib berish (Savdo)",
    collectionTab: "Qaytarim / Yig'im",
    barbershop: "Sartaroshxona",
    selectBarbershop: "Sartaroshxonani tanlang",
    barber: "Sartarosh",
    selectBarber: "Sartaroshni tanlang",
    barberInfo: "Sartarosh hisobi:",
    contractType: "Shartnoma:",
    unitPrice: "1 ta sochiq narxi:",
    debtBalance: "Qarzdorlik:",
    overpaidBalance: "Ortiqcha to'lov:",
    deliveryQty: "Yetkazilgan toza sochiq soni",
    acceptedQty: "Sartarosh qabul qilgan sochiq soni",
    collectionQty: "Qaytarib olingan ishlatilgan sochiq soni",
    totalPrice: "Jami savdo summasi:",
    note: "Izoh (ixtiyoriy)",
    submitDelivery: "Savdoni saqlash va rasmiylashtirish",
    submitCollection: "Qaytarimni saqlash",
    twelveHourRule:
      "Eslatma: Siz kiritgan savdoni faqat 12 soat davomida tahrir qilishingiz mumkin. 12 soatdan so'ng tahrirlash faqat admin huquqiga o'tadi.",
    recentSalesTitle: "Mening so'nggi sotuvlarim",
    recentReturnsTitle: "Mening so'nggi qaytarimlarim",
    timeLeft: "qoldi",
    expiredRule: "12 soatlik tahrirlash muddati tugagan",
    canEdit: "Tahrirlash mumkin",
    editSaleTitle: "Sotuvni tahrirlash (12 soat ichida)",
    saleUpdatedSuccess: "Sotuv muvaffaqiyatli tahrirlandi!",
    saleCreatedSuccess:
      "Sotuv muvaffaqiyatli saqlandi va adminga bildirishnoma yuborildi!",
    returnCreatedSuccess: "Qaytarim muvaffaqiyatli saqlandi!",
    noRecentSales: "Hozircha birorta sotuv qayd etmagansiz.",
  },

  map: {
    title: "Sartaroshxonalar xaritasi",
    subtitle: "Mijozlarning geografik nuqtalari",
    noLocation:
      "Xaritada faqat koordinatasi ko'rsatilgan sartaroshxonalar aks etadi.",
    selectLocationModalTitle: "Xaritadan joylashuvni tanlang",
    selectLocationHint:
      "Joylashuvni aniq belgilash uchun xaritadagi kerakli joyga bosing yoki belgini kerakli joyga suring.",
    latitude: "Kenglik (Lat):",
    longitude: "Uzunlik (Lng):",
    getMyLocation: "Mening joylashuvim",
    confirmLocation: "Tanlash",
    viewBarbers: "Sartaroshlar soni:",
    tradeHere: "Ushbu sartaroshxonaga savdo qilish",
  },

  profile: {
    title: "Mening profilim",
    subtitle: "Shaxsiy ma'lumotlar va xavfsizlik",
    nameLabel: "Ism-familiya",
    namePlaceholder: "Ismingizni kiriting",
    phoneLabel: "Telefon raqami (9 xonali)",
    phonePlaceholder: "901234567",
    currentPasswordLabel: "Joriy parol",
    currentPasswordPlaceholder: "Joriy parolingizni kiriting",
    currentPasswordHint:
      "Parol yoki telefon raqamini o'zgartirish uchun joriy parolingizni kiritish majburiy",
    currentPasswordRequired:
      "Parol yoki telefon raqamini yangilash uchun joriy parolni kiritish shart!",
    newPasswordLabel: "Yangi parol (ixtiyoriy)",
    newPasswordPlaceholder: "Kamida 6 ta belgi",
    confirmPasswordLabel: "Yangi parolni tasdiqlash",
    confirmPasswordPlaceholder: "Yangi parolni qayta kiriting",
    passwordMismatch: "Yangi parollar bir-biriga mos kelmadi!",
    passwordTooShort: "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak!",
    invalidPhone:
      "Telefon raqami to'liq 9 xonali bo'lishi kerak (masalan: 901234567)!",
    saveSuccess: "Profil ma'lumotlari muvaffaqiyatli saqlandi!",
    wrongPassword: "Joriy parol noto'g'ri kiritildi!",
    roleLabel: "Tizimdagi vazifangiz (Roli)",
    saveBtn: "Profilni saqlash",
    logoutBtn: "Tizimdan chiqish",
  },

  barbershopDetails: {
    backToShops: "Barcha sartaroshxonalar",
    openInMap: "Xaritada ochish (Navigatsiya)",
    coordinatesNotSet: "Joylashuv koordinatasi belgilanmagan",
    barbersTitle: "Sartaroshlar ro'yxati",
    noBarbers: "Ushbu sartaroshxonada hali sartaroshlar mavjud emas.",
    addBarber: "Qo'shish",
    editShop: "Sartaroshxona ma'lumotlarini tahrirlash",
    deleteShop: "Sartaroshxonani o'chirish",
    deleteShopConfirmTitle: "Sartaroshxonani o'chirishni tasdiqlang",
    deleteShopConfirmDesc:
      "DIQQAT! Ushbu sartaroshxona o'chirilsa, unga tegishli BARCHA sartaroshlar, savdolar va qaytarimlar butunlay o'chiriladi. Ushbu amalni ortga qaytarib bo'lmaydi!",
    deleteShopVerificationPrompt:
      "Tasdiqlash uchun quyidagi maydonga sartaroshxona nomini aynan yozing:",
    deleteSuccess:
      "Sartaroshxona va barcha bog'liq ma'lumotlar muvaffaqiyatli o'chirildi!",
    totalTowelsHeld: "Band sochiqlar",
    currentDebt: "Qarz",
    overpaid: "Haqdorlik",
  },

  barberDetails: {
    title: "Sartarosh tafsilotlari",
    backToShop: "Sartaroshxonaga qaytish",
    saleBtn: "Sotish",
    saleTitle: "Sotish va qaytarib olish",
    giveTowels: "Sochiq berish",
    receiveTowels: "Sochiq olish",
    infoSection: "Ma'lumotlar",
    statsSection: "Statistikalar",
    heldTowels: "Qo'lidagi sochiqlar soni",
    heldTowelsDesc:
      "Hozirda sartaroshda mavjud bo'lgan toza/ishlatilgan sochiqlar balansi",
    currentDebt: "Joriy qarzdorlik",
    overpaidBalance: "Ortiqcha to'lov (Haqdorlik)",
    totalDelivered: "Jami berilgan sochiqlar",
    totalReturned: "Jami qaytarilgan sochiqlar",
    totalSalesVolume: "Jami savdo aylanmasi",
    pricePerTowel: "1 ta sochiq narxi",
    contractType: "Hisob-kitob shartnomasi",
    barbershop: "Sartaroshxona",
    phone: "Telefon raqami",
    callBtn: "Qo'ng'iroq qilish",
    settlePaymentBtn: "To'lov qabul qilish",
    editBarber: "Sartaroshni tahrirlash",
    deleteBarber: "Sartaroshni o'chirish",
    deleteBarberConfirmTitle: "Sartaroshni o'chirishni tasdiqlang",
    deleteBarberConfirmDesc:
      "Haqiqatan ham ushbu sartaroshni va uning hisobini tizimdan o'chirmoqchimisiz?",
    deleteSuccess: "Sartarosh muvaffaqiyatli o'chirildi!",
    giveTowelsTitle: "Sochiq yetkazib berish (Savdo)",
    receiveTowelsTitle: "Ishlatilgan sochiqlarni qaytarib olish",
    deliveryQtyLabel: "Yetkazib berilayotgan toza sochiq soni (dona)",
    returnQtyLabel: "Qaytarib olinayotgan sochiq soni (dona)",
    unitPriceLabel: "1 ta sochiq narxi (so'm)",
    paymentAmountLabel: "Qabul qilingan to'lov (ixtiyoriy, so'm)",
    totalAmountLabel: "Jami savdo summasi",
    noteLabel: "Izoh (ixtiyoriy)",
    recordDeliveryBtn: "Tasdiqlash va saqlash",
    recordReturnBtn: "Qaytarimni saqlash",
    deliverySuccess: "Sochiq topshirildi va savdo yozildi!",
    returnSuccess: "Qaytarim muvaffaqiyatli saqlandi!",
    paymentSuccess: "To'lov muvaffaqiyatli qabul qilindi!",
    recentTransactions: "So'nggi harakatlar",
    noTransactions: "Hozircha savdo yoki qaytarim qayd etilmagan.",
  },

  notifications: {
    titles: {
      delivery: "Yangi sochiq yetkazildi",
      return: "Sochiqlar qaytarildi",
      deliveryAndReturn: "Sochiq yetkazildi va qaytarildi",
      payment: "Yangi to'lov qabul qilindi",
      saleUpdated: "Sotuv tahrirlandi",
      handover: "Kunlik kassa topshirildi",
    },
    pushDelivery: (staffName, barberName, quantityDelivered, totalPrice) =>
      `${staffName}: ${barberName} sartaroshga ${quantityDelivered} dona toza sochiq topshirdi (${Number(
        totalPrice
      ).toLocaleString()} so'm).`,
    pushReturn: (staffName, barberName, returnedTowels) =>
      `${staffName}: ${barberName} sartaroshdan ${returnedTowels} dona ishlatilgan sochiq qabul qildi.`,
    pushDeliveryAndReturn: (
      staffName,
      barberName,
      quantityDelivered,
      returnedTowels,
      totalPrice
    ) =>
      `${staffName}: ${barberName} sartaroshga ${quantityDelivered} dona berildi, ${returnedTowels} dona qaytarildi (${Number(
        totalPrice
      ).toLocaleString()} so'm).`,
    pushPayment: (
      staffName,
      barberName,
      totalPaid,
      cashAmount = 0,
      cardAmount = 0,
      discount = 0
    ) => {
      const details = [];
      if (cashAmount > 0)
        details.push(`Naqd: ${Number(cashAmount).toLocaleString()} so'm`);
      if (cardAmount > 0)
        details.push(`Karta: ${Number(cardAmount).toLocaleString()} so'm`);
      if (discount > 0)
        details.push(`Chegirma: ${Number(discount).toLocaleString()} so'm`);
      const detailsStr = details.length > 0 ? ` (${details.join(", ")})` : "";
      return `${staffName}: ${barberName} sartaroshdan ${Number(
        totalPaid
      ).toLocaleString()} so'm to'lov oldi${detailsStr}.`;
    },
    pushSaleUpdated: (staffName, barberName, details) =>
      `${staffName}: ${barberName} sartarosh bo'yicha sotuv tahrirlandi${
        details ? ` (${details})` : ""
      }.`,
    pushHandover: (staffName, totalPaid, cashAmount = 0, cardAmount = 0) =>
      `${staffName} bugungi kassani topshirdi: Jami ${Number(
        totalPaid
      ).toLocaleString()} so'm (Naqd: ${Number(
        cashAmount
      ).toLocaleString()} so'm, Karta: ${Number(
        cardAmount
      ).toLocaleString()} so'm).`,
    pushSaleBody: (staffName, barberName, quantityDelivered, totalPrice) =>
      `${staffName} hodim ${barberName} sartaroshga ${quantityDelivered} ta sochiq topshirdi. Summa: ${Number(
        totalPrice
      ).toLocaleString()} so'm.`,
  },
};
