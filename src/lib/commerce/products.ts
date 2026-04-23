import { ProductDefinition } from '../../types/commerce';

export const PRODUCTS: Record<string, ProductDefinition> = {
  ai_report_basic: {
    id: 'ai_report_basic',
    type: 'ai_report',
    name: 'AI分析レポート',
    description: '投稿に寄せられた反応や意見をAIが整理。次にやるべきことやユーザーの関心事をまとめます。',
    price: 500,
    priceLabel: '500円（税込）',
    deliveryTiming: '決済完了後すぐ〜数分以内',
    refundPolicy: 'デジタル商品の性質上、購入後のキャンセル・返金はできません。',
  },
  ai_ticket_3: {
    id: 'ai_ticket_3',
    type: 'ai_ticket',
    name: 'AIチケット (3回分)',
    description: 'AIによる自動要約や改善点へのフィードバックなど、追加機能の実行に使えるお得なチケットです。',
    price: 200,
    priceLabel: '200円（税込）',
    deliveryTiming: '決済完了後すぐに付与',
    refundPolicy: 'デジタル商品の性質上、購入後のキャンセル・返金はできません。',
    ticketAmount: 3,
  },
  ai_ticket_10: {
    id: 'ai_ticket_10',
    type: 'ai_ticket',
    name: 'AIチケット (10回分)',
    description: '本格的なフィードバックを何度も繰り返したい方向け。AI機能をたっぷり10回実行できます。',
    price: 600,
    priceLabel: '600円（税込）',
    deliveryTiming: '決済完了後すぐに付与',
    refundPolicy: 'デジタル商品の性質上、購入後のキャンセル・返金はできません。',
    ticketAmount: 10,
  }
};
