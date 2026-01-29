import { useTheme } from "../context/ThemeContext";
import HomeDisplay from "../components/Homes/HomeDisplay";
import HomeMenu from "../components/Homes/HomeMenu";
import HomeSearch from "../components/Homes/HomeSearch";
import BrowseSection from "../components/Homes/BrowseSection";
import Footer from "../components/Global/Footer";

const Home = () => {
  const { isDark } = useTheme();
  
  return (
    <div className={`min-h-screen-dvh bg-gradient-to-br overflow-x-hidden transition-colors ${isDark ? "from-gray-900 via-gray-900 to-gray-800" : "from-gray-50 via-purple-50/30 to-indigo-50/30"}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="overflow-visible">
          <HomeSearch />
          <HomeDisplay />
        </div>
        <HomeMenu />
        <HomeDisplay />
      </div>
      {/* <Footer/> */}
    </div>
  );
};

export default Home;
