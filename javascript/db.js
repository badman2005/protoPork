/**
 * js/db.js - Local Data Persistence & Seed Engine
 * protoPork - ABCstartups / KachiCodes
 */

function seed() {
  return {
    seq: 100,
    clients: [
      { id: 1, name: "Lusaka Butcheries Ltd", phone: "0977 000 001", loc: "Cairo Road, Lusaka" },
      { id: 2, name: "Copperbelt Grill Co.", phone: "0966 000 002", loc: "Kitwe Town Centre" },
      { id: 3, name: "Zambezi Hotels", phone: "0955 000 003", loc: "Livingstone Main Way" }
    ],
    products: [
      { id: 1, name: "Pork carcass / Primal cut", price: 9500, br: [] },
      { id: 2, name: "Pork loin cuts", price: 9500, br: [] },
      { id: 3, name: "Pork shoulder", price: 9500, br: [] },
      { id: 4, name: "Spare ribs", price: 9500, br: [] }
    ],
    batches: [
      { id: 1, pid: 1, code: "BAT-2026-01", exp: day(9), rec: 300000, av: 300000 },
      { id: 2, pid: 1, code: "BAT-2026-02", exp: day(14), rec: 200000, av: 200000 },
      { id: 3, pid: 2, code: "BAT-2026-03", exp: day(11), rec: 250000, av: 250000 },
      { id: 4, pid: 3, code: "BAT-2026-04", exp: day(6), rec: 150000, av: 150000 },
      { id: 5, pid: 4, code: "BAT-2026-05", exp: day(12), rec: 40000, av: 40000 }
    ],
    orders: [],
    audit: []
  };
}

let S;
try {
  S = JSON.parse(localStorage.getItem(KEY)) || seed();
} catch {
  S = seed();
}

const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch {}
};

const tx = fn => {
  const d = structuredClone(S);
  const r = fn(d);
  S = d;
  save();
  return r;
};