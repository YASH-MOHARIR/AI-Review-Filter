import { ReviewData, ReviewCategory, Sentiment } from './types';

export const INITIAL_REVIEWS: ReviewData[] = [
  {
    id: '1',
    author: 'Sarah Jenkins',
    date: '2 days ago',
    rating: 5,
    text: 'The pizza was absolutely divine! The crust was perfect and the cheese pull was real. However, the delivery took a bit longer than expected.',
    tags: [ReviewCategory.FOOD, ReviewCategory.DELIVERY],
    sentiment: Sentiment.POSITIVE,
    highlight: 'Pizza was absolutely divine',
  },
  {
    id: '2',
    author: 'Mike Ross',
    date: '1 week ago',
    rating: 2,
    text: 'Delivery was a nightmare. The driver got lost and the food arrived cold. I called the restaurant and they were rude.',
    tags: [ReviewCategory.DELIVERY, ReviewCategory.SERVICE],
    sentiment: Sentiment.NEGATIVE,
    highlight: 'Delivery was a nightmare, food arrived cold',
  },
  {
    id: '3',
    author: 'Jessica Pearson',
    date: '3 weeks ago',
    rating: 4,
    text: 'Great vibes inside. The lighting is dim and romantic. Food is okay, a bit pricey for the portion size.',
    tags: [ReviewCategory.AMBIENCE, ReviewCategory.FOOD, ReviewCategory.PRICE],
    sentiment: Sentiment.NEUTRAL,
    highlight: 'Great vibes, dim and romantic lighting',
  },
  {
    id: '4',
    author: 'Harvey Specter',
    date: '1 month ago',
    rating: 5,
    text: 'Best burger in the city. No contest. Service was snappy too.',
    tags: [ReviewCategory.FOOD, ReviewCategory.SERVICE],
    sentiment: Sentiment.POSITIVE,
    highlight: 'Best burger in the city',
  },
  {
    id: '5',
    author: 'Louis Litt',
    date: '1 month ago',
    rating: 1,
    text: 'I found a hair in my soup! Absolutely unacceptable hygiene standards. Never coming back.',
    tags: [ReviewCategory.FOOD],
    sentiment: Sentiment.NEGATIVE,
    highlight: 'Hair in soup, unacceptable hygiene',
  }
];

export const CATEGORY_COLORS: Record<ReviewCategory, string> = {
  [ReviewCategory.FOOD]: 'bg-orange-100 text-orange-800 border-orange-200',
  [ReviewCategory.DELIVERY]: 'bg-blue-100 text-blue-800 border-blue-200',
  [ReviewCategory.AMBIENCE]: 'bg-purple-100 text-purple-800 border-purple-200',
  [ReviewCategory.SERVICE]: 'bg-green-100 text-green-800 border-green-200',
  [ReviewCategory.PRICE]: 'bg-gray-100 text-gray-800 border-gray-200',
};
