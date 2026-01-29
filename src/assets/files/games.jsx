import mlLogo from "../images/ml-logo.avif";
import mcgg from "../images/mcgg.jpeg";
import supersus from "../images/supersus.webp";
import bloodStrike from "../images/blood-strike.webp";
import honkai from "../images/honkai.avif";
import genshin from "../images/genshin.jpg";
import gameImg from "../images/game.png";
const charismaImg = "https://gamebar.in/assets/charisma-DI3Blcwm.avif";
const skinImg = "https://gamebar.in/assets/skinGifting-B1Kddf_C.jpg";
const games = [
  {
    id: 1,
    name: "Mobile Legends",
    img: mlLogo,
    route: "/recharge/mlbb",
    filter: "popular",
    order: 1,
    tag: "mlbb",
    collectionName: "mlbbproductlist",
  },

  {
    id: 2,
    name: "Magic Chess: GO GO",
    img: mcgg,
    route: "/recharge/mcgg",

    filter: "popular",
    order: 2,
    tag: "mcgg",
    collectionName: "mcggproductlist",
  },
  {
    id: 3,
    name: "Super Sus",
    img: supersus,
    route: "/recharge/supersus",
    filter: "others",
    order: 3,
    tag: "ss",
    collectionName: "ssproductlist",
  },
  {
    id: 4,
    name: "Blood Strike",
    img: bloodStrike,
    route: "/recharge/bloodstrike",
    filter: "others",
    order: 4,
    tag: "bs",
    collectionName: "bsproductlist",
  },
  {
    id: 5,
    name: "Honkai Star Rail",
    img: honkai,
    route: "/recharge/hsr",
    filter: "others",
    order: 5,
    tag: "hsr",
    collectionName: "hsrproductlist",
  },
  {
    id: 6,
    name: "Genshin Impact",
    img: genshin,
    route: "/recharge/gi",
    filter: "others",
    order: 6,
    tag: "gi",
    collectionName: "giproductlist",
  },
  {
    id: 7,
    name: "Charisma",
    img: charismaImg,
    route: "/charisma",
    filter: "others",
    order: 7,
    tag: "charisma",
    collectionName: "charismaproductlist",
  },
  {
    id: 8,
    name: "Skin",
    img: skinImg,
    route: "/skin",
    filter: "others",
    order: 8,
    tag: "skin",
    collectionName: "skinproductlist",
  },
  {
    id: 9,
    name: "Event Packs",
    img: mlLogo,
    route: "/recharge/custom",
    filter: "others",
    order: 9,
    tag: "custom",
    collectionName: "customproductlist",
  },
];

export default games;
