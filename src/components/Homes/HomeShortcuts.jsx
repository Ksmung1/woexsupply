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
    <div className="flex max-w-sm md:max-w-xl mx-auto items-center gap-2 w-full my-2 px-1 justify-between">
      {images.map((img, i) => (
        <div
          key={i}
          onClick={() => handleClick(img)}
          className="flex flex-col items-center cursor-pointer"
        >
          <img src={img.src} alt={img.alt} className="w-10 h-10 object-contain" />
          <p className="text-[10px] mt-1 font-bold">{img.alt}</p>
        </div>
      ))}
    </div>
  );
};

export default HomeShortcuts;
