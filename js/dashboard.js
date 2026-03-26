import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function loadDashboardData() {
  await Promise.all([loadTodaySummary(), loadLowStockAlerts(), loadRecentTransactions()]);
}

async function loadTodaySummary() {
  const todaySalesEl = document.getElementById("todaySales");
  const todayItemsEl = document.getElementById("todayItems");

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const billsSnap = await getDocs(collection(db, "bills"));

    let totalSales = 0;
    let totalItems = 0;

    billsSnap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.date && data.date.startsWith(todayStr)) {
        totalSales += data.total;
        let itemsCount = 0;
        if (data.items) {
          data.items.forEach(item => { itemsCount += item.qty; });
        }
        totalItems += itemsCount;
      }
    });

    todaySalesEl.innerText = `₹${totalSales.toLocaleString()}`;
    todayItemsEl.innerText = totalItems;
  } catch (err) {
    console.error(err);
    todaySalesEl.innerText = "Error";
    todayItemsEl.innerText = "-";
  }
}

async function loadLowStockAlerts() {
  const alertsContainer = document.getElementById("lowStockAlerts");

  try {
    const productsSnap = await getDocs(collection(db, "products"));
    let lowStockHtml = '';

    productsSnap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.quantity <= 5) {
        lowStockHtml += `
          <div class="flex items-center justify-between bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
            <span class="text-sm font-semibold text-gray-200">${data.name}</span>
            <span class="text-xs font-bold text-red-400 bg-red-500/20 px-2 py-1 rounded">Qty: ${data.quantity}</span>
          </div>
        `;
      }
    });

    if (lowStockHtml === "") {
      lowStockHtml = `<p class="text-sm text-green-400"><i class="fas fa-check-circle"></i> All products are sufficiently stocked.</p>`;
    }

    alertsContainer.innerHTML = lowStockHtml;
  } catch (err) {
    console.error(err);
    alertsContainer.innerHTML = `<p class="text-sm text-red-400">Failed to load alerts.</p>`;
  }
}

async function loadRecentTransactions() {
  const container = document.getElementById("recentTransactions");
  try {
    const billsSnap = await getDocs(collection(db, "bills"));
    let allBills = [];
    billsSnap.forEach(doc => {
      allBills.push({ id: doc.id, ...doc.data() });
    });

    // Sort descending by date
    allBills.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Take top 5
    const recent = allBills.slice(0, 5);

    if (recent.length === 0) {
      container.innerHTML = '<p class="text-sm text-gray-500 italic">No transactions yet.</p>';
      return;
    }

    let html = '';
    recent.forEach(bill => {
      const dateStr = new Date(bill.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
      const itemCount = bill.items ? bill.items.length : 0;

      html += `
        <div class="glass-panel p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition border border-white/5">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400"><i class="fas fa-file-invoice"></i></div>
            <div>
              <p class="font-bold text-gray-200">${bill.customerName || 'Walk-in Customer'}</p>
              <p class="text-xs text-gray-500">${itemCount} items • ${dateStr}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-bold text-green-400">+₹${bill.total.toLocaleString()}</p>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="text-sm text-red-500">Error loading transactions.</p>';
  }
}

// 🚀 INIT
loadDashboardData();
