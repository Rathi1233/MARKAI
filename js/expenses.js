import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { getAIResponse } from "./ai.js";

// =====================
// 🤖 AI INSIGHTS
// =====================

window.generateInsights = async function () {
  const btn = document.getElementById("generateBtn");
  const aiOutput = document.getElementById("aiOutput");
  const aiDataView = document.getElementById("aiDataView");

  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing Data...';
  btn.disabled = true;
  aiOutput.classList.remove("hidden");
  aiDataView.classList.add("hidden");
  aiOutput.innerText = "Analyzing your inventory, sales, and dues...";

  try {
    // 🔹 FETCH DATA
    const productsSnap = await getDocs(collection(db, "products"));
    const billsSnap = await getDocs(collection(db, "bills"));
    const emiSnap = await getDocs(collection(db, "emi"));
    const lenderSnap = await getDocs(collection(db, "lenders"));

    let products = [];
    let sales = {};
    let dues = [];

    productsSnap.forEach(doc => products.push(doc.data().name));

    billsSnap.forEach(doc => {
      const items = doc.data().items || [];
      items.forEach(i => {
        sales[i.name] = (sales[i.name] || 0) + i.qty;
      });
    });

    emiSnap.forEach(doc => dues.push({ type: "EMI", name: doc.data().loanName, amount: doc.data().amount, date: doc.data().date }));
    lenderSnap.forEach(doc => dues.push({ type: "Lender", name: doc.data().name, amount: doc.data().amount, date: doc.data().date }));

    // 🧠 PROMPT
    const prompt = `
You are a smart business assistant.
Products: ${JSON.stringify(products)}
Sales: ${JSON.stringify(sales)}
Dues: ${JSON.stringify(dues)}

Return a strict JSON object with this EXACT structure:
{
  "fastSelling": ["item 1", "item 2"],
  "slowSelling": ["item 1", "item 2"],
  "upcomingDues": ["due 1 detail", "due 2 detail"],
  "paymentPriority": ["priority 1", "priority 2"]
}

Give short, actionable strings (max 5 items per array). Base your analysis purely on the data provided. Emis first, then near date for dues.
`;

    // 🤖 CALL AI in JSON Mode
    const resultStr = await getAIResponse(prompt, null, true);
    
    // Attempt to parse JSON
    let data;
    try {
      data = JSON.parse(resultStr);
    } catch(e) {
      // Sometimes models put json in markdown code block
      const cleaned = resultStr.replace(/```json/g, '').replace(/```/g, '').trim();
      data = JSON.parse(cleaned);
    }

    // Hide text box and show structural view
    aiOutput.classList.add("hidden");
    aiDataView.classList.remove("hidden");
    
    // Render
    renderList("fastSellingList", data.fastSelling, "No fast selling data yet.");
    renderList("slowSellingList", data.slowSelling, "No slow selling data yet.");
    renderList("duesList", data.upcomingDues, "No upcoming dues.");
    renderList("priorityActionList", data.paymentPriority, "No priority actions.");

  } catch (err) {
    console.error(err);
    aiOutput.innerText = "Error getting AI response ❌\n" + err.message;
    aiOutput.classList.remove("hidden");
    aiDataView.classList.add("hidden");
  }

  btn.innerHTML = '<i class="fas fa-magic"></i> Generate Insights';
  btn.disabled = false;
};

// HELPER
function renderList(elementId, items, emptyMessage) {
  const el = document.getElementById(elementId);
  el.innerHTML = "";
  if (!items || items.length === 0) {
    el.innerHTML = `<li class="text-gray-500 italic"><i class="fas fa-circle-info text-xs mr-2"></i>${emptyMessage}</li>`;
    return;
  }
  items.forEach(item => {
    el.innerHTML += `<li class="flex items-start gap-2 border-b border-white/5 pb-2 last:border-0"><i class="fas fa-check text-blue-400 mt-1 text-xs"></i> <span>${item}</span></li>`;
  });
}