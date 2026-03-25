import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// =====================
// 💳 BANK BALANCE
// =====================

const balanceEl = document.getElementById("balance");

async function loadBalance() {
  try {
    const docRef = doc(db, "bank", "main");
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      balanceEl.innerText = "₹" + snap.data().balance;
    } else {
      balanceEl.innerText = "No bank data ❌";
    }

  } catch (error) {
    console.error(error);
    balanceEl.innerText = "Error loading ❌";
  }
}

// =====================
// 🧠 DUE STATUS
// =====================

function getDueStatus(dateStr) {
  const today = new Date();
  const due = new Date(dateStr);

  today.setHours(0,0,0,0);
  due.setHours(0,0,0,0);

  if (due < today) {
    return { text: "Overdue ❌", color: "text-red-400" };
  } else if (due.getTime() === today.getTime()) {
    return { text: "Due Today ⚠️", color: "text-yellow-400" };
  } else {
    return { text: "Upcoming ✅", color: "text-green-400" };
  }
}

// =====================
// 🏦 EMI
// =====================

const emiList = document.getElementById("emiList");

window.addEMI = async function () {
  const loanName = document.getElementById("loanName").value;
  const amount = Number(document.getElementById("emiAmount").value);
  const date = document.getElementById("emiDate").value;

  if (!loanName || amount <= 0) {
    alert("Enter valid EMI details");
    return;
  }

  await addDoc(collection(db, "emi"), {
    loanName,
    amount,
    date
  });

  document.getElementById("loanName").value = "";
  document.getElementById("emiAmount").value = "";
  document.getElementById("emiDate").value = "";

  loadEMI();
};

async function loadEMI() {
  emiList.innerHTML = "";

  const snap = await getDocs(collection(db, "emi"));

  snap.forEach(docSnap => {
    const d = docSnap.data();
    const status = getDueStatus(d.date);

    const div = document.createElement("div");
    div.className = "bg-white/10 p-3 rounded";

    div.innerHTML = `
      <p class="font-bold">${d.loanName}</p>
      <p>Amount: ₹${d.amount}</p>
      <p>📅 Due: ${d.date}</p>
      <p class="${status.color} font-semibold">${status.text}</p>

      <button onclick="payEMI('${docSnap.id}', ${d.amount})"
        class="bg-green-500 px-3 py-1 mt-2 rounded">
        Pay EMI
      </button>
    `;

    emiList.appendChild(div);
  });
}

// 💸 PAY EMI
window.payEMI = async function (id, amount) {
  const bankRef = doc(db, "bank", "main");
  const snap = await getDoc(bankRef);

  if (snap.exists()) {
    const current = snap.data().balance;

    await updateDoc(bankRef, {
      balance: current - amount
    });
  }

  await deleteDoc(doc(db, "emi", id));

  alert("EMI Paid ✅");

  loadBalance();
  loadEMI();
};

// =====================
// 👥 LENDERS
// =====================

const lenderList = document.getElementById("lenderList");

window.addLender = async function () {
  const name = document.getElementById("lenderName").value;
  const amount = Number(document.getElementById("lenderAmount").value);
  const date = document.getElementById("lenderDate").value;

  if (!name || amount <= 0) {
    alert("Enter valid lender details");
    return;
  }

  await addDoc(collection(db, "lenders"), {
    name,
    amount,
    date
  });

  document.getElementById("lenderName").value = "";
  document.getElementById("lenderAmount").value = "";
  document.getElementById("lenderDate").value = "";

  loadLenders();
};

async function loadLenders() {
  lenderList.innerHTML = "";

  const snap = await getDocs(collection(db, "lenders"));

  snap.forEach(docSnap => {
    const d = docSnap.data();
    const status = getDueStatus(d.date);

    const div = document.createElement("div");
    div.className = "bg-white/10 p-3 rounded";

    div.innerHTML = `
      <p class="font-bold">${d.name}</p>
      <p>Amount: ₹${d.amount}</p>
      <p>📅 Due: ${d.date}</p>
      <p class="${status.color} font-semibold">${status.text}</p>

      <button onclick="payLender('${docSnap.id}', ${d.amount})"
        class="bg-yellow-500 px-3 py-1 mt-2 rounded">
        Pay
      </button>
    `;

    lenderList.appendChild(div);
  });
}

// 💸 PAY LENDER
window.payLender = async function (id, amount) {
  const bankRef = doc(db, "bank", "main");
  const snap = await getDoc(bankRef);

  if (snap.exists()) {
    const current = snap.data().balance;

    await updateDoc(bankRef, {
      balance: current - amount
    });
  }

  await deleteDoc(doc(db, "lenders", id));

  alert("Payment done ✅");

  loadBalance();
  loadLenders();
};

// =====================
// 🚀 INIT
// =====================

loadBalance();
loadEMI();
loadLenders();