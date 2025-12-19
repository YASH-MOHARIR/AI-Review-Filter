import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CATEGORY_COLORS } from './constants';
import { ReviewData, ReviewCategory, Sentiment } from './types';
import { analyzeReviewWithGemini } from './services/geminiService';
import { Sparkles, Loader2, X, RotateCw } from 'lucide-react';

// --- GOOGLE MAPS SPECIFIC SELECTORS ---
// Note: Google changes these occasionally. 
// .jftiEf = The main review card container
// .wiI7pd = The review text
// .d4r55 = The author name
const SELECTORS = {
  REVIEW_CONTAINER: '.jftiEf', 
  TEXT: '.wiI7pd',
  AUTHOR: '.d4r55',
  DATE: '.rsqaWe'
};

// --- COMPONENTS ---

const ReviewBadges: React.FC<{ review: ReviewData }> = ({ review }) => {
  if (review.tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2 mb-2">
      {review.tags.map(tag => (
        <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${CATEGORY_COLORS[tag]}`}>
          {tag}
        </span>
      ))}
      {review.sentiment && (
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
          review.sentiment === Sentiment.POSITIVE ? 'bg-green-50 text-green-700 border-green-200' :
          review.sentiment === Sentiment.NEGATIVE ? 'bg-red-50 text-red-700 border-red-200' :
          'bg-gray-50 text-gray-600 border-gray-200'
        }`}>
          {review.sentiment}
        </span>
      )}
    </div>
  );
};

