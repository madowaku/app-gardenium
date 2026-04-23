import { BaseEntity } from './appSproutTypes';

export type ProductType = 'ai_report' | 'ai_ticket';

export interface ProductDefinition {
  id: string;
  type: ProductType;
  name: string;
  description: string;
  price: number;
  priceLabel: string;
  deliveryTiming: string;
  refundPolicy: string;
  ticketAmount?: number;
}

export type PurchaseStatus = 'pending' | 'paid' | 'fulfilled' | 'failed';

export interface Purchase extends BaseEntity {
  userId: string;
  productId: string;
  productType: ProductType;
  targetPostId?: string; // For ai_report
  ticketAmount?: number; // For ai_ticket
  price: number;
  currency: string;
  status: PurchaseStatus;
}

export interface AiReport extends BaseEntity {
  postId: string;
  userId: string;
  summary: string;
  commonRequests: string[];
  concerns: string[];
  nextActions: string[];
}

export interface UserCommerceProfile {
  aiTicketBalance: number;
}
