import HomeDisplay from "../components/Homes/HomeDisplay";
import HomeMenu from "../components/Homes/HomeMenu";
import Footer from "../components/Homes/Footer";
import HomeSearch from "../components/Homes/HomeSearch";
import BrowseSection from "../components/Homes/BrowseSection";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="overflow-visible">
          <HomeSearch />
          <HomeDisplay />
        </div>
        <BrowseSection />
        <HomeMenu />
        <HomeDisplay />
      </div>
      {/* <Footer/> */}
    </div>
  );
};

export default Home;
