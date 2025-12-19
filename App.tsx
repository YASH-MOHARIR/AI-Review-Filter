import React, { useState, useMemo } from 'react';
import { ReviewCard } from './components/ReviewCard';
import { StatsPanel } from './components/StatsPanel';
import { INITIAL_REVIEWS, CATEGORY_COLORS } from './constants';
import { ReviewData, ReviewCategory, Sentiment } from './types';
import { analyzeReviewWithGemini } from './services/geminiService';
import { Filter, Sparkles, Send, Loader2, MapPin, X } from 'lucide-react';

const App: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewData[]>(INITIAL_REVIEWS);
  const [selectedFilters, setSelectedFilters] = useState<ReviewCategory[]>([]);
  const [newReviewText, setNewReviewText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userRating, setUserRating] = useState(5);

  // Smart Multi-Filter Logic (AND Logic)
  // Only show reviews that match ALL selected categories
  const filteredReviews = useMemo(() => {
    if (selectedFilters.length === 0) return reviews;
    return reviews.filter(review => 
      selectedFilters.every(filter => review.tags.includes(filter))
    );
  }, [reviews, selectedFilters]);

  const toggleFilter = (category: ReviewCategory) => {
    setSelectedFilters(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const clearFilters = () => setSelectedFilters([]);

  const handleAnalyzeAndAdd = async () => {
    if (!newReviewText.trim()) return;

    setIsAnalyzing(true);
    try {
      // 1. Send text to Gemini
      const analysis = await analyzeReviewWithGemini(newReviewText);
      
      // 2. Map Gemini string response to our Enums
      const tags: ReviewCategory[] = analysis.categories
        .map(c => {
            // Simple normalization to match Enum values
            const norm = c.charAt(0).toUpperCase() + c.slice(1).toLowerCase();
            return Object.values(ReviewCategory).includes(norm as ReviewCategory) 
                ? (norm as ReviewCategory) 
                : null;
        })
        .filter((t): t is ReviewCategory => t !== null);
      
      // Fallback sentiment mapping
      let sentiment = Sentiment.NEUTRAL;
      if (analysis.sentiment.toLowerCase().includes('positive')) sentiment = Sentiment.POSITIVE;
      if (analysis.sentiment.toLowerCase().includes('negative')) sentiment = Sentiment.NEGATIVE;

      // 3. Construct the new Smart Review Object
      const newReview: ReviewData = {
        id: Date.now().toString(),
        author: 'You (Live Demo)',
        date: 'Just now',
        rating: userRating,
        text: newReviewText,
        tags: tags.length > 0 ? tags : [ReviewCategory.FOOD], // Default fallback
        sentiment: sentiment,
        highlight: analysis.shortSummary
      };

      setReviews([newReview, ...reviews]);
      setNewReviewText('');
    } catch (error) {
      alert('Failed to analyze review. Check console for details.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Smart Review<span className="text-indigo-600">AI</span></h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
             <div className="flex items-center gap-1">
                <MapPin size={16} />
                <span className="font-medium text-gray-700">Joe's Pizza & Burger</span>
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Stats & Smart Filters (Sticky) */}
          <div className="lg:col-span-4 space-y-6 h-fit lg:sticky lg:top-24">
            
            {/* Smart Filters */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Filter className="text-gray-400 w-4 h-4" />
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">AI Topic Filters</h3>
                </div>
                {selectedFilters.length > 0 && (
                    <button onClick={clearFilters} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                        Clear <X size={12}/>
                    </button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={clearFilters}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 w-full text-left ${
                    selectedFilters.length === 0
                      ? 'bg-gray-900 text-white shadow-md ring-2 ring-gray-900 ring-offset-2'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All Reviews
                </button>
                {Object.values(ReviewCategory).map((category) => {
                  const isSelected = selectedFilters.includes(category);
                  
                  // Count logic: How many visible reviews (currently filtered) ALSO include this category?
                  // If category is already selected, it matches all visible reviews (since it's a requisite).
                  // If category is NOT selected, it tells us how many of the CURRENT list would remain if we added this filter.
                  const matchCount = filteredReviews.filter(r => r.tags.includes(category)).length;
                  const isZeroMatches = matchCount === 0 && !isSelected;

                  return (
                    <button
                      key={category}
                      onClick={() => toggleFilter(category)}
                      disabled={isZeroMatches}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 grow text-left flex justify-between items-center ${
                        isSelected
                          ? `${CATEGORY_COLORS[category].split(' ')[0]} ${CATEGORY_COLORS[category].split(' ')[1]} shadow-sm ring-2 ring-indigo-500 ring-offset-2 border-transparent`
                          : isZeroMatches 
                            ? 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed'
                            : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {category}
                      <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                          isSelected ? 'bg-white/50' : isZeroMatches ? 'bg-gray-100 text-gray-300' : 'bg-gray-100 text-gray-500'
                      }`}>
                          {matchCount}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selectedFilters.length > 1 && (
                  <div className="mt-3 text-xs text-center text-gray-400">
                      Showing reviews matching <strong>all</strong> selected topics.
                  </div>
              )}
            </div>

            {/* Dynamic Stats Panel */}
            <StatsPanel reviews={filteredReviews} currentFilters={selectedFilters} />
          </div>

          {/* Right Column: Review Feed */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Add New Review Input */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Simulate New Customer Review</h3>
              <div className="space-y-4">
                <textarea
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  placeholder="Paste a review here (e.g., 'The delivery was slow but the pizza tasted amazing')..."
                  className="w-full p-4 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[100px] resize-none text-sm transition-colors"
                />
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Rating:</span>
                        <div className="flex gap-1">
                            {[1,2,3,4,5].map(star => (
                                <button 
                                    key={star} 
                                    onClick={() => setUserRating(star)}
                                    className={`text-lg transition-transform hover:scale-110 ${userRating >= star ? 'text-yellow-400' : 'text-gray-200'}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={handleAnalyzeAndAdd}
                        disabled={!newReviewText.trim() || isAnalyzing}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        {isAnalyzing ? (
                        <>
                            <Loader2 className="animate-spin w-4 h-4" />
                            Analyzing with Gemini...
                        </>
                        ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Post & Analyze
                        </>
                        )}
                    </button>
                </div>
              </div>
            </div>

            {/* Review List */}
            <div className="space-y-4">
               <div className="flex justify-between items-center pb-2">
                    <h2 className="text-lg font-bold text-gray-800">
                        {selectedFilters.length > 0 ? `Filtered Reviews` : 'All Recent Reviews'}
                    </h2>
                    <span className="text-sm text-gray-500">
                        Showing {filteredReviews.length} results
                    </span>
               </div>
              
              {filteredReviews.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                  <p className="text-gray-500 mb-2">No reviews match this specific combination.</p>
                  <button 
                    onClick={clearFilters}
                    className="text-indigo-600 font-medium hover:underline text-sm"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                filteredReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;