const ExtensionControlPanel: React.FC<{
  reviews: ReviewData[];
  selectedFilters: ReviewCategory[];
  toggleFilter: (c: ReviewCategory) => void;
  clearFilters: () => void;
  isProcessing: boolean;
  progress: number;
  onRescan: () => void;
}> = ({ reviews, selectedFilters, toggleFilter, clearFilters, isProcessing, progress, onRescan }) => {
  
  const getMatchCount = (category: ReviewCategory) => {
    const potentialFilters = selectedFilters.includes(category) 
        ? selectedFilters 
        : [...selectedFilters, category];
    
    return reviews.filter(r => 
        potentialFilters.every(f => r.tags.includes(f))
    ).length;
  };

  const visibleReviews = useMemo(() => {
     if (selectedFilters.length === 0) return reviews;
     return reviews.filter(review => 
       selectedFilters.every(filter => review.tags.includes(filter))
     );
  }, [reviews, selectedFilters]);

  return (
    <div className="fixed top-20 right-4 z-[2147483647] w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 font-sans text-gray-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-md">
               <Sparkles className="text-white w-4 h-4" />
            </div>
            <div>
                <h3 className="font-bold text-gray-900 text-sm">Smart Review AI</h3>
            </div>
        </div>
        <button 
            onClick={onRescan}
            disabled={isProcessing}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors" 
            title="Rescan for new reviews"
        >
            <RotateCw className={`w-4 h-4 text-gray-600 ${isProcessing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isProcessing && (
         <div className="mb-3">
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 text-center">Analyzing visible reviews... {progress}%</p>
         </div>
      )}

      {/* Stats */}
      <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-center">
             <div className="text-[10px] text-gray-500 uppercase">Visible</div>
             <div className="text-xl font-bold text-gray-900 leading-none mt-1">
                 {visibleReviews.length} <span className="text-gray-400 text-xs font-normal">/ {reviews.length}</span>
             </div>
         </div>
         <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-center">
             <div className="text-[10px] text-gray-500 uppercase">Avg Rating</div>
             <div className="text-xl font-bold text-gray-900 leading-none mt-1">
                 {visibleReviews.length > 0 
                    ? (visibleReviews.reduce((acc, r) => acc + r.rating, 0) / visibleReviews.length).toFixed(1) 
                    : '-'
                 } 
                 <span className="text-yellow-500 text-sm ml-0.5">★</span>
             </div>
         </div>
      </div>

      <div className="space-y-2">
         <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Topics</span>
            {selectedFilters.length > 0 && (
                <button onClick={clearFilters} className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium">
                    Clear <X size={10}/>
                </button>
            )}
         </div>
         <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto custom-scrollbar">
            {Object.values(ReviewCategory).map(cat => {
                const isActive = selectedFilters.includes(cat);
                const count = getMatchCount(cat);
                const disabled = count === 0 && !isActive;

                return (
                    <button
                        key={cat}
                        onClick={() => toggleFilter(cat)}
                        disabled={disabled}
                        className={`text-[10px] px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
                            isActive 
                            ? 'bg-gray-800 text-white border-gray-800'
                            : disabled
                                ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                    >
                        {cat}
                        <span className={`text-[9px] px-1 rounded ${isActive ? 'bg-white/20' : 'bg-gray-200 text-gray-600'}`}>
                            {count}
                        </span>
                    </button>
                )
            })}
         </div>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<ReviewCategory[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // We need to keep track of processed IDs to avoid re-analyzing duplicates
  const processedIdsRef = useRef<Set<string>>(new Set());

  const scanAndAnalyze = async () => {
    setIsProcessing(true);
    setProgress(0);

    // Get all review cards from Google Maps DOM
    const reviewElements = document.querySelectorAll(SELECTORS.REVIEW_CONTAINER);
    const newReviews: ReviewData[] = [];
    
    // Convert NodeList to Array and process
    const elementsArray = Array.from(reviewElements);
    let count = 0;

    // Limit batch size to avoid hitting API rate limits immediately in this demo
    // In production, implement a queue system
    const BATCH_LIMIT = 5; 
    let apiCalls = 0;

    for (const el of elementsArray) {
        const htmlEl = el as HTMLElement;
        
        // Google Maps doesn't give clean IDs, so we generate a simple hash based on text content
        // OR try to find a unique attribute. 
        const textEl = htmlEl.querySelector(SELECTORS.TEXT);
        if (!textEl || !textEl.textContent) continue;

        const text = textEl.textContent;
        // Simple hash for ID to prevent duplicate analysis
        const id = btoa(text.slice(0, 20) + text.length);

        if (processedIdsRef.current.has(id)) {
            // Already processed this one, skip analysis but ensure it's in our state list
            const existing = reviews.find(r => r.id === id);
            if (existing) newReviews.push(existing);
            continue;
        }

        if (apiCalls >= BATCH_LIMIT) {
             // Skip analysis for now to save quota/time, just show it
             // Real implementation would handle pagination
             continue; 
        }

        // FIND OR CREATE INJECTION POINT
        // We need to insert our badges right after the text or header
        let injectionPoint = htmlEl.querySelector('.smart-review-injection') as HTMLElement;
        if (!injectionPoint) {
            injectionPoint = document.createElement('div');
            injectionPoint.className = 'smart-review-injection';
            // Insert after text
            textEl.parentElement?.appendChild(injectionPoint);
        }

        // Analyze
        apiCalls++;
        let analysis;
        try {
            analysis = await analyzeReviewWithGemini(text);
        } catch (e) {
            console.error("Analysis failed", e);
            continue;
        }

        const tags: ReviewCategory[] = analysis.categories
            .map(c => {
                const norm = c.charAt(0).toUpperCase() + c.slice(1).toLowerCase();
                return Object.values(ReviewCategory).includes(norm as ReviewCategory) 
                    ? (norm as ReviewCategory) 
                    : null;
            })
            .filter((t): t is ReviewCategory => t !== null);
        
        let sentiment = Sentiment.NEUTRAL;
        if (analysis.sentiment.toLowerCase().includes('positive')) sentiment = Sentiment.POSITIVE;
        if (analysis.sentiment.toLowerCase().includes('negative')) sentiment = Sentiment.NEGATIVE;

        // Parse Rating (Google uses aria-label "4 stars")
        const ratingEl = htmlEl.querySelector('span[role="img"]');
        let rating = 0;
        if (ratingEl) {
             const label = ratingEl.getAttribute('aria-label') || '';
             rating = parseInt(label) || 0;
        }

        const reviewData: ReviewData = {
            id,
            author: htmlEl.querySelector(SELECTORS.AUTHOR)?.textContent || 'Unknown',
            date: htmlEl.querySelector(SELECTORS.DATE)?.textContent || '',
            rating, 
            text,
            tags,
            sentiment,
            highlight: analysis.shortSummary,
            domElement: htmlEl,
            injectionPoint
        };

        processedIdsRef.current.add(id);
        newReviews.push(reviewData);

        count++;
        setProgress(Math.round((count / BATCH_LIMIT) * 100));
    }

    setReviews(prev => [...prev, ...newReviews]);
    setIsProcessing(false);
  };

  // Initial Scan
  useEffect(() => {
    // Wait a moment for page to load
    const timer = setTimeout(() => {
        scanAndAnalyze();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Filter Effect: Manipulate the Real DOM
  useEffect(() => {
    // We iterate through our "Managed" reviews
    reviews.forEach(review => {
        const isMatch = selectedFilters.length === 0 || selectedFilters.every(f => review.tags.includes(f));
        
        // We find the closest parent "review container" (jftiEf) to hide/show
        // Note: Google Maps re-renders lists often, so we might lose reference. 
        // In a robust app, we re-query by ID.
        if (review.domElement) {
             if (isMatch) {
                review.domElement.style.display = ''; // Reset
                review.domElement.style.opacity = '1';
            } else {
                review.domElement.style.display = 'none';
            }
        }
    });
  }, [selectedFilters, reviews]);

  const toggleFilter = (cat: ReviewCategory) => {
    setSelectedFilters(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  return (
    <>
      <ExtensionControlPanel 
         reviews={reviews} 
         selectedFilters={selectedFilters}
         toggleFilter={toggleFilter}
         clearFilters={() => setSelectedFilters([])}
         isProcessing={isProcessing}
         progress={progress}
         onRescan={scanAndAnalyze}
      />

      {reviews.map(review => {
          if (!review.injectionPoint) return null;
          return createPortal(
              <ReviewBadges review={review} />,
              review.injectionPoint
          );
      })}
    </>
  );
};

export default App;