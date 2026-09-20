/**
 * Arabic message catalogue for the international auction marketplace (T015).
 *
 * Arabic is the primary locale; English is the secondary. Both catalogues
 * share an identical key shape, enforced by TypeScript: `en.ts` is typed as
 * `Messages`, which is exactly the object shape of this catalogue. `MessageKey`
 * is the union of every literal key, so a missing or misspelled key anywhere in
 * the codebase (including the dashboard configuration in
 * `src/config/marketplace.ts`) is a compile-time error rather than a runtime
 * blank.
 *
 * The key space is flat dotted keys rather than nested objects. Nested trees
 * cannot express both `filters.realEstate.location` and
 * `filters.realEstate.location.placeholder` (a string leaf and an object
 * parent), which the configuration requires.
 */

export const messagesAr = {
  "app.name": "المزاد الدولي",

  "common.loading": "جارٍ التحميل",
  "common.error": "حدث خطأ",
  "common.retry": "إعادة المحاولة",
  "common.cancel": "إلغاء",
  "common.save": "حفظ",
  "common.close": "إغلاق",
  "common.back": "رجوع",
  "common.search": "بحث",
  "common.clearAll": "مسح الكل",
  "common.confirm": "تأكيد",
  "common.empty": "لا توجد نتائج",
  "common.favorite": "إضافة إلى المفضلة",
  "common.removeFavorite": "إزالة من المفضلة",

  "status.upcoming": "قادم",
  "status.live": "حالي",
  "status.ended": "منتهي",
  "status.directSale": "بيع مباشر",

  "saleType.bySale": "بالبيع",
  "saleType.sellerOption": "بحق الاختيار",

  "category.vehicle": "سيارات",
  "category.realEstate": "عقارات",
  "category.licensePlate": "لوحات مرورية",

  "seller.privateOwner": "مالك خاص",

  "currency.sar": "ريال سعودي",
  "currency.bhd": "دينار بحريني",

  "calendar.gregorian": "ميلادي",
  "calendar.hijri": "هجري",

  "filters.category": "الفئة",
  "filters.option.category.vehicle": "سيارات",
  "filters.option.category.realEstate": "عقارات",
  "filters.option.category.licensePlate": "لوحات مرورية",

  "filters.sellerType": "نوع البائع",
  "filters.option.sellerType.individual": "فرد",
  "filters.option.sellerType.company": "شركة",

  "filters.auctionStatus": "حالة المزاد",
  "filters.option.auctionStatus.upcoming": "قادم",
  "filters.option.auctionStatus.live": "حالي",
  "filters.option.auctionStatus.ended": "منتهي",

  "filters.companyName": "اسم الشركة",
  "filters.companyName.placeholder": "ابحث باسم الشركة",

  "filters.group.category": "الفئة",
  "filters.group.sellerType": "نوع البائع",
  "filters.group.auctionStatus": "حالة المزاد",

  "filters.vehicle.brand": "العلامة التجارية",
  "filters.option.brand.volkswagen": "فولكسفاغن",
  "filters.option.brand.bmw": "بي إم دبليو",
  "filters.option.brand.audi": "أودي",
  "filters.option.brand.mercedes-benz": "مرسيدس-بنز",
  "filters.option.brand.toyota": "تويوتا",
  "filters.option.brand.ford": "فورد",
  "filters.option.brand.tesla": "تسلا",
  "filters.option.brand.other": "أخرى",

  "filters.vehicle.fuelType": "نوع الوقود",
  "filters.option.fuelType.petrol": "بنزين",
  "filters.option.fuelType.diesel": "ديزل",
  "filters.option.fuelType.electric": "كهربائي",
  "filters.option.fuelType.hybrid": "هجين",
  "filters.option.fuelType.other": "أخرى",

  "filters.vehicle.transmission": "ناقل الحركة",
  "filters.option.transmission.manual": "يدوي",
  "filters.option.transmission.automatic": "أوتوماتيكي",

  "filters.vehicle.year": "سنة الصنع",
  "filters.vehicle.mileage": "العداد (كيلومتر)",

  "filters.realEstate.propertyType": "نوع العقار",
  "filters.option.propertyType.house": "منزل",
  "filters.option.propertyType.apartment": "شقة",
  "filters.option.propertyType.commercial": "تجاري",
  "filters.option.propertyType.land": "أرض",
  "filters.option.propertyType.other": "أخرى",

  "filters.realEstate.location": "الموقع",
  "filters.realEstate.location.placeholder": "المدينة أو الحي",

  "filters.realEstate.price": "السعر",
  "filters.realEstate.livingArea": "المساحة (م²)",

  "filters.licensePlate.plateType": "نوع اللوحة",
  "filters.option.plateType.standard": "عادية",
  "filters.option.plateType.personalized": "مخصصة",
  "filters.option.plateType.vanity": "مميزة",
  "filters.option.plateType.special": "خاصة",

  "filters.licensePlate.pattern": "رقم اللوحة",
  "filters.licensePlate.pattern.placeholder": "مثال: 123 أ ب",

  "filters.licensePlate.priceLimit": "الحد الأعلى للسعر",

  "banks.alrajhi": "مصرف الراجحي",
  "banks.snb": "البنك الأهلي السعودي",
  "banks.riyad": "بنك الرياض",
  "banks.alinma": "مصرف الإنماء",
  "banks.nbb": "بنك البحرين الوطني",
  "banks.bbk": "بنك البحرين والكويت",
  "banks.other": "أخرى (تحويل دولي)",
} satisfies Record<string, string>;

/**
 * Shape of every catalogue. Arabic is the reference shape; `en.ts` is typed
 * against it so a divergence in either direction is a TypeScript error. Values
 * are widened to `string` (no `as const`) so the English catalogue is not
 * forced to reproduce the Arabic literals; key names stay literal.
 */
export type Messages = typeof messagesAr;

/** Every catalogue key as a literal union; config `*Key` fields are typed against it. */
export type MessageKey = keyof Messages;
