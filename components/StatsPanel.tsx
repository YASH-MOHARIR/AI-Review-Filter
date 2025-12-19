import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { ReviewData, Sentiment, ReviewCategory } from '../types';

interface StatsPanelProps {
  reviews: ReviewData[];
  currentFilters: ReviewCategory[];
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ reviews, currentFilters }) => {
  const averageRating = reviews.length 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : '0.0';

  // Calculate sentiment distribution for Pie Chart
  const sentimentData = [
    { name: Sentiment.POSITIVE, value: reviews.filter(r => r.sentiment === Sentiment.POSITIVE).length, color: '#4ade80' },
    { name: Sentiment.NEUTRAL, value: reviews.filter(r => r.sentiment === Sentiment.NEUTRAL).length, color: '#94a3b8' },
    { name: Sentiment.NEGATIVE, value: reviews.filter(r => r.sentiment === Sentiment.NEGATIVE).length, color: '#f87171' },
  ].filter(d => d.value > 0);

  // Calculate Rating Distribution for Bar Chart
  const ratingCounts = [0, 0, 0, 0, 0];
  reviews.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingCounts[r.rating - 1]++;
    }
  });
  
  const barData = ratingCounts.map((count, index) => ({
    stars: `${index + 1} ★`,
    count: count
  }));

  const getTitle = () => {
    if (currentFilters.length === 0) return 'Overall Analysis';
    if (currentFilters.length <= 2) return `${currentFilters.join(' + ')} Analysis`;
    return `${currentFilters.length} Topics Analysis`;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
      <h2 className="text-lg font-bold text-gray-900 mb-1 truncate" title={getTitle()}>
        {getTitle()}
      </h2>
      <p className="text-xs text-gray-500 mb-6">
        {reviews.length} reviews matched this filter
      </p>

      <div className="flex items-end gap-2 mb-8">
        <span className="text-5xl font-extrabold text-gray-900">{averageRating}</span>
        <div className="flex flex-col mb-1.5">
            <span className="text-yellow-400 text-xl">★★★★★</span>
            <span className="text-xs text-gray-400 font-medium">Average Rating</span>
        </div>
      </div>

      <div className="h-48 w-full mb-6">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Rating Spread</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} layout="vertical" margin={{ left: -20 }}>
             <XAxis type="number" hide />
             <YAxis dataKey="stars" type="category" width={40} tick={{fontSize: 12}} />
             <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
             <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="h-48 w-full">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">AI Sentiment Split</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sentimentData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={5}
              dataKey="value"
            >
              {sentimentData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};