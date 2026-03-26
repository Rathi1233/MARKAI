import { db } from "./firebase.js";
import {
  collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const balanceEl = document.getElementById("balance");
const emiList = document.getElementById("emiList");
const lenderList = document.getElementById("lenderList");
const prioritySection = document.getElementById("prioritySection");
const priorityList = document.getElementById("priorityList");

let allDues = [];

// =====================
// 🧠 DUE STATUS
// =====================
function getDueStatus(dateStr) {
  const today = new Date();
  const due = new Date(dateStr);
  today.setHours(0,0,0,0);
  due.setHours(0,0,0,0);

  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: "Overdue ❌", color: "text-red-500", priority: 0 };
  if (diffDays === 0) return { text: "Due Today ⚠️", color: "text-red-400", priority: 1 };
  if (diffDays <= 7) return { text: `Due in ${diffDays} days`, color: "text-yellow-400", priority: 2 };
  return { text: "Upcoming ✅", color: "text-green-400", priority: 3 };
}

// =====================
// 🔄 LOAD ALL DATA
// =====================
async function loadAllData() {
  allDues = [];
  loadBalance();
  
  const [emiSnap, lenderSnap] = await Promise.all([
    getDocs(collection(db, "emi")),
    getDocs(collection(db, "lenders"))
  ]);

  emiList.innerHTML = "";
  lenderList.innerHTML = "";
  priorityList.innerHTML = "";

  emiSnap.forEach(docSnap => {
    const d = docSnap.data();
    d.id = docSnap.id;
    d.type = "EMI";
    allDues.push(d);
    renderEmiUI(d);
  });

  lenderSnap.forEach(docSnap => {
    const d = docSnap.data();
    d.id = docSnap.id;
    d.type = "Lender";
    allDues.push(d);
    renderLenderUI(d);
  });

  renderPriorityUI();
}

async function loadBalance() {
  try {
    const snap = await getDoc(doc(db, "bank", "main"));
    if (snap.exists()) {
      balanceEl.innerText = "₹" + snap.data().balance;
    } else {
      balanceEl.innerText = "No bank data ❌";
    }
  } catch (error) {
    console.error(error);
    balanceEl.innerText = "Error ❌";
  }
}

// =====================
// 🖌️ RENDER UIs
// =====================
function renderEmiUI(d) {
  const status = getDueStatus(d.date);
  const div = document.createElement("div");
  div.className = "bg-white/5 border border-white/10 p-4 rounded-xl relative overflow-hidden group";
  div.innerHTML = `
    <div class="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <div class="relative z-10">
      <p class="font-bold text-gray-200">${d.loanName}</p>
      <div class="flex justify-between items-center mt-2">
        <p class="text-sm text-gray-400">₹${d.amount}</p>
        <p class="text-xs ${status.color} font-semibold">${status.text} (${d.date})</p>
      </div>
      <button onclick="payEMI('${d.id}', ${d.amount})" class="w-full bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-2 mt-3 rounded-lg hover:bg-green-500/40 transition text-sm">
        <i class="fas fa-check-circle"></i> Mark Paid
      </button>
    </div>
  `;
  emiList.appendChild(div);
}

function renderLenderUI(d) {
  const status = getDueStatus(d.date);
  const div = document.createElement("div");
  div.className = "bg-white/5 border border-white/10 p-4 rounded-xl relative overflow-hidden group";
  div.innerHTML = `
    <div class="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <div class="relative z-10">
      <p class="font-bold text-gray-200">${d.name}</p>
      <div class="flex justify-between items-center mt-2">
        <p class="text-sm text-gray-400">₹${d.amount}</p>
        <p class="text-xs ${status.color} font-semibold">${status.text} (${d.date})</p>
      </div>
      <button onclick="payLender('${d.id}', ${d.amount})" class="w-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-2 mt-3 rounded-lg hover:bg-yellow-500/40 transition text-sm">
        <i class="fas fa-hand-holding-usd"></i> Pay Now
      </button>
    </div>
  `;
  lenderList.appendChild(div);
}

function renderPriorityUI() {
  // Sort dues by nearest date
  const sortedDues = [...allDues].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA === dateB) {
      // EMI gets priority if dates are same
      return a.type === "EMI" ? -1 : 1;
    }
    return dateA - dateB;
  });

  const priorityItems = sortedDues.filter(due => getDueStatus(due.date).priority <= 2);

  if (priorityItems.length > 0) {
    prioritySection.classList.remove("hidden");
    priorityItems.slice(0, 3).forEach(d => {
      const status = getDueStatus(d.date);
      const icon = d.type === "EMI" ? '<i class="fas fa-building text-blue-400"></i>' : '<i class="fas fa-user text-orange-400"></i>';
      
      const div = document.createElement("div");
      div.className = "flex justify-between items-center glass-panel p-4 rounded-xl border border-red-500/30 bg-red-500/10";
      div.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gray-900/50 flex items-center justify-center text-xl">${icon}</div>
          <div>
            <p class="font-bold text-gray-200">${d.type === 'EMI' ? d.loanName : d.name}</p>
            <p class="text-xs ${status.color} font-bold">${status.text} (${d.date})</p>
          </div>
        </div>
        <div class="text-right">
          <p class="font-bold text-white mb-1">₹${d.amount}</p>
        </div>
      `;
      priorityList.appendChild(div);
    });
  } else {
    prioritySection.classList.add("hidden");
  }
}

// =====================
// 💸 PAYMENTS
// =====================
window.payEMI = async function (id, amount) {
  try {
    const bankRef = doc(db, "bank", "main");
    const snap = await getDoc(bankRef);
    if (snap.exists()) {
      await updateDoc(bankRef, { balance: snap.data().balance - amount });
    }
    await deleteDoc(doc(db, "emi", id));
    loadAllData();
  } catch (err) { console.error(err); alert("Error"); }
};

window.payLender = async function (id, amount) {
  try {
    const bankRef = doc(db, "bank", "main");
    const snap = await getDoc(bankRef);
    if (snap.exists()) {
      await updateDoc(bankRef, { balance: snap.data().balance - amount });
    }
    await deleteDoc(doc(db, "lenders", id));
    loadAllData();
  } catch (err) { console.error(err); alert("Error"); }
};

// =====================
// ➕ ADDITIONS
// =====================
window.addEMI = async function () {
  const loanName = document.getElementById("loanName").value;
  const amount = Number(document.getElementById("emiAmount").value);
  const date = document.getElementById("emiDate").value;

  if (!loanName || amount <= 0 || !date) return alert("Enter valid EMI details");
  await addDoc(collection(db, "emi"), { loanName, amount, date });

  document.getElementById("loanName").value = "";
  document.getElementById("emiAmount").value = "";
  document.getElementById("emiDate").value = "";
  loadAllData();
};

window.addLender = async function () {
  const name = document.getElementById("lenderName").value;
  const amount = Number(document.getElementById("lenderAmount").value);
  const date = document.getElementById("lenderDate").value;

  if (!name || amount <= 0 || !date) return alert("Enter valid lender details");
  await addDoc(collection(db, "lenders"), { name, amount, date });

  document.getElementById("lenderName").value = "";
  document.getElementById("lenderAmount").value = "";
  document.getElementById("lenderDate").value = "";
  loadAllData();
};

loadAllData();