/**
 * js/config.js - Constants & Configuration
 * protoPork - ABCstartups / KachiCodes
 */

const KEY = "protopork-v7";
const CUR = "K";
const BPS = 10000;
const TOL = 25;

const ST = {
  confirmed: "Awaiting Scale Weigh-in",
  packed: "Packed & Ready",
  dispatched: "Dispatched / On Route",
  delivered: "Fulfilled / Delivered"
};

const SVC = [
  { id: "deliver", name: "Delivery (+K20 fee)", fee: 2000, note: "Brought directly to your location" },
  { id: "collect", name: "Store Pickup (Free)", fee: 0, note: "Collect directly from butchery cold store" }
];

const PAY = [
  { id: "momo", name: "Mobile Money / Card", note: "Airtel, MTN, Zamtel or MasterCard push prompt" },
  { id: "cash", name: "Cash on Fulfillment", note: "Pay cash upon delivery or pickup" }
];

const NSPS = [
  { id: "mtn", name: "MTN MoMo" },
  { id: "airtel", name: "Airtel Money" },
  { id: "zamtel", name: "Zamtel Kwacha" },
  { id: "mastercard", name: "MasterCard" }
];