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
  "auth.phoneForm.country": "الدولة",
  "auth.phoneForm.country.saudi": "السعودية (+966)",
  "auth.phoneForm.country.bahrain": "البحرين (+973)",
  "auth.phoneForm.phoneNumber": "رقم الجوال",
  "auth.phoneForm.sendCode": "إرسال الرمز",
  "auth.phoneForm.invalidCountry": "اختر دولة صحيحة",
  "auth.phoneForm.invalidSaudi":
    "أدخل رقم جوال سعوديًا من {digits} أرقام يبدأ بالرقم {prefix}",
  "auth.phoneForm.invalidBahrain": "أدخل رقم هاتف بحرينيًا من {digits} أرقام",
  "auth.phoneForm.sendFailed": "تعذر إرسال الرمز. حاول مرة أخرى.",

  "auth.otp.title": "تحقق من رقم جوالك",
  "auth.otp.verificationCode": "رمز التحقق",
  "auth.otp.digit": "الرقم {number} من رمز التحقق",
  "auth.otp.verifyCode": "التحقق من الرمز",
  "auth.otp.invalidCode": "أدخل رمز التحقق المكوّن من ستة أرقام",
  "auth.otp.rejectedCode": "رمز التحقق غير صحيح أو انتهت صلاحيته",
  "auth.otp.resendCountdown": "إعادة إرسال الرمز خلال {time}",
  "auth.otp.resendAvailableIn": "ستتاح إعادة إرسال الرمز خلال {seconds} ثانية",
  "auth.otp.resendAvailable": "يمكنك إعادة إرسال الرمز الآن",
  "auth.otp.resend": "إعادة إرسال الرمز",

  "auth.accountType.title": "اختر نوع الحساب",
  "auth.accountType.individual": "فرد",
  "auth.accountType.company": "شركة",

  "auth.details.individualTitle": "بيانات الفرد",
  "auth.details.companyTitle": "بيانات الشركة",
  "auth.details.nationality": "الجنسية",
  "auth.details.saudi": "سعودي",
  "auth.details.nonSaudi": "غير سعودي",
  "auth.details.nationalId": "رقم الهوية الوطنية",
  "auth.details.birthDate": "تاريخ الميلاد ({calendar})",
  "auth.details.day": "اليوم",
  "auth.details.month": "الشهر",
  "auth.details.year": "السنة",
  "auth.details.invalidNationalId":
    "يجب أن يتكون رقم الهوية من {digits} أرقام وأن يبدأ بالرقم {first} أو {second}",
  "auth.details.invalidHijriDay": "أدخل يومًا هجريًا بين {minimum} و{maximum}",
  "auth.details.invalidHijriMonth":
    "أدخل شهرًا هجريًا بين {minimum} و{maximum}",
  "auth.details.invalidHijriYear": "أدخل سنة هجرية بين {minimum} و{maximum}",
  "auth.details.invalidGregorianDay": "أدخل تاريخًا ميلاديًا صحيحًا",
  "auth.details.invalidGregorianMonth":
    "أدخل شهرًا ميلاديًا بين {minimum} و{maximum}",
  "auth.details.invalidGregorianYear":
    "أدخل سنة ميلادية من {minimum} حتى السنة الحالية",
  "auth.details.futureDate": "لا يمكن أن يكون تاريخ الميلاد في المستقبل",
  "auth.details.submitFailed": "تعذر حفظ بياناتك",
  "auth.details.continue": "متابعة التحقق",

  "auth.company.name": "اسم الشركة",
  "auth.company.nameRequired": "أدخل اسم شركتك",
  "auth.company.submitFailed": "تعذر إرسال بيانات الشركة",
  "auth.company.underReview": "البيع غير متاح أثناء مراجعة شركتك",
  "auth.company.submit": "إرسال بيانات الشركة",

  "auth.verify.title": "موفر الهوية الوطنية التجريبي",
  "auth.verify.description": "اختر نتيجة تحقق تجريبية.",
  "auth.verify.approve": "موافقة",
  "auth.verify.decline": "رفض",
  "auth.verify.cancel": "إلغاء",

  "auth.identity.completing": "جارٍ إكمال التحقق من الهوية",
  "auth.identity.success": "تم التحقق من الهوية بنجاح",
  "auth.identity.failure": "فشل التحقق من الهوية",
  "auth.identity.abandoned": "تم إلغاء التحقق من الهوية",
  "auth.identity.completionError": "تعذر إكمال التحقق من الهوية",
  "auth.identity.retry": "إعادة محاولة التحقق",

  "auth.review.title": "مراجعة الشركة",
  "auth.review.loading": "جارٍ تحميل حالة مراجعة الشركة",
  "auth.review.empty": "لا تتوفر حالة مراجعة للشركة",
  "auth.review.error": "تعذر تحميل حالة مراجعة الشركة",
  "auth.review.retry": "حاول مرة أخرى",
  "auth.review.available": "البيع متاح",
  "auth.review.unavailable": "البيع غير متاح حتى تفعيل شركتك",
  "auth.review.step.submitted": "تم الإرسال",
  "auth.review.step.underReview": "قيد المراجعة",
  "auth.review.step.activated": "تم التفعيل",

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

  "auth.loginRequired.title": "سجّل الدخول للمتابعة",
  "auth.loginRequired.description": "سجّل الدخول لإكمال الإجراء الذي اخترته.",
  "auth.loginRequired.continue": "تسجيل الدخول",
  "auth.phone.title": "تسجيل الدخول",
  "auth.phone.description": "أكمل تسجيل الدخول للعودة إلى الإجراء الذي اخترته.",
  "auth.brand.tagline": "مزادات دولية للسيارات والعقار واللوحات",

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

  "auctionDetail.breadcrumb": "تفاصيل المزاد",
  "auctionDetail.gallery": "معرض الوسائط",
  "auctionDetail.previousMedia": "الوسائط السابقة",
  "auctionDetail.nextMedia": "الوسائط التالية",
  "auctionDetail.videoDescription": "وصف الفيديو: {0}",
  "auctionDetail.mediaInvalid":
    "تعذر عرض هذا المزاد لأن الوسائط المطلوبة غير مكتملة.",
  "auctionDetail.specifications": "المواصفات",
  "auctionDetail.features": "المزايا",
  "auctionDetail.inspection": "تقرير الفحص",
  "auctionDetail.seller": "البائع",
  "auctionDetail.previousAuctions": "المزادات السابقة",
  "auctionDetail.location": "الموقع",
  "auctionDetail.openMaps": "فتح الموقع في خرائط Google",
  "auctionDetail.notFound": "لم يتم العثور على المزاد",

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

  "marketplace.title": "المزادات",
  "marketplace.filters": "الفلاتر",
  "marketplace.openFilters": "فتح الفلاتر",
  "marketplace.applyFilters": "تطبيق الفلاتر",
  "marketplace.results.ariaLabel": "نتائج المزادات",
  "marketplace.empty.title": "لا توجد مزادات مطابقة",

  "banks.alrajhi": "مصرف الراجحي",
  "banks.snb": "البنك الأهلي السعودي",
  "banks.riyad": "بنك الرياض",
  "banks.alinma": "مصرف الإنماء",
  "banks.nbb": "بنك البحرين الوطني",
  "banks.bbk": "بنك البحرين والكويت",
  "banks.other": "أخرى (تحويل دولي)",

  "nav.home": "الرئيسية",
  "nav.auctions": "المزادات",
  "nav.myAuctions": "مزاداتي",
  "nav.wallet": "المحفظة",
  "nav.profile": "الحساب",
  "nav.notifications": "الإشعارات",
  "nav.language": "اللغة",
  "nav.languageToggle": "English",

  "onboarding.discover.title": "اكتشف المزادات",
  "onboarding.discover.description":
    "تصفح آلاف المزادات على السيارات والعقارات واللوحات المرورية واعثر على ما يناسبك",
  "onboarding.liveBidding.title": "مزايدة مباشرة",
  "onboarding.liveBidding.description":
    "شارك في المزادات الحية ومزدد في الوقت الفعلي بسهولة وأمان",
  "onboarding.winning.title": "اربح وتمسك",
  "onboarding.winning.description":
    "ازايد واربح المزاد وتمسك بسهولة مع نظام دفع وتسوية آمن",
  "onboarding.skip": "تخطي",
  "onboarding.next": "التالي",
  "onboarding.getStarted": "ابدأ",
  "onboarding.selectLanguage": "اللغة",
  "onboarding.progress": "تقدم الشرائح",
  "onboarding.slidePosition": "شريحة {0} من {1}",

  "home.banner.ariaLabel": "شريط البانر الترويجي",
  "home.banner.slidePosition": "شريحة {0} من {1}",
  "home.banner.nextSlide": "الشريحة التالية",
  "home.banner.previousSlide": "الشريحة السابقة",
  "home.category.chipsLabel": "تصفح حسب الفئة",
  "home.category.allLabel": "الكل",
  "home.listings.ariaLabel": "المزادات النشطة",
  "home.listings.title": "المزادات النشطة",
  "home.empty.title": "لا توجد مزادات حالياً",
  "home.empty.description": "تحقق لاحقاً من المزادات المتاحة",
  "home.banner.slideTitle.1": "اكتشف المزادات الرائجة",
  "home.banner.slideTitle.2": "مزادات حية بالوقت الحقيقي",
  "home.banner.slideTitle.3": "فرص حصرية لا تفوّتها",
  "home.banner.slideDescription.1":
    "تصفح آلاف المزادات على السيارات والعقارات واللوحات المرورية",
  "home.banner.slideDescription.2": "شارك في المزادات الحية ومزدد بسهولة وأمان",
  "home.banner.slideDescription.3": "ازايد واربح المزاد مع نظام دفع وتسوية آمن",

  "search.title": "بحث",
  "search.placeholder": "ابحث عن مزاد",
  "search.noResults.title": "لا توجد نتائج",
  "search.noResults.description": "جرب كلمات بحث مختلفة",
  "search.suggestions.ariaLabel": "اقتراحات البحث",
  "search.suggestions.count": "{0} اقتراحات متاحة",
  "search.results.ariaLabel": "نتائج البحث",
  "search.inferredCategory": "الفئة: {0}",
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
