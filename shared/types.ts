export type Network = "base" | "solana";

export type Buyer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
};

export type PaymentRequired = {
  recipient: string;
  maxAmountRequired: string;
};
