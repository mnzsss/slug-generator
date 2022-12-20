import { ObjectOf } from './ObjectOf';

export interface Campaign {
  id: number;
  code: string;
  description: string;
  store_code: string;
  active: boolean;
  start_at: string;
  end_at: string;
  sequence: number;
  default_campaign: boolean;
  created_at: string;
  updated_at: string;
  expiration_actions: string[];
  prices_visualization?: string;
  sell_without_stock: boolean;
  disable_coupon: boolean;
  disable_coupon_with_promotion: boolean;
  disable_bankslip: boolean;
  mono_item: boolean;
  parent_id?: number;
  inherit_products: boolean;
  inherit_promotions: boolean;
  inherit_coupons: boolean;
  free_shipping: boolean;
  metadata: ObjectOf<any>;
  attributes: ObjectOf<any>;
  product_attributes: ObjectOf<any>;
  has_parent: boolean;
}

export interface Coupon {
  code: string;
  disallow_bank_slip: boolean;
  discount: number;
  discount_type: 'PERCENT' | 'ABSOLUTE';
  freight_discount: number;
  id: number;
}

export type Attribute<V> = ObjectOf<{
  description: string;
  value: V;
}>;

export interface Category {
  id: number;
  code: 'SKIN_COLLECTION' | 'COLOR_COLLECTION' | 'BOOSTERGEN';
  description: string;
  type: string;
  parent_id?: number;
  products: string[];
  attributes: Attribute<any>;
}

export interface PromotionRule {
  rule: string;
  type: 'ABSOLUTE' | 'PERCENT' | 'MIN_ORDER_VALUE';
  value: string;
  key?: string;
  config?: {
    [key: string]: any;
    items?: number;
    operator?: string;
  };
}

type PromotionRuleContent = {
  ruleKey: string;
  title: string;
  description: string;
};

export interface Promotion {
  id: number;
  code: string;
  description: string;
  type: string;
  store_code: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  rules: PromotionRule[];
  groups: unknown[];
  metadata: {
    [key: string]: any;
    CONTENT?: {
      [key: string]: any;
      rules?: PromotionRuleContent[];
    };
  };
}
