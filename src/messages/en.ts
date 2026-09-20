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

  "banks.alrajhi": "Al Rajhi Bank",
  "banks.snb": "Saudi National Bank",
  "banks.riyad": "Riyad Bank",
  "banks.alinma": "Alinma Bank",
  "banks.nbb": "National Bank of Bahrain",
  "banks.bbk": "Bank of Bahrain and Kuwait",
  "banks.other": "Other (international)",
};
