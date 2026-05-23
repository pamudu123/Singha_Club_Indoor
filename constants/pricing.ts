export const initialDefaultSlotPrice = 1500;
export const initialDefaultCurrency = "LKR";
export const supportedCurrencies = ["LKR", "USD"] as const;

export type CurrencyCode = (typeof supportedCurrencies)[number];
