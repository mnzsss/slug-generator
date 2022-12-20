import { Attribute } from "./Campaign";
import { ObjectOf } from "./ObjectOf";
import { XOR } from "./XOR";

type ProductType =
  | "SIMPLE"
  | "CONFIG"
  | "SP_GROUP"
  | "BUNDLE"
  | "PACKAGE"
  | "DIGITAL"
  | "DYNAMIC_BUNDLE";

export type PromotionFlag = {
  title: string;
  product_type: ProductType[];
};

export type CashbackOperation = {
  value: number;
  fromValueType: string;
  toValueType: string;
  walletType: string;
  walletTypeDescription: string;
  type?: string;
};

export type CashbackUsedValue = {
  type: string;
  value_available?: number;
  value_available_brl?: number;
  value: number;
  value_brl: number;
  value_type: string;
};

export type ProductCashback = {
  code: string;
  operations: [CashbackOperation];
  type?: string;
  value?: number;
  value_type?: string;
};

type Channel = {
  id: number;
  code: string;
  description: string;
};

export interface Product {
  id: number;
  sku: string;
  key?: string;
  type: ProductType;
  description: string;
  from_price?: number;
  tags?: string[];
  price: number;
  price_with_discount: number;
  unit_profit: number;
  bundle_profit: number;
  selected_structure?: {
    id: number;
    sku: string;
  }[];
  delivery?: string;
  structure: Product[];
  attributes: Attribute<any>;
  filters: ProductFilters;
  campaign_id: number;
  parent_id?: number;
  parent_sku?: string;
  parent?: {
    id?: number;
    sku?: string;
    structure?: Product[];
    type?: string;
  };
  config?: {
    sku?: string;
  };
  gift?: boolean;
  gift_type?: string;
  qty?: number | undefined;
  upsell_sku?: string;
  special_price: number;
  special_label?: string;
  best_seller: boolean;
  coming_soon: boolean;
  available: boolean;
  visible: boolean;
  external_code?: string;
  installments: number;
  installment_price: number;
  total_percent_discount: number;
  special_price_with_discount?: number;
  unit_price: number;
  total_products: number;
  stock_qty: number;
  categories: ProductCategory[];
  campaign?: {
    attributes: {
      [code: string]: any;
    };
    product_attributes: ObjectOf<any>;
  };
  cashback_generated: ProductCashback[];
  beyounger?: boolean;
  channels?: Channel[];
  slug?: string;
}

export interface ProductCategory {
  id: number;
  code: string;
  description: string;
  type: string;
}

export interface ProductInterface {
  sku: string;
  description: string;
}

export type ProductAttributeValue<T = any> = T;

export type ProductAttributes<T = any> = Attribute<T>;

export type ProductFilterField = {
  id: number;
  code: string;
  description: string;
  metadata: {
    type: "json" | "select" | "text";
    validations?: string[];
    multiple?: boolean;
    extendable?: boolean;
    [key: string]: any;
  };
  options: ProductFilterFieldOption[];
};

export type ProductFilterFieldOption = {
  id: number;
  description: string;
  type?: string;
  metadata?: ObjectOf<any>;
};

type ProductFilterOptionBase = {
  code: string;
  description: string;
  value: string;
};

type ProductFilterOptionWithSku = ProductFilterOptionBase & {
  sku: string;
};

type ProductFilterOptionWithOptions = ProductFilterOptionBase & {
  options: ProductFilterOption[];
};

export type ProductFilterOption = XOR<
  ProductFilterOptionWithSku,
  ProductFilterOptionWithOptions
>;

export type ProductFilters = {
  fields: ProductFilterField[];
  options: ProductFilterOption[];
};

export type PurchaseCta = {
  text: string;
  disabled?: boolean;
};
