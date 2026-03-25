import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const productSelect = document.getElementById("productSelect");
const itemsList = document.getElementById("itemsList");

let products = [];
let cart = [];

// =====================
// 📦 LOAD PRODUCTS
// =====================
async function loadProducts() {
  const snap = await getDocs(collection(db, "products"));

  snap.forEach(docSnap => {
    const data = docSnap.data();

    products.push({
      id: docSnap.id,
      ...data
    });

    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = data.name;

    productSelect.appendChild(option);
  });
}

// =====================
// ➕ ADD ITEM TO CART
// =====================
window.addItem = function () {
  const productId = productSelect.value;
  const qty = Number(document.getElementById("quantity").value);

  const product = products.find(p => p.id === productId);

  if (!product || qty <= 0) {
    alert("Invalid input");
    return;
  }

  if (qty > product.quantity) {
    alert("Not enough stock ❌");
    return;
  }

  cart.push({
    ...product,
    qty
  });

  renderCart();
};

// =====================
// 🧾 RENDER CART
// =====================
function renderCart() {
  itemsList.innerHTML = "";

  cart.forEach(item => {
    const div = document.createElement("div");
    div.className = "bg-white/10 p-2 rounded";

    div.innerHTML = `
      <p>${item.name} × ${item.qty}</p>
      <p>₹${item.sellingPrice * item.qty}</p>
    `;

    itemsList.appendChild(div);
  });
}

// =====================
// 🧾 GENERATE BILL
// =====================
window.generateBill = async function () {
  const customerName = document.getElementById("customerName").value;

  if (cart.length === 0) {
    alert("Add items first");
    return;
  }

  let total = 0;
  let profit = 0;

  cart.forEach(item => {
    total += item.sellingPrice * item.qty;
    profit += (item.sellingPrice - item.costPrice) * item.qty;
  });

  try {
    // SAVE BILL (PROFIT HIDDEN)
    await addDoc(collection(db, "bills"), {
      customerName,
      items: cart,
      total,
      profit, // stored but not shown
      date: new Date().toISOString()
    });

    // UPDATE STOCK
    for (let item of cart) {
      const ref = doc(db, "products", item.id);
      await updateDoc(ref, {
        quantity: item.quantity - item.qty
      });
    }

    // UPDATE BANK
    const bankRef = doc(db, "bank", "main");
    const bankSnap = await getDoc(bankRef);

    if (bankSnap.exists()) {
      const current = bankSnap.data().balance;

      await updateDoc(bankRef, {
        balance: current + total
      });
    }

    // 📄 SHOW BILL (NO PROFIT)
    document.getElementById("billResult").innerHTML = `
      <div class="bg-white/10 p-4 rounded">
        <p class="font-bold">Customer: ${customerName}</p>
        ${cart.map(i => `
          <p>${i.name} × ${i.qty} = ₹${i.sellingPrice * i.qty}</p>
        `).join("")}
        <hr class="my-2">
        <p class="text-xl font-bold">Total: ₹${total}</p>
      </div>
    `;

    alert("Bill generated ✅");

    // RESET
    cart = [];
    renderCart();

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};

// INIT
loadProducts();