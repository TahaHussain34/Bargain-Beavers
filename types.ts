export enum DealRating {
  Green = 'Green',
  Yellow = 'Yellow',
  Red = 'Red'
}

export interface NegotiationScripts {
  the_icebreaker: string;
  the_data_play: string;
  the_closer: string;
}

export interface ItemAnalysis {
  item_name: string;
  estimated_condition: string;
  retail_price_new: string;
  flea_market_fair_price: string;
  price_range: string;
  suggested_offer_price: string;
  walk_away_price: string;
  negotiation_arguments: string[];
  negotiation_scripts: NegotiationScripts;
  deal_rating: DealRating;
}

export interface NegotiationAdvice {
  seller_sentiment: string;
  seller_point: string;
  suggested_counter: string;
  detected_price?: string;
  verdict: 'Buy Now' | 'Negotiate' | 'Walk Away';
}

export interface AnalysisState {
  status: 'idle' | 'analyzing' | 'success' | 'error';
  data: ItemAnalysis | null;
  error?: string;
  imagePreview?: string;
}