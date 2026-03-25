 import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const productList = document.getElementById("productList");

// 🔔 TOAST FUNCTION
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");

  toast.innerText = message;

  toast.className =
    "fixed bottom-5 right-5 px-4 py-2 rounded shadow-lg text-white " +
    (type === "success" ? "bg-green-500" : "bg-red-500");

  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 2000);
}

// ➕ ADD PRODUCT
window.addProduct = async function () {
  const btn = document.getElementById("addBtn");
  btn.innerText = "Adding...";
  btn.disabled = true;

  const name = document.getElementById("name").value;
  const quantity = Number(document.getElementById("quantity").value);
  const costPrice = Number(document.getElementById("costPrice").value);
  const sellingPrice = Number(document.getElementById("sellingPrice").value);

  if (!name || quantity <= 0) {
    showToast("Enter valid product details ❌", "error");
    btn.innerText = "Add Product";
    btn.disabled = false;
    return;
  }

  try {
    await addDoc(collection(db, "products"), {
      name,
      quantity,
      costPrice,
      sellingPrice
    });

    // Clear inputs
    document.getElementById("name").value = "";
    document.getElementById("quantity").value = "";
    document.getElementById("costPrice").value = "";
    document.getElementById("sellingPrice").value = "";

    showToast("Product added successfully ✅");

    loadProducts();

  } catch (error) {
    console.error(error);
    showToast(error.message, "error");
  }

  btn.innerText = "Add Product";
  btn.disabled = false;
};

// 📥 LOAD PRODUCTS
async function loadProducts() {
  productList.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "products"));

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();

    // 🔥 LOW STOCK ALERT
    const isLow = data.quantity <= 5;

    const div = document.createElement("div");
    div.className =
      (isLow ? "bg-red-500/30 " : "bg-white/10 ") +
      "p-3 rounded flex justify-between items-center";

    div.innerHTML = `
      <div>
        <h2 class="font-bold">${data.name}</h2>
        <p>Qty: ${data.quantity} ${isLow ? "⚠️ Low Stock" : ""}</p>
        <p>CP: ₹${data.costPrice} | SP: ₹${data.sellingPrice}</p>
      </div>

      <button onclick="deleteProduct('${docSnap.id}')"
        class="bg-red-500 px-3 py-1 rounded hover:bg-red-600">
        Delete
      </button>
    `;

    productList.appendChild(div);
  });
}

// ❌ DELETE PRODUCT
window.deleteProduct = async function (id) {
  try {
    await deleteDoc(doc(db, "products", id));
    showToast("Product deleted ❌", "error");
    loadProducts();
  } catch (error) {
    console.error(error);
    showToast(error.message, "error");
  }
};

// 🚀 INITIAL LOAD
loadProducts();