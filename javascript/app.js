/**
 * app.js - Main Controller, Event Listeners & Reactive DOM Renderer
 * protoPork Frontend - ABCstartups / KachiCodes
 */

import { getState, tx, resetData, createOrder, pack, dispatch, deliver, toG, Err } from './store.js';
import { renderPaymentModal } from './payment.js';
import { hubView, newView, ordersView, storeView, ticket } from './components.js';

const ui = {
  portal: null,
  cid: 1,
  tab: "new",
  view: "build",
  draft: { cid: 1, lines: [{ pid: 1, kg: "" }], pay: "momo", nsp: "mtn", billingNumber: "" },
  simulatingPayment: false
};

const $ = s => document.querySelector(s);
let toastT;

function toast(m, bad) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = m;
  t.className = bad ? "bad" : "";
  clearTimeout(toastT);
  toastT = setTimeout(() => t.textContent = "", 5000);
}

const run = (fn, msg) => {
  try {
    const r = fn();
    if (msg) toast(typeof msg === "function" ? msg(r) : msg);
    render();
  } catch (e) {
    toast(e instanceof Err ? e.message : "Error executing action.", true);
    console.error(e);
  }
};

const draftClient = () => {
  const S = getState();
  return S.clients.find(x => x.id === (ui.portal === "client" ? ui.cid : ui.draft.cid));
};

const finalizeOrderSubmission = () => {
  const d = ui.draft;
  const cid = ui.portal === "client" ? ui.cid : d.cid;
  const n = tx(s => createOrder(
    s, { role: ui.portal }, cid,
    d.lines.map(l => ({ pid: l.pid, kg: Number(l.kg) })),
    d.svc || "deliver",
    { phone: d.phone ?? draftClient().phone, loc: d.loc ?? draftClient().loc },
    d.pay || "momo",
    d.nsp,
    d.billingNumber
  ));
  
  ui.draft = { cid: d.cid, lines: [{ pid: 1, kg: "" }], pay: "momo", nsp: "mtn", billingNumber: "" };
  ui.tab = "orders";
  ui.view = "build";
  ui.simulatingPayment = false;
  toast(`Order #${n.id} placed & payment authorized! Stock reserved via FEFO.`);
  render();
};

export function render() {
  const S = getState();
  const app = $("#app");
  if (!app) return;

  if (!ui.portal) {
    app.innerHTML = hubView();
    return;
  }

  const tabs = {
    admin: [["new", "New Order"], ["orders", "Orders & Scale"], ["store", "Cold Storage FEFO"]],
    driver: [["orders", "Field Deliveries"]],
    client: [["new", "Place Order"], ["orders", "My Orders"]]
  }[ui.portal];

  if (!tabs.some(t => t[0] === ui.tab)) ui.tab = tabs[0][0];

  const title = { client: "Client Portal", admin: "Owner Control Room", driver: "Delivery Runner View" }[ui.portal];
  const opts = (arr, sel) => arr.map(([v, t]) => `<option value="${v}"${v === sel ? " selected" : ""}>${t}</option>`).join("");
  const ctx = ui.portal === "client" ? `<div style="margin-bottom:16px;"><label for="cx" class="mut" style="font-size:13px; font-weight:700;">ACTIVE CLIENT SIMULATION: </label><select id="cx" data-k="ctx" style="width: auto; padding: 6px 12px; height: auto;">${opts(S.clients.map(c => [c.id, c.name]), ui.cid)}</select></div>` : "";

  app.innerHTML = `
    <header class="top">
      <div>
        <h1 data-act="home">protoPork</h1>
        <small>${title}</small>
      </div>
      <button class="btn alt" data-act="home" style="padding: 8px 16px; font-size: 13px;">← Switch Portal</button>
    </header>
    ${ctx}
    ${tabs.length > 1 ? `<nav class="tabs" role="tablist">${tabs.map(([v, t]) => `<button role="tab" data-tab="${v}" aria-selected="${ui.tab === v}">${t}</button>`).join("")}</nav>` : ""}
    <main>${{ new: () => newView(ui), orders: () => ordersView(ui), store: storeView }[ui.tab]()}</main>
    ${ui.simulatingPayment ? renderPaymentModal(ui.draft) : ""}
    <footer>
      <div class="brand-footer">
        <svg viewBox="0 0 512 512"><path d="M256 32L32 464h448L256 32zm0 108l144 268H112l144-268z"/></svg>
        <span>ABCstartups</span>
      </div>
      <span>Developed by KachiCodes – a subsidiary of ABCstartups</span>
      ${ui.portal === "admin" ? `<div><button class="btn alt" data-act="reset" style="padding:4px 12px; font-size:12px; margin-top:6px;">Reset Demo Data</button></div>` : ""}
    </footer>`;
}

