import mlLogo from '../images/ml-logo.avif';
import mcgg from '../images/mcgg.avif';
import supersus from '../images/supersus.webp'
import bloodStrike from "../images/blood-strike.webp"

const games = [
  {
    id: 1,
    name: "Mobile Legends",
    img: mlLogo,
    route: '/recharge/mlbb',
    filter: 'popular',
    order: 1,
    tag: 'mlbb',
    collectionName: 'mlbbproductlist'
  },

  {
    id: 2,
    name: "Magic Chess: GO GO",
    img: mcgg,
    route: '/recharge/mcgg',

    filter: 'popular',
    order:2,
    tag: 'mcgg',
    collectionName: "mcggproductlist"
  },
  {
    id: 3,
    name: "Super Sus",
    img: supersus,
    route: '/recharge/supersus',
    filter: 'others',
    order:3,
    tag: 'ss',
    collectionName: "ssproductlist"
  },
  {
    id: 4,
    name: "Blood Strike",
    img: bloodStrike,
    route: '/recharge/bloodstrike',
    filter: 'others',
    order:3,
    tag: 'bs',
    collectionName: "bsproductlist"
  }
];

export default games;
