/**
 * TechSales Pro - متحكم واجهة المستخدم
 * التنقل بين الصفحات، قائمة المبيعات، التقارير، الإعدادات، والنوافذ المنبثقة
 */

class UIController {
  constructor() {
    this.currentFilter = 'all';
    this.searchTerm = '';
    this.deferredInstallPrompt = null;

    this.initNavigation();
    this.initSalesPage();
    this.initSettingsPage();
    this.initModal();
    this.initInstallBanner();

    this.renderSalesList();
    this.renderReports();
    this.applySettingsToggles();
  }

  // ===== التنقل بين الصفحات =====
  initNavigation() {
    document.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const page = btn.getAttribute('data-page');
        this.goToPage(page);
      });
    });
  }

  goToPage(page) {
    document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));

    const pageEl = document.querySelector(`#page-${page}`);
    const navBtn = document.querySelector(`.nav-btn[data-page="${page}"]`);
    if (pageEl) pageEl.classList.add('active');
    if (navBtn) navBtn.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (page === 'sales') this.renderSalesList();
    if (page === 'reports') this.renderReports();
    if (page === 'dashboard' && window.app) window.app.renderDashboard();
  }

  // ===== صفحة المبيعات: فلاتر وبحث =====
  initSalesPage() {
    document.querySelectorAll('.filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentFilter = chip.getAttribute('data-filter');
        this.renderSalesList();
      });
    });

    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.searchTerm = searchInput.value.trim().toLowerCase();
        this.renderSalesList();
      });
    }
  }

  getFilteredSales() {
    if (!window.app) return [];
    let sales = [...window.app.sales];

    const now = new Date();
    if (this.currentFilter === 'today') {
      sales = sales.filter((s) => new Date(s.date).toDateString() === now.toDateString());
    } else if (this.currentFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      sales = sales.filter((s) => new Date(s.date) >= weekAgo);
    } else if (this.currentFilter === 'month') {
      sales = sales.filter((s) => {
        const d = new Date(s.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }

    if (this.searchTerm) {
      sales = sales.filter(
        (s) =>
          s.productName.toLowerCase().includes(this.searchTerm) ||
          s.customerName.toLowerCase().includes(this.searchTerm)
      );
    }

    return sales;
  }

  renderSalesList() {
    const container = document.querySelector('#sales-list-container');
    if (!container || !window.app) return;

    const sales = this.getFilteredSales();

    if (sales.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-text">لا توجد مبيعات</div>
        </div>`;
      return;
    }

    container.innerHTML = sales
      .map(
        (sale) => `
      <div class="sale-card" data-sale-id="${sale.id}">
        <div class="sale-card-header">
          <div class="sale-avatar">${window.app.getProductIcon(sale.productId)}</div>
          <div class="sale-info">
            <div class="sale-product">${window.app.escapeHtml(sale.productName)}</div>
            <div class="sale-customer">${window.app.escapeHtml(sale.customerName)} · ${this.formatDate(sale.date)}</div>
          </div>
          <div class="sale-amounts">
            <div class="sale-price">${window.app.formatCurrency(sale.totalPrice)}</div>
            <div class="sale-profit">+${window.app.formatCurrency(sale.profit)}</div>
          </div>
        </div>
        <div class="sale-card-body">
          <div class="detail-grid">
            <div class="detail-item">
              <div class="detail-label">الكمية</div>
              <div class="detail-value">${sale.quantity}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">سعر الوحدة</div>
              <div class="detail-value">${window.app.formatCurrency(sale.unitPrice)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">التكلفة الإجمالية</div>
              <div class="detail-value">${window.app.formatCurrency(sale.totalCost)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">الهامش</div>
              <div class="detail-value"><span class="badge badge-green">${((sale.profit / sale.totalPrice) * 100).toFixed(1)}%</span></div>
            </div>
          </div>
          ${sale.notes ? `<div class="detail-item" style="margin-top:10px;"><div class="detail-label">ملاحظات</div><div class="detail-value">${window.app.escapeHtml(sale.notes)}</div></div>` : ''}
          <div class="card-actions">
            <button class="btn-icon danger" data-action="delete" data-sale-id="${sale.id}">🗑️ حذف</button>
          </div>
        </div>
      </div>`
      )
      .join('');

    container.querySelectorAll('.sale-card-header').forEach((header) => {
      header.addEventListener('click', () => {
        const body = header.nextElementSibling;
        if (body) body.classList.toggle('open');
      });
    });

    container.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const saleId = btn.getAttribute('data-sale-id');
        if (confirm('هل تريد حذف هذه المبيعة؟')) {
          window.app.deleteSale(saleId);
          this.renderSalesList();
          this.renderReports();
          window.app.showToast('تم حذف المبيعة', 'success');
        }
      });
    });
  }

  formatDate(isoStr) {
    const d = new Date(isoStr);
    return d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
  }

  // ===== التقارير =====
  renderReports() {
    if (!window.app) return;

    const topProducts = window.app.getTopProducts(5);
    const topProductsEl = document.querySelector('#top-products-list');
    if (topProductsEl) {
      if (topProducts.length === 0) {
        topProductsEl.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);">لا توجد بيانات بعد</div>`;
      } else {
        topProductsEl.innerHTML = topProducts
          .map((p, i) => {
            const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-other';
            return `
            <div class="top-product-item">
              <div class="rank-badge ${rankClass}">${i + 1}</div>
              <div class="tp-info">
                <div class="tp-name">${window.app.escapeHtml(p.name)}</div>
                <div class="tp-count">${p.count} مبيعة</div>
              </div>
              <div class="tp-revenue">${window.app.formatCurrency(p.revenue)}</div>
            </div>`;
          })
          .join('');
      }
    }

    const topCustomers = window.app.getTopCustomers(5);
    const topCustomersEl = document.querySelector('#top-customers-list');
    if (topCustomersEl) {
      if (topCustomers.length === 0) {
        topCustomersEl.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);">لا توجد بيانات بعد</div>`;
      } else {
        topCustomersEl.innerHTML = topCustomers
          .map((c, i) => {
            const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-other';
            return `
            <div class="top-product-item">
              <div class="rank-badge ${rankClass}">${i + 1}</div>
              <div class="tp-info">
                <div class="tp-name">${window.app.escapeHtml(c.name)}</div>
                <div class="tp-count">${c.count} عملية شراء</div>
              </div>
              <div class="tp-revenue">${window.app.formatCurrency(c.revenue)}</div>
            </div>`;
          })
          .join('');
      }
    }

    const dailyStats = window.app.getDailySalesStats(7);
    const dailyEl = document.querySelector('#daily-stats-chart');
    if (dailyEl) {
      const maxRevenue = Math.max(...dailyStats.map((d) => d.revenue), 1);
      dailyEl.innerHTML = dailyStats
        .map((d) => {
          const widthPct = Math.round((d.revenue / maxRevenue) * 100);
          return `
          <div class="bar-row">
            <div class="bar-label">${d.label}</div>
            <div class="bar-track"><div class="bar-fill blue" style="width:${widthPct}%"></div></div>
            <div class="bar-value">${window.app.formatCurrency(d.revenue)}</div>
          </div>`;
        })
        .join('');
    }
  }

  // ===== الإعدادات =====
  initSettingsPage() {
    document.querySelectorAll('.toggle-switch').forEach((toggle, index) => {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('on');
        if (!window.app) return;
        if (index === 0) {
          window.app.settings.darkMode = toggle.classList.contains('on');
        } else if (index === 1) {
          window.app.settings.autoLock = toggle.classList.contains('on');
        }
        window.app.persistAll();
      });
    });

    const updatePinBtn = document.querySelector('#btn-update-pin');
    if (updatePinBtn) {
      updatePinBtn.addEventListener('click', () => this.showUpdatePinModal());
    }

    const lockBtn = document.querySelector('#btn-lock');
    if (lockBtn) {
      lockBtn.addEventListener('click', () => {
        if (window.app) window.app.lockNow();
      });
    }

    const exportBtn = document.querySelector('#btn-export');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData());
    }

    const importBtn = document.querySelector('#btn-import');
    if (importBtn) {
      importBtn.addEventListener('click', () => this.importData());
    }

    const clearBtn = document.querySelector('#btn-clear-data');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearAllData());
    }
  }

  applySettingsToggles() {
    if (!window.app) return;
    const toggles = document.querySelectorAll('.toggle-switch');
    if (toggles[0]) toggles[0].classList.toggle('on', !!window.app.settings.darkMode);
    if (toggles[1]) toggles[1].classList.toggle('on', !!window.app.settings.autoLock);
  }

  showUpdatePinModal() {
    const content = `
      <div class="form-group">
        <label class="form-label">🔐 الرمز الحالي</label>
        <input type="password" id="current-pin" class="form-input" maxlength="4" placeholder="••••">
      </div>
      <div class="form-group">
        <label class="form-label">🆕 الرمز الجديد</label>
        <input type="password" id="new-pin" class="form-input" maxlength="4" placeholder="••••">
      </div>
      <div class="form-group">
        <label class="form-label">✅ تأكيد الرمز الجديد</label>
        <input type="password" id="confirm-pin" class="form-input" maxlength="4" placeholder="••••">
      </div>
      <button class="btn-primary" id="save-pin-btn">حفظ الرمز الجديد</button>
    `;
    this.openModal('تحديث الرمز السري', content);

    setTimeout(() => {
      const saveBtn = document.querySelector('#save-pin-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          const current = document.querySelector('#current-pin').value;
          const next = document.querySelector('#new-pin').value;
          const confirm = document.querySelector('#confirm-pin').value;

          if (current !== window.app.getPin()) {
            window.app.showToast('الرمز الحالي غير صحيح', 'error');
            return;
          }
          if (next.length !== 4 || !/^\d{4}$/.test(next)) {
            window.app.showToast('الرمز الجديد يجب أن يكون 4 أرقام', 'error');
            return;
          }
          if (next !== confirm) {
            window.app.showToast('الرمزان غير متطابقين', 'error');
            return;
          }

          window.app.setPin(next);
          window.app.showToast('تم تحديث الرمز بنجاح', 'success');
          this.closeModal();
        });
      }
    }, 0);
  }

  exportData() {
    if (!window.app) return;
    const data = {
      products: window.app.products,
      customers: window.app.customers,
      sales: window.app.sales,
      settings: window.app.settings,
      exportedAt: new Date().toISOString(),
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `techsales_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    window.app.showToast('تم تصدير البيانات', 'success');
  }

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.products) window.app.products = data.products;
          if (data.customers) window.app.customers = data.customers;
          if (data.sales) window.app.sales = data.sales;
          if (data.settings) window.app.settings = { ...window.app.settings, ...data.settings };
          window.app.persistAll();
          window.app.renderDashboard();
          this.renderSalesList();
          this.renderReports();
          this.applySettingsToggles();
          window.app.showToast('تم استيراد البيانات بنجاح', 'success');
        } catch (err) {
          window.app.showToast('ملف غير صالح', 'error');
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  clearAllData() {
    if (!confirm('هل أنت متأكد؟ سيتم حذف جميع البيانات بشكل نهائي.')) return;
    if (!window.app) return;
    window.app.sales = [];
    window.app.products.forEach((p) => (p.stock = 0));
    window.app.persistAll();
    window.app.renderDashboard();
    this.renderSalesList();
    this.renderReports();
    window.app.showToast('تم حذف جميع البيانات', 'success');
  }

  // ===== النافذة المنبثقة (Modal) =====
  initModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (!overlay) return;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeModal();
    });
  }

  openModal(title, contentHtml) {
    const overlay = document.querySelector('.modal-overlay');
    const titleEl = document.querySelector('.modal-title');
    const contentEl = document.querySelector('#modal-content');
    if (!overlay || !titleEl || !contentEl) return;

    titleEl.textContent = title;
    contentEl.innerHTML = contentHtml;
    overlay.classList.add('open');
  }

  closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  showSaleDetails(saleId) {
    if (!window.app) return;
    const sale = window.app.sales.find((s) => s.id === saleId);
    if (!sale) return;

    const content = `
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">المنتج</div>
          <div class="detail-value">${window.app.escapeHtml(sale.productName)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">العميل</div>
          <div class="detail-value">${window.app.escapeHtml(sale.customerName)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">الكمية</div>
          <div class="detail-value">${sale.quantity}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">السعر الإجمالي</div>
          <div class="detail-value">${window.app.formatCurrency(sale.totalPrice)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">الربح</div>
          <div class="detail-value"><span class="badge badge-green">${window.app.formatCurrency(sale.profit)}</span></div>
        </div>
        <div class="detail-item">
          <div class="detail-label">التاريخ</div>
          <div class="detail-value">${this.formatDate(sale.date)}</div>
        </div>
      </div>
      ${sale.notes ? `<div class="detail-item" style="margin-top:14px;"><div class="detail-label">ملاحظات</div><div class="detail-value">${window.app.escapeHtml(sale.notes)}</div></div>` : ''}
    `;
    this.openModal('تفاصيل المبيعة', content);
  }

  // ===== شعار تثبيت التطبيق (PWA) =====
  initInstallBanner() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      this.showInstallBanner();
    });

    window.addEventListener('appinstalled', () => {
      this.hideInstallBanner();
    });
  }

  showInstallBanner() {
    if (document.querySelector('.install-banner')) return;
    const banner = document.createElement('div');
    banner.className = 'install-banner';
    banner.innerHTML = `
      <div class="install-banner-text">
        <strong>ثبّت التطبيق</strong>
        احصل على تجربة أسرع وأوفلاين
      </div>
      <button class="btn-install">تثبيت</button>
    `;
    const content = document.querySelector('.content');
    if (content) content.insertBefore(banner, content.firstChild);

    banner.querySelector('.btn-install').addEventListener('click', async () => {
      if (this.deferredInstallPrompt) {
        this.deferredInstallPrompt.prompt();
        await this.deferredInstallPrompt.userChoice;
        this.deferredInstallPrompt = null;
        this.hideInstallBanner();
      }
    });
  }

  hideInstallBanner() {
    const banner = document.querySelector('.install-banner');
    if (banner) banner.remove();
  }
}

let uiController;
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    uiController = new UIController();
    window.uiController = uiController;
  }, 0);
});
