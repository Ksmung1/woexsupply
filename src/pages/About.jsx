import React from "react";
import { useTheme } from "../context/ThemeContext";
import { FaGamepad, FaCoins, FaShieldAlt, FaHeadset, FaRocket, FaUsers, FaAward, FaGlobe } from "react-icons/fa";

const About = () => {
  const { isDark } = useTheme();
  const features = [
    {
      icon: FaGamepad,
      title: "Wide Game Selection",
      description: "Access top mobile games including Mobile Legends, Genshin Impact, and more with instant recharges.",
    },
    {
      icon: FaCoins,
      title: "Secure Payments",
      description: "Multiple payment options with secure transactions and instant wallet top-ups.",
    },
    {
      icon: FaShieldAlt,
      title: "Safe & Reliable",
      description: "Your data and transactions are protected with industry-standard security measures.",
    },
    {
      icon: FaHeadset,
      title: "24/7 Support",
      description: "Our dedicated support team is always ready to help you with any questions or issues.",
    },
    {
      icon: FaRocket,
      title: "Instant Delivery",
      description: "Get your game credits and items delivered instantly after successful payment.",
    },
    {
      icon: FaAward,
      title: "Best Prices",
      description: "Competitive pricing with special offers and discounts for our valued customers.",
    },
  ];

  const stats = [
    { number: "100K+", label: "Happy Customers" },
    { number: "50+", label: "Games Supported" },
    { number: "1M+", label: "Transactions" },
    { number: "99.9%", label: "Uptime" },
  ];

  return (
    <div className={`min-h-screen-dvh bg-gradient-to-br py-8 ${isDark ? "from-gray-900 via-gray-900 to-gray-800" : "from-gray-50 via-purple-50/30 to-indigo-50/30"}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-800"}`}>
            About Us
          </h1>
          <p className={`text-lg md:text-xl mx-auto ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Your trusted partner for game credits, recharges, and digital gaming solutions.
            We're committed to providing the best gaming experience for players worldwide.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16 md:mb-20">
          <div className={`rounded-2xl shadow-xl p-8 md:p-12 ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center gap-3 mb-6">
              <FaRocket className="text-3xl text-purple-600" />
              <h2 className={`text-3xl md:text-4xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}>Our Mission</h2>
            </div>
            <p className={`text-lg leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Our mission is to make gaming more accessible and enjoyable for everyone. We provide
              a seamless platform where gamers can easily purchase game credits, recharge their
              favorite games, and enhance their gaming experience. With a focus on security, speed,
              and customer satisfaction, we strive to be the leading destination for all your gaming needs.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16 md:mb-20">
          <h2 className={`text-3xl md:text-4xl font-bold text-center mb-10 ${isDark ? "text-white" : "text-gray-800"}`}>
            Why Choose Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className={`rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 ${isDark ? "bg-gray-800" : "bg-white"}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-3 rounded-lg">
                      <IconComponent className="text-white text-2xl" />
                    </div>
                    <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}>{feature.title}</h3>
                  </div>
                  <p className={`leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-16 md:mb-20">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-2xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-10">
              Our Impact
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                    {stat.number}
                  </div>
                  <div className="text-purple-100 text-sm md:text-base font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16 md:mb-20">
          <h2 className={`text-3xl md:text-4xl font-bold text-center mb-10 ${isDark ? "text-white" : "text-gray-800"}`}>
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`rounded-xl shadow-lg p-6 border-l-4 border-purple-600 ${isDark ? "bg-gray-800" : "bg-white"}`}>
              <h3 className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-800"}`}>Customer First</h3>
              <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                Your satisfaction is our top priority. We listen to your feedback and continuously
                improve our services to meet your needs.
              </p>
            </div>
            <div className={`rounded-xl shadow-lg p-6 border-l-4 border-indigo-600 ${isDark ? "bg-gray-800" : "bg-white"}`}>
              <h3 className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-800"}`}>Transparency</h3>
              <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                We believe in honest communication and clear pricing. No hidden fees, no surprises—
                just straightforward service.
              </p>
            </div>
            <div className={`rounded-xl shadow-lg p-6 border-l-4 border-purple-600 ${isDark ? "bg-gray-800" : "bg-white"}`}>
              <h3 className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-800"}`}>Innovation</h3>
              <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                We stay ahead of the curve by adopting the latest technologies and features to
                enhance your gaming experience.
              </p>
            </div>
            <div className={`rounded-xl shadow-lg p-6 border-l-4 border-indigo-600 ${isDark ? "bg-gray-800" : "bg-white"}`}>
              <h3 className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-800"}`}>Reliability</h3>
              <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                Count on us for consistent, dependable service. We maintain high uptime and ensure
                your transactions are processed quickly and securely.
              </p>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className={`rounded-2xl shadow-xl p-8 md:p-12 text-center ${isDark ? "bg-gray-800" : "bg-white"}`}>
          <FaGlobe className="text-5xl text-purple-600 mx-auto mb-6" />
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-800"}`}>
            Have Questions?
          </h2>
          <p className={`text-lg mb-6 mx-auto ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            We're here to help! Reach out to our support team anytime, and we'll be happy to assist you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/profile"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Contact Support
            </a>
            <a
              href="/wallet"
              className={`border-2 border-purple-600 text-purple-600 px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${isDark ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-purple-50"}`}
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
