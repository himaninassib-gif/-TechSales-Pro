/**
 * TechSales Pro - التطبيق الأساسي
 * إدارة الحالة، القفل، البيانات والعرض الرئيسي
 */

const STORAGE_KEYS = {
  products: 'techsales_products',
  customers: 'techsales_customers',
  sales: 'techsales_sales',
  settings: 'techsales_settings',
  pin: 'techsales_pin',
  unlocked: 'techsales_unlocked',
};

const DEFAULT_PIN = '1234';

const SAMPLE_PRODUCTS = [
  { id: 'p1', name: 'لابتوب Dell XPS 13', specs: 'i7 / 16GB / 512GB SSD', cost: 3200, price: 4200, stock: 5, icon: '💻' },
  { id: 'p2', name: 'لابتوب HP Pavilion', specs: 'i5 / 8GB / 256GB SSD', cost: 1900, price: 2600, stock: 8, icon: '💻' },
  { id: 'p3', name: 'شاشة Samsung 27"', specs: 'Full HD / IPS', cost: 600, price: 950, stock: 12, icon: '🖥️' },
  { id: 'p4', name: 'ماوس Logitech G502', specs: 'لاسلكي / RGB', cost: 90, price: 160, stock: 1, icon: '🖱️' },
  { id: 'p5', name: 'كيبورد ميكانيكي', specs: 'RGB / Blue Switch', cost: 150, price: 280, stock: 0, icon: '⌨️' },
];

const SAMPLE_CUSTOMERS = [
  { id: 'c1', name: 'أحمد بلحاج', phone: '0550000001' },
  { id: 'c2', name: 'سارة بن علي', phone: '0550000002' },
  { id: 'c3', name: 'يوسف مرابط', phone: '0550000003' },
];

class App {
  constructor() {
    this.products = this.loadData(STORAGE_KEYS.products, SAMPLE_PRODUCTS);
    this.customers = this.loadData(STORAGE_KEYS.customers, SAMPLE_CUSTOMERS);
    this.sales = this.loadData(STORAGE_KEYS.sales, []);
    this.settings = this.loadData(STORAGE_KEYS.settings, {
      darkMode: true,
      autoLock: true,
    });

    this.currentPage = 'dashboard';

    this.initLockScreen();
    this.renderTopbarDate();
  }

