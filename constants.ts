import { ReviewCategory } from './types';

export const CATEGORY_COLORS: Record<ReviewCategory, string> = {
  [ReviewCategory.FOOD]: 'bg-orange-100 text-orange-800 border-orange-200',
  [ReviewCategory.DELIVERY]: 'bg-blue-100 text-blue-800 border-blue-200',
  [ReviewCategory.AMBIENCE]: 'bg-purple-100 text-purple-800 border-purple-200',
  [ReviewCategory.SERVICE]: 'bg-green-100 text-green-800 border-green-200',
  [ReviewCategory.PRICE]: 'bg-gray-100 text-gray-800 border-gray-200',
};
