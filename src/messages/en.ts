/**
 * English message catalogue for the international auction marketplace (T015).
 *
 * English is the secondary locale. `Messages` is the exact shape of
 * `src/messages/ar.ts`: assigning to it enforces an identical key set, so a
 * missing or extra English key fails typechecking. Arabic is the primary
 * locale; all UI and configuration resolve keys through `MessageKey`, which is
 * the union of the Arabic catalogue's literal keys.
 */

import type { Messages } from "./ar";

export const messagesEn: Messages = {
  "app.name": "International Auction",

  "common.loading": "Loading",
  "common.error": "Something went wrong",
  "common.retry": "Retry",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.close": "Close",
  "common.back": "Back",
  "common.search": "Search",
  "common.clearAll": "Clear all",
  "common.confirm": "Confirm",
  "common.empty": "No results",
  "common.favorite": "Favorite",
  "common.removeFavorite": "Remove from favorites",

  "auth.loginRequired.title": "Sign in to continue",
  "auth.loginRequired.description": "Sign in to complete the action you chose.",
  "auth.loginRequired.continue": "Sign in",
  "auth.phone.title": "Sign in",
  "auth.phone.description":
    "Complete sign-in to return to the action you chose.",
  "auth.brand.tagline":
    "International auctions for vehicles, real estate, and license plates",

  "auth.phoneForm.country": "Country",
  "auth.phoneForm.country.saudi": "Saudi Arabia (+966)",
  "auth.phoneForm.country.bahrain": "Bahrain (+973)",
  "auth.phoneForm.phoneNumber": "Phone number",
  "auth.phoneForm.sendCode": "Send code",
  "auth.phoneForm.invalidCountry": "Select a valid country",
  "auth.phoneForm.invalidSaudi":
    "Enter a {digits}-digit Saudi mobile number starting with {prefix}",
  "auth.phoneForm.invalidBahrain":
    "Enter an {digits}-digit Bahrain phone number",
  "auth.phoneForm.sendFailed": "Unable to send a code. Try again.",

  "auth.otp.title": "Verify your phone",
  "auth.otp.verificationCode": "Verification code",
  "auth.otp.digit": "Verification digit {number}",
  "auth.otp.verifyCode": "Verify code",
  "auth.otp.invalidCode": "Enter the six-digit code",
  "auth.otp.rejectedCode": "The verification code is invalid or expired",
  "auth.otp.resendCountdown": "Resend code in {time}",
  "auth.otp.resendAvailableIn": "Resend available in {seconds} seconds",
  "auth.otp.resendAvailable": "Resend code is available",
  "auth.otp.resend": "Resend code",

  "auth.accountType.title": "Choose account type",
  "auth.accountType.individual": "Individual",
  "auth.accountType.company": "Company",

  "auth.details.individualTitle": "Individual details",
  "auth.details.companyTitle": "Company details",
  "auth.details.nationality": "Nationality",
  "auth.details.saudi": "Saudi",
  "auth.details.nonSaudi": "Non-Saudi",
  "auth.details.nationalId": "National ID",
  "auth.details.birthDate": "Date of birth ({calendar})",
  "auth.details.day": "Day",
  "auth.details.month": "Month",
  "auth.details.year": "Year",
  "auth.details.invalidNationalId":
    "National ID must be {digits} digits starting with {first} or {second}",
  "auth.details.invalidHijriDay":
    "Enter a Hijri day between {minimum} and {maximum}",
  "auth.details.invalidHijriMonth":
    "Enter a Hijri month between {minimum} and {maximum}",
  "auth.details.invalidHijriYear":
    "Enter a Hijri year between {minimum} and {maximum}",
  "auth.details.invalidGregorianDay": "Enter a real Gregorian date",
  "auth.details.invalidGregorianMonth":
    "Enter a Gregorian month between {minimum} and {maximum}",
  "auth.details.invalidGregorianYear":
    "Enter a Gregorian year from {minimum} through the current year",
  "auth.details.futureDate": "Date of birth cannot be in the future",
  "auth.details.submitFailed": "Unable to save your details",
  "auth.details.continue": "Continue verification",

  "auth.company.name": "Company name",
  "auth.company.nameRequired": "Enter your company name",
  "auth.company.submitFailed": "Unable to submit company details",
  "auth.company.underReview":
    "Selling is unavailable while your company is under review",
  "auth.company.submit": "Submit company",

  "auth.verify.title": "Mock national identity provider",
  "auth.verify.description": "Choose a mock verification outcome.",
  "auth.verify.approve": "Approve",
  "auth.verify.decline": "Decline",
  "auth.verify.cancel": "Cancel",

  "auth.identity.completing": "Completing identity verification",
  "auth.identity.success": "Identity verification succeeded",
  "auth.identity.failure": "Identity verification failed",
  "auth.identity.abandoned": "Identity verification was abandoned",
  "auth.identity.completionError": "Unable to finish identity verification",
  "auth.identity.retry": "Try verification again",

  "auth.review.title": "Company review",
  "auth.review.loading": "Loading company review",
  "auth.review.empty": "No company review available",
  "auth.review.error": "Unable to load company review",
  "auth.review.retry": "Try again",
  "auth.review.available": "Selling is available",
  "auth.review.unavailable":
    "Selling is unavailable until your company is activated",
  "auth.review.step.submitted": "Submitted",
  "auth.review.step.underReview": "Under review",
  "auth.review.step.activated": "Activated",

  "status.upcoming": "Upcoming",
  "status.live": "Live",
  "status.ended": "Ended",
  "status.directSale": "Direct sale",

  "saleType.bySale": "By sale",
  "saleType.sellerOption": "Seller's choice",

  "category.vehicle": "Vehicles",
  "category.realEstate": "Real estate",
  "category.licensePlate": "License plates",

  "seller.privateOwner": "Private owner",

  "auctionDetail.breadcrumb": "Auction details",
  "auctionDetail.gallery": "Media gallery",
  "auctionDetail.previousMedia": "Previous media",
  "auctionDetail.nextMedia": "Next media",
  "auctionDetail.videoDescription": "Video description: {0}",
  "auctionDetail.mediaInvalid":
    "This auction cannot be shown because its required media is incomplete.",
  "auctionDetail.specifications": "Specifications",
  "auctionDetail.features": "Features",
  "auctionDetail.inspection": "Inspection report",
  "auctionDetail.seller": "Seller",
  "auctionDetail.previousAuctions": "Previous auctions",
  "auctionDetail.location": "Location",
  "auctionDetail.openMaps": "Open location in Google Maps",
  "auctionDetail.notFound": "Auction not found",

  "currency.sar": "Saudi Riyal",
  "currency.bhd": "Bahraini Dinar",

  "calendar.gregorian": "Gregorian",
  "calendar.hijri": "Hijri",

  "filters.category": "Category",
  "filters.option.category.vehicle": "Vehicles",
  "filters.option.category.realEstate": "Real estate",
  "filters.option.category.licensePlate": "License plates",

  "filters.sellerType": "Seller type",
  "filters.option.sellerType.individual": "Individual",
  "filters.option.sellerType.company": "Company",

  "filters.auctionStatus": "Auction status",
  "filters.option.auctionStatus.upcoming": "Upcoming",
  "filters.option.auctionStatus.live": "Live",
  "filters.option.auctionStatus.ended": "Ended",

  "filters.companyName": "Company name",
  "filters.companyName.placeholder": "Search by company name",

  "filters.group.category": "Category",
  "filters.group.sellerType": "Seller type",
  "filters.group.auctionStatus": "Auction status",

  "filters.vehicle.brand": "Brand",
  "filters.option.brand.volkswagen": "Volkswagen",
  "filters.option.brand.bmw": "BMW",
  "filters.option.brand.audi": "Audi",
  "filters.option.brand.mercedes-benz": "Mercedes-Benz",
  "filters.option.brand.toyota": "Toyota",
  "filters.option.brand.ford": "Ford",
  "filters.option.brand.tesla": "Tesla",
  "filters.option.brand.other": "Other",

  "filters.vehicle.fuelType": "Fuel type",
  "filters.option.fuelType.petrol": "Petrol",
  "filters.option.fuelType.diesel": "Diesel",
  "filters.option.fuelType.electric": "Electric",
  "filters.option.fuelType.hybrid": "Hybrid",
  "filters.option.fuelType.other": "Other",

  "filters.vehicle.transmission": "Transmission",
  "filters.option.transmission.manual": "Manual",
  "filters.option.transmission.automatic": "Automatic",

  "filters.vehicle.year": "Year",
  "filters.vehicle.mileage": "Mileage (km)",

  "filters.realEstate.propertyType": "Property type",
  "filters.option.propertyType.house": "House",
  "filters.option.propertyType.apartment": "Apartment",
  "filters.option.propertyType.commercial": "Commercial",
  "filters.option.propertyType.land": "Land",
  "filters.option.propertyType.other": "Other",

  "filters.realEstate.location": "Location",
  "filters.realEstate.location.placeholder": "City or district",

  "filters.realEstate.price": "Price",
  "filters.realEstate.livingArea": "Living area (m²)",

  "filters.licensePlate.plateType": "Plate type",
  "filters.option.plateType.standard": "Standard",
  "filters.option.plateType.personalized": "Personalized",
  "filters.option.plateType.vanity": "Vanity",
  "filters.option.plateType.special": "Special",

  "filters.licensePlate.pattern": "Plate pattern",
  "filters.licensePlate.pattern.placeholder": "e.g. 123 ABC",

  "filters.licensePlate.priceLimit": "Price limit",

  "marketplace.title": "Auctions",
  "marketplace.filters": "Filters",
  "marketplace.openFilters": "Open filters",
  "marketplace.applyFilters": "Apply filters",
  "marketplace.results.ariaLabel": "Auction results",
  "marketplace.empty.title": "No matching auctions",

  "banks.alrajhi": "Al Rajhi Bank",
  "banks.snb": "Saudi National Bank",
  "banks.riyad": "Riyad Bank",
  "banks.alinma": "Alinma Bank",
  "banks.nbb": "National Bank of Bahrain",
  "banks.bbk": "Bank of Bahrain and Kuwait",
  "banks.other": "Other (international)",

  "nav.home": "Home",
  "nav.auctions": "Auctions",
  "nav.myAuctions": "My auctions",
  "nav.wallet": "Wallet",
  "nav.profile": "Profile",
  "nav.notifications": "Notifications",
  "nav.language": "Language",
  "nav.languageToggle": "عربي",

  "onboarding.discover.title": "Discover Auctions",
  "onboarding.discover.description":
    "Browse thousands of auctions for vehicles, real estate, and license plates and find what suits you",
  "onboarding.liveBidding.title": "Live Bidding",
  "onboarding.liveBidding.description":
    "Join live auctions and bid in real time, easily and securely",
  "onboarding.winning.title": "Win & Settle",
  "onboarding.winning.description":
    "Bid, win auctions, and settle with ease through a secure payment and settlement system",
  "onboarding.skip": "Skip",
  "onboarding.next": "Next",
  "onboarding.getStarted": "Get Started",
  "onboarding.selectLanguage": "Language",
  "onboarding.progress": "Onboarding progress",
  "onboarding.slidePosition": "Slide {0} of {1}",

  "home.banner.ariaLabel": "Promotional banner carousel",
  "home.banner.slidePosition": "Slide {0} of {1}",
  "home.banner.nextSlide": "Next slide",
  "home.banner.previousSlide": "Previous slide",
  "home.category.chipsLabel": "Browse by category",
  "home.category.allLabel": "All",
  "home.listings.ariaLabel": "Active auctions",
  "home.listings.title": "Active auctions",
  "home.empty.title": "No auctions available",
  "home.empty.description": "Check back later for available auctions",
  "home.banner.slideTitle.1": "Discover trending auctions",
  "home.banner.slideTitle.2": "Live auctions in real time",
  "home.banner.slideTitle.3": "Exclusive opportunities",
  "home.banner.slideDescription.1":
    "Browse thousands of auctions for vehicles, real estate, and license plates",
  "home.banner.slideDescription.2":
    "Join live auctions and bid easily and securely",
  "home.banner.slideDescription.3":
    "Bid, win auctions, and settle through a secure payment system",

  "search.title": "Search",
  "search.placeholder": "Search for an auction",
  "search.noResults.title": "No results found",
  "search.noResults.description": "Try different search terms",
  "search.suggestions.ariaLabel": "Search suggestions",
  "search.suggestions.count": "{0} suggestions available",
  "search.results.ariaLabel": "Search results",
  "search.inferredCategory": "Category: {0}",
};
