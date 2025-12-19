export enum ReviewCategory {
  FOOD = 'Food',
  DELIVERY = 'Delivery',
  AMBIENCE = 'Ambience',
  SERVICE = 'Service',
  PRICE = 'Price'
}

export enum Sentiment {
  POSITIVE = 'Positive',
  NEGATIVE = 'Negative',
  NEUTRAL = 'Neutral'
}

export interface ReviewData {
  id: string;
  author: string;
  date: string;
  rating: number; // 1-5 stars
  text: string;
  // Fields populated by AI
  tags: ReviewCategory[];
  sentiment: Sentiment;
  highlight: string; 
  // Reference to the actual DOM node (Simulating Chrome Extension access)
  domElement: HTMLElement;
  injectionPoint: HTMLElement;
}

export interface ReviewAnalysisResponse {
  categories: string[];
  sentiment: string;
  shortSummary: string;
}