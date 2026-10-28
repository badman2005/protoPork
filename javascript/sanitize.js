/**
 * js/sanitize.js - Client-Side Text Sanitization & Formatters
 * protoPork - ABCstartups / KachiCodes
 */

class Err extends Error {}

const $ = s => document.querySelector(s);

const esc = s => String(s).replace(/[&<>"]/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
}[c]));

const day = n => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const rd = (n, d) => {
  const s = n + Math.floor(d / 2);
  return (s - (s % d)) / d;
};

const toG = kg => {
  const g = Math.round(kg * 1000);
  if (!(kg > 0) || kg > 50000 || Math.abs(kg * 1000 - g) > 1e-6) {
    throw new Err("Weight must be above 0 kg with at most 3 decimals.");
  }
  return g;
};

const money = c => CUR + Number((c / 100).toFixed(2)).toLocaleString("en", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const kgf = g => Number((g / 1000).toFixed(3)).toLocaleString("en", {
  maximumFractionDigits: 3
}) + " kg";

const sum = (a, f) => a.reduce((t, x) => t + f(x), 0);