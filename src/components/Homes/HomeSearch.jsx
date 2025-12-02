// HomeSearch.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import games from "../../assets/files/games";
import { Search, X, Clock } from "lucide-react"; // Optional: lucide-react icons

const RECENT_SEARCHES_KEY = "recentGameSearches";

const HomeSearch = () => {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();
  const  isDarkMode  = false
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Load recent searches on mount
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 8)); // Limit to 8 recent
    }
  }, []);

  // Save to recent searches
  const addToRecent = (game) => {
    const updated = [game, ...recentSearches.filter((g) => g.id !== game.id)].slice(0, 8);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  // Filter games based on query
const filteredGames = games.filter((game) =>
  game.name.toLowerCase().includes(query.toLowerCase()) ||
  game.tag.toLowerCase().includes(query.toLowerCase())
);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGameClick = (game) => {
    addToRecent(game);
    navigate(game.route);
    setQuery("");
    setShowResults(false);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const displayItems = query.trim() ? filteredGames : recentSearches;

  return (
    <div className="relative max-w-md w-full py-1" ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder="Search games..."
          className={`w-full pl-12 pr-12 py-2 rounded-xl text-md font-medium outline-none transition-all
            ${isDarkMode 
              ? "bg-gray-900 text-white placeholder-gray-500 border border-gray-700 focus:border-blue-500" 
              : "bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-blue-500"
            } focus:ring-4 focus:ring-blue-500/20 `}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {showResults && displayItems.length > 0 && (
        <div
          className={`absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl overflow-hidden z-50 border
            ${isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
        >
          {/* Header */}
          {!query.trim() && recentSearches.length > 0 && (
            <div className="flex items-center justify-between p-2 border-b border-gray-700/50">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Recent searches</span>
              </div>
              <button
                onClick={clearRecent}
                className="text-[10px] text-blue-500 hover:text-blue-400"
              >
                Clear
              </button>
            </div>
          )}

          {/* Results List */}
          <ul className="max-h-96 overflow-y-auto">
            {displayItems.map((game) => (
              <li
                key={game.id}
                onClick={() => handleGameClick(game)}
                className={`flex items-center gap-2 p-2 cursor-pointer transition-colors
                  ${isDarkMode 
                    ? "hover:bg-gray-800" 
                    : "hover:bg-gray-100"
                  }`}
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-gray-600">
                  <img
                    src={game.img}
                    alt={game.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-">
                  <p className="text-xs text-base">{game.name}</p>
                  {query.trim() && (
                    <p className="text-[8px] text-gray-500">Click to open</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No Results */}
      {showResults && query.trim() && filteredGames.length === 0 && (
        <div
          className={`absolute top-full left-0 right-0 mt-2 p-4 py-8 text-center rounded-xl shadow-2xl
            ${isDarkMode ? "bg-gray-900 text-gray-400" : "bg-white text-gray-500"} border
            ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}
        >
          <p className="text-xs">No games found for "<strong>{query}</strong>"</p>
        </div>
      )}
    </div>
  );
};

export default HomeSearch;