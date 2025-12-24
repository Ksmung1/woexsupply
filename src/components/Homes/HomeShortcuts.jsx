import React from "react";
import { useNavigate } from "react-router-dom";
import coin from "../../assets/images/topup.png";
import topup from "../../assets/images/game.png";
import sword from "../../assets/images/sword.png";
import giftcard from "../../assets/images/giftcard.png";
import subs from "../../assets/images/subscription.jpeg"

const HomeShortcuts = () => {
  const navigate = useNavigate();

  const images = [
    { src: coin, alt: "Topup", targetId: "coin" },           // route navigation
    { src: topup, alt: "Game Coins", link: "/wallet" },     // route navigation
    { src: sword, alt: "Game Items", link: "/browse" }, // scroll to section
    { src: giftcard, alt: "Gift Card", link: "/wallet" },  // route navigation
    { src: subs, alt: "Subscription", link: "/subscription" },  // route navigation
  ];

  const handleClick = (item) => {
    if (item.targetId) {
      const el = document.getElementById(item.targetId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <div className="py-6 md:py-8">
      <div className="flex max-w-sm md:max-w-xl mx-auto items-center gap-2 md:gap-10 w-full justify-between">
        {images.map((img, i) => (
          <div
            key={i}
            onClick={() => handleClick(img)}
            className="flex flex-col items-center cursor-pointer group hover:scale-105 transition-transform duration-200"
          >
            <div className=" rounded-xl bg-white shadow-md p-2 flex items-center justify-center group-hover:shadow-lg transition-shadow">
              <img src={img.src} alt={img.alt} className="w-full h-full object-contain" />
            </div>
            <p className="text-[10px] md:text-xs mt-2 font-semibold text-gray-700">{img.alt}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeShortcuts;