// Global Event Listeners
document.addEventListener("click", e => {
  const card = e.target.closest("[data-launch]");
  if (card) { ui.portal = card.dataset.launch; ui.view = "build"; ui.tab = "new"; return render(); }

  const nspCard = e.target.closest("[data-nsp]");
  if (nspCard) { ui.draft.nsp = nspCard.dataset.nsp; return render(); }

  const t = e.target.closest("[data-tab]");
  if (t) { ui.tab = t.dataset.tab; ui.view = "build"; return render(); }

  const b = e.target.closest("[data-act]"); if (!b) return;
  const a = b.dataset.act, d = ui.draft, o = Number(b.dataset.o);

  if (a === "home") { ui.portal = null; return render(); }
  else if (a === "add") { d.lines.push({ pid: 1, kg: "" }); render(); }
  else if (a === "checkout") run(() => { for (const l of d.lines) toG(Number(l.kg)); if (new Set(d.lines.map(l => l.pid)).size !== d.lines.length) throw new Err("Each cut can only be selected once per order."); ui.view = "checkout"; });
  else if (a === "back") { ui.view = "build"; render(); }
  else if (a === "rm") { d.lines.splice(Number(b.dataset.i), 1); if (!d.lines.length) d.lines.push({ pid: 1, kg: "" }); render(); }
  else if (a === "place") {
    run(() => {
      for (const l of d.lines) toG(Number(l.kg));
      if (d.pay === "momo") {
        if (!d.billingNumber || d.billingNumber.trim().length < 7) throw new Err("Enter a valid Mobile Money / Card number to proceed.");
        ui.simulatingPayment = true;
      } else {
        finalizeOrderSubmission();
      }
    });
  }
  else if (a === "confirmPayment") {
    finalizeOrderSubmission();
  }
  else if (a === "pack") run(() => { const kg = Number($("#w" + b.dataset.l).value); tx(s => pack(s, { role: ui.portal }, o, Number(b.dataset.l), kg)); }, "Scale weigh-in saved. Inventory updated.");
  else if (a === "dispatch") run(() => tx(s => dispatch(s, { role: ui.portal }, o, null)), "Order dispatched to runner.");
  else if (a === "deliver") run(() => tx(s => deliver(s, o)), "Order fulfilled and payment completed.");
  else if (a === "reset") { resetData(); ui.draft = { cid: 1, lines: [{ pid: 1, kg: "" }], pay: "momo", nsp: "mtn", billingNumber: "" }; toast("protoPork demo data reset."); render(); }
});

document.addEventListener("change", e => {
  const el = e.target, k = el.dataset.k, d = ui.draft;
  if (k === "ctx") { ui.cid = Number(el.value); d.phone = d.loc = undefined; render(); }
  else if (k === "dcid") { d.cid = Number(el.value); d.phone = d.loc = undefined; render(); }
  else if (k === "pid") { d.lines[Number(el.dataset.i)].pid = Number(el.value); render(); }
  else if (k === "pay") { 
    d.pay = el.value; 
    const t = $("#ticket"); if (t) t.innerHTML = ticket(ui);
    const f = $("#nspFields"); if (f) f.hidden = el.value !== "momo"; 
  }
  else if (k === "svc") { 
    d.svc = el.value; 
    const t = $("#ticket"); if (t) t.innerHTML = ticket(ui);
    const f = $("#dfields"); if (f) f.hidden = el.value !== "deliver"; 
  }
});

document.addEventListener("input", e => {
  const el = e.target, k = el.dataset.k;
  if (k === "kg") { ui.draft.lines[Number(el.dataset.i)].kg = el.value; const t = $("#ticket"); if (t) t.innerHTML = ticket(ui); }
  else if (k === "phone") ui.draft.phone = el.value;
  else if (k === "loc") ui.draft.loc = el.value;
  else if (k === "billingNumber") ui.draft.billingNumber = el.value;
});

// Initial Render Trigger
document.addEventListener("DOMContentLoaded", render);