  // ===== تخزين البيانات =====
  loadData(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.error('loadData error for', key, e);
      return fallback;
    }
  }

  saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('saveData error for', key, e);
    }
  }

  persistAll() {
    this.saveData(STORAGE_KEYS.products, this.products);
    this.saveData(STORAGE_KEYS.customers, this.customers);
    this.saveData(STORAGE_KEYS.sales, this.sales);
    this.saveData(STORAGE_KEYS.settings, this.settings);
  }

  // ===== شاشة القفل =====
  getPin() {
    return localStorage.getItem(STORAGE_KEYS.pin) || DEFAULT_PIN;
  }

  setPin(newPin) {
    localStorage.setItem(STORAGE_KEYS.pin, newPin);
  }

  isUnlocked() {
    return sessionStorage.getItem(STORAGE_KEYS.unlocked) === 'true';
  }

  unlock() {
    sessionStorage.setItem(STORAGE_KEYS.unlocked, 'true');
  }

  lockNow() {
    sessionStorage.removeItem(STORAGE_KEYS.unlocked);
    const lockScreen = document.querySelector('.lock-screen');
    if (lockScreen) lockScreen.classList.remove('hidden');
    const input = document.querySelector('.lock-input');
    if (input) {
      input.value = '';
      input.type = 'password';
      setTimeout(() => input.focus(), 50);
    }
  }

  initLockScreen() {
    const lockScreen = document.querySelector('.lock-screen');
    const input = document.querySelector('.lock-input');
    const btn = document.querySelector('.lock-btn');
    const errorEl = document.querySelector('.lock-error');
    const eye = document.querySelector('.lock-eye');

    if (!lockScreen || !input || !btn) return;

    // إذا فُتح التطبيق مسبقاً في هذه الجلسة، أو القفل التلقائي غير مفعّل
    if (!this.settings.autoLock || this.isUnlocked()) {
      lockScreen.classList.add('hidden');
    } else {
      setTimeout(() => input.focus(), 100);
    }

    const tryUnlock = () => {
      const value = input.value.trim();
      if (value.length === 0) {
        this.showLockError('أدخل الرمز السري');
        return;
      }
      if (value === this.getPin()) {
        this.unlock();
        lockScreen.classList.add('hidden');
        errorEl.textContent = '';
        input.classList.remove('error');
      } else {
        this.showLockError('رمز غير صحيح، حاول مرة أخرى');
        input.classList.add('error');
        input.value = '';
        setTimeout(() => input.classList.remove('error'), 450);
      }
    };

    btn.addEventListener('click', tryUnlock);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        tryUnlock();
      }
    });

    // السماح فقط بأرقام، وفتح تلقائي عند إدخال 4 خانات
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^0-9]/g, '').slice(0, 4);
      if (input.value.length === 4) {
        tryUnlock();
      }
    });

    if (eye) {
      eye.addEventListener('click', () => {
        input.type = input.type === 'password' ? 'text' : 'password';
      });
    }
  }

  showLockError(message) {
    const errorEl = document.querySelector('.lock-error');
    if (errorEl) errorEl.textContent = message;
  }

  // ===== تاريخ الشريط العلوي =====
  renderTopbarDate() {
    const el = document.querySelector('.topbar-date');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleDateString('ar-SA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  // ===== العمليات على المبيعات =====
  addSale(saleData) {
    const product = this.products.find((p) => p.id === saleData.productId);
    const customer = this.customers.find((c) => c.id === saleData.customerId);
    if (!product || !customer) {
      this.showToast('بيانات غير صالحة', 'error');
      return false;
    }
    const quantity = parseInt(saleData.quantity, 10) || 1;
    if (quantity > product.stock) {
      this.showToast('الكمية المطلوبة أكبر من المخزون المتاح', 'error');
      return false;
    }

    const totalPrice = product.price * quantity;
    const totalCost = product.cost * quantity;
    const profit = totalPrice - totalCost;

    const sale = {
      id: 'sale_' + Date.now(),
      productId: product.id,
      productName: product.name,
      customerId: customer.id,
      customerName: customer.name,
      quantity,
      unitPrice: product.price,
      unitCost: product.cost,
      totalPrice,
      totalCost,
      profit,
      notes: saleData.notes || '',
      date: new Date().toISOString(),
    };

    this.sales.unshift(sale);
    product.stock = Math.max(0, product.stock - quantity);
    this.persistAll();
    this.renderDashboard();
    return true;
  }

  deleteSale(saleId) {
    const sale = this.sales.find((s) => s.id === saleId);
    if (!sale) return false;
    // استرجاع الكمية إلى المخزون
    const product = this.products.find((p) => p.id === sale.productId);
    if (product) product.stock += sale.quantity;

    this.sales = this.sales.filter((s) => s.id !== saleId);
    this.persistAll();
    this.renderDashboard();
    return true;
  }

  // ===== الحسابات والتقارير =====
  getKPIs() {
    const totalSales = this.sales.length;
    const totalRevenue = this.sales.reduce((sum, s) => sum + s.totalPrice, 0);
    const totalProfit = this.sales.reduce((sum, s) => sum + s.profit, 0);
    const averageOrderValue = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

    return { totalSales, totalRevenue, totalProfit, averageOrderValue, profitMargin };
  }

  getTopProducts(limit = 5) {
    const counts = {};
    this.sales.forEach((sale) => {
      if (!counts[sale.productId]) {
        counts[sale.productId] = {
          id: sale.productId,
          name: sale.productName,
          count: 0,
          revenue: 0,
        };
      }
      counts[sale.productId].count += sale.quantity;
      counts[sale.productId].revenue += sale.totalPrice;
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getTopCustomers(limit = 5) {
    const counts = {};
    this.sales.forEach((sale) => {
      if (!counts[sale.customerId]) {
        counts[sale.customerId] = {
          id: sale.customerId,
          name: sale.customerName,
          count: 0,
          revenue: 0,
        };
      }
      counts[sale.customerId].count += 1;
      counts[sale.customerId].revenue += sale.totalPrice;
    });

    return Object.values(counts)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  getDailySalesStats(days = 7) {
    const stats = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const daySales = this.sales.filter((s) => new Date(s.date).toDateString() === dateStr);
      stats.push({
        label: date.toLocaleDateString('ar-SA', { weekday: 'short' }),
        count: daySales.length,
        revenue: daySales.reduce((sum, s) => sum + s.totalPrice, 0),
      });
    }
    return stats;
  }

  // ===== العرض: لوحة التحكم =====
  renderDashboard() {
    const kpis = this.getKPIs();
    const kpiContainer = document.querySelector('#dashboard-kpis');
    if (kpiContainer) {
      const cards = kpiContainer.querySelectorAll('.kpi-card');
      if (cards[0]) cards[0].querySelector('.kpi-value').textContent = kpis.totalSales;
      if (cards[1]) cards[1].querySelector('.kpi-value').textContent = this.formatCurrency(kpis.totalRevenue);
      if (cards[2]) cards[2].querySelector('.kpi-value').textContent = this.formatCurrency(kpis.totalProfit);
      if (cards[3]) cards[3].querySelector('.kpi-value').textContent = this.formatCurrency(kpis.averageOrderValue);
    }

    const listEl = document.querySelector('#recent-sales-list');
    if (listEl) {
      const recent = this.sales.slice(0, 5);
      if (recent.length === 0) {
        listEl.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <div class="empty-text">لا توجد مبيعات</div>
          </div>`;
      } else {
        listEl.innerHTML = recent
          .map(
            (sale) => `
          <div class="sale-item" data-sale-id="${sale.id}">
            <div class="sale-avatar">${this.getProductIcon(sale.productId)}</div>
            <div class="sale-info">
              <div class="sale-product">${this.escapeHtml(sale.productName)}</div>
              <div class="sale-customer">${this.escapeHtml(sale.customerName)}</div>
            </div>
            <div class="sale-amounts">
              <div class="sale-price">${this.formatCurrency(sale.totalPrice)}</div>
              <div class="sale-profit">+${this.formatCurrency(sale.profit)}</div>
            </div>
          </div>`
          )
          .join('');

        listEl.querySelectorAll('.sale-item').forEach((item) => {
          item.addEventListener('click', () => {
            const saleId = item.getAttribute('data-sale-id');
            if (window.uiController) window.uiController.showSaleDetails(saleId);
          });
        });
      }
    }
  }

  // ===== أدوات مساعدة =====
  getProductIcon(productId) {
    const product = this.products.find((p) => p.id === productId);
    return product ? product.icon || '📦' : '📦';
  }

  formatCurrency(value) {
    return Math.round(value).toLocaleString('ar-SA');
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  showToast(message, type = 'success') {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = 'toast show' + (type === 'error' ? ' error' : '');
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }
}

// تهيئة التطبيق عند تحميل الصفحة
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new App();
  window.app = app;
  app.renderDashboard();
});
