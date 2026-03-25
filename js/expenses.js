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
  document.getElementById("aiOutput").innerText = "Analyzing...";

  try {
    // 🔹 FETCH DATA
    const productsSnap = await getDocs(collection(db, "products"));
    const billsSnap = await getDocs(collection(db, "bills"));
    const emiSnap = await getDocs(collection(db, "emi"));
    const lenderSnap = await getDocs(collection(db, "lenders"));

    let products = [];
    let sales = {};
    let dues = [];

    // 📦 PRODUCTS
    productsSnap.forEach(doc => {
      products.push(doc.data().name);
    });

    // 📈 SALES ANALYSIS
    billsSnap.forEach(doc => {
      const items = doc.data().items || [];

      items.forEach(i => {
        sales[i.name] = (sales[i.name] || 0) + i.qty;
      });
    });

    // 🏦 EMI
    emiSnap.forEach(doc => {
      dues.push({
        type: "EMI",
        name: doc.data().loanName,
        amount: doc.data().amount,
        date: doc.data().date
      });
    });

    // 👥 LENDERS
    lenderSnap.forEach(doc => {
      dues.push({
        type: "Lender",
        name: doc.data().name,
        amount: doc.data().amount,
        date: doc.data().date
      });
    });

    // 🧠 PROMPT
    const prompt = `
You are a smart business assistant.

Products: ${JSON.stringify(products)}
Sales: ${JSON.stringify(sales)}
Dues: ${JSON.stringify(dues)}

Give:
1. Fast selling products
2. Slow selling products
3. Upcoming dues
4. Payment priority:
   - First by nearest date
   - Then EMI
   - Then lenders

Keep it short and clear.
`;

    // 🤖 CALL AI
    const result = await getAIResponse(prompt);

    document.getElementById("aiOutput").innerText = result;

  } catch (err) {
    console.error(err);
    document.getElementById("aiOutput").innerText =
      "Error getting AI response ❌";
  }
};