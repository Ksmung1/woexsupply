import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import games from "../../assets/files/games";

const HomeSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

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
        <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for games..."
          className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-white shadow-sm"
        />
      </div>

      {/* Search Results Dropdown */}
      {searchQuery.trim() && filteredGames.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-64 overflow-y-auto">
          {filteredGames.map((game) => (
            <button
              key={game.id}
              onClick={() => handleGameClick(game.route)}
              className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0"
            >
              <img
                src={game.img}
                alt={game.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
              <span className="font-medium text-gray-800">{game.name}</span>
            </button>
          ))}
        </div>
      )}

      {searchQuery.trim() && filteredGames.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 text-center text-gray-500">
          No games found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
};

export default HomeSearch;
