import React from 'react';
import { ReviewData, ReviewCategory, Sentiment } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { Star, StarHalf } from 'lucide-react';

interface ReviewCardProps {
  review: ReviewData;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex text-yellow-400">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={16}
          fill={i < rating ? "currentColor" : "none"}
          className={i < rating ? "text-yellow-400" : "text-gray-300"}
        />
      ))}
    </div>
  );
};

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
            {review.author.charAt(0)}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">{review.author}</h4>
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} />
              <span className="text-xs text-gray-500">{review.date}</span>
            </div>
          </div>
        </div>
        
        {/* AI Analysis Badge */}
        <div className={`px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1 ${
          review.sentiment === Sentiment.POSITIVE ? 'bg-green-50 text-green-700 border-green-200' :
          review.sentiment === Sentiment.NEGATIVE ? 'bg-red-50 text-red-700 border-red-200' :
          'bg-gray-50 text-gray-700 border-gray-200'
        }`}>
          AI: {review.sentiment}
        </div>
      </div>

      <p className="text-gray-700 text-sm leading-relaxed mb-4">
        {review.text}
      </p>

      {/* AI Tags Section */}
      <div className="flex flex-wrap gap-2 mt-auto">
        {review.tags.map((tag) => (
          <span
            key={tag}
            className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
              CATEGORY_COLORS[tag] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {tag}
          </span>
        ))}
      </div>
      
      {review.highlight && (
        <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500 italic flex items-center gap-2">
           <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Summary</span>
           "{review.highlight}"
        </div>
      )}
    </div>
  );
};
