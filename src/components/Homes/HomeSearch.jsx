import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { FaSearch } from "react-icons/fa";
import games from "../../assets/files/games";

const HomeSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const filteredGames = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return games.filter(
      (game) =>
        game.name.toLowerCase().includes(query) ||
        (game.tag && game.tag.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const handleGameClick = (route) => {
    setSearchQuery("");
    navigate(route);
  };

  return (
    <div className="relative mb-3 mt-2">
      <div className="relative">
        <FaSearch className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for games..."
          className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm ${isDark ? "border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-900" : "border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-purple-200"}`}
        />
      </div>

      {/* Search Results Dropdown */}
      {searchQuery.trim() && filteredGames.length > 0 && (
        <div className={`absolute z-50 w-full mt-2 rounded-xl shadow-xl border max-h-64 overflow-y-auto ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          {filteredGames.map((game) => (
            <button
              key={game.id}
              onClick={() => handleGameClick(game.route)}
              className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 border-b last:border-b-0 ${isDark ? "hover:bg-gray-700 border-gray-700" : "hover:bg-purple-50 border-gray-100"}`}
            >
              <img
                src={game.img}
                alt={game.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
              <span className={`font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}>{game.name}</span>
            </button>
          ))}
        </div>
      )}

      {searchQuery.trim() && filteredGames.length === 0 && (
        <div className={`absolute z-50 w-full mt-2 rounded-xl shadow-xl border p-4 text-center ${isDark ? "bg-gray-800 border-gray-700 text-gray-400" : "bg-white border-gray-200 text-gray-500"}`}>
          No games found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
};

export default HomeSearch;
