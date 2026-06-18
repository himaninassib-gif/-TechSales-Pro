/**
 * TechSales Pro - معالج نموذج إضافة المبيعة
 * تعبئة القوائم، حساب الربح المباشر، وإرسال النموذج
 */

class FormHandler {
  constructor() {
    this.form = document.querySelector('#add-sale-form');
    if (!this.form) return;

    this.productSelect = this.form.querySelector('select[name="productId"]');
    this.customerSelect = this.form.querySelector('select[name="customerId"]');
    this.quantityInput = this.form.querySelector('input[name="quantity"]');
    this.notesInput = this.form.querySelector('textarea[name="notes"]');

    this.previewCost = this.form.parentElement.querySelector('.profit-preview .pp-value.yellow');
    this.previewSale = this.form.parentElement.querySelector('.profit-preview .pp-value.blue');
    this.previewProfit = this.form.parentElement.querySelector('.profit-preview .pp-value.green');
    this.previewMargin = this.form.parentElement.querySelectorAll('.profit-preview .pp-value')[3];

    this.init();
  }

  init() {
    this.populateProducts();
    this.populateCustomers();

    this.productSelect.addEventListener('change', () => this.updatePreview());
    this.quantityInput.addEventListener('input', () => this.updatePreview());

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // إعادة التعبئة عند الانتقال لصفحة الإضافة (في حال تغيّر المخزون)
    document.querySelectorAll('.nav-btn[data-page="add"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.populateProducts();
        this.populateCustomers();
        this.updatePreview();
      });
    });
  }

  populateProducts() {
    const products = window.app ? window.app.products : [];
    const current = this.productSelect.value;
    this.productSelect.innerHTML = '<option value="">اختر المنتج</option>';
    products.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.icon || '📦'} ${p.name} ${p.stock === 0 ? '(غير متوفر)' : `(متبقي: ${p.stock})`}`;
      if (p.stock === 0) opt.disabled = true;
      this.productSelect.appendChild(opt);
    });
    if (current) this.productSelect.value = current;
  }

  populateCustomers() {
    const customers = window.app ? window.app.customers : [];
    const current = this.customerSelect.value;
    this.customerSelect.innerHTML = '<option value="">اختر العميل</option>';
    customers.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      this.customerSelect.appendChild(opt);
    });
    if (current) this.customerSelect.value = current;
  }

  updatePreview() {
    if (!window.app) return;
    const product = window.app.products.find((p) => p.id === this.productSelect.value);
    const quantity = parseInt(this.quantityInput.value, 10) || 0;

    if (!product || quantity <= 0) {
      this.previewCost.textContent = '-';
      this.previewSale.textContent = '-';
      this.previewProfit.textContent = '-';
      if (this.previewMargin) this.previewMargin.textContent = '-';
      return;
    }

    const totalCost = product.cost * quantity;
    const totalSale = product.price * quantity;
    const profit = totalSale - totalCost;
    const margin = totalSale > 0 ? ((profit / totalSale) * 100).toFixed(1) : 0;

    this.previewCost.textContent = window.app.formatCurrency(totalCost);
    this.previewSale.textContent = window.app.formatCurrency(totalSale);
    this.previewProfit.textContent = window.app.formatCurrency(profit);
    if (this.previewMargin) this.previewMargin.textContent = margin + '%';
  }

  handleSubmit() {
    if (!window.app) return;

    const productId = this.productSelect.value;
    const customerId = this.customerSelect.value;
    const quantity = parseInt(this.quantityInput.value, 10) || 1;
    const notes = this.notesInput.value;

    if (!productId || !customerId) {
      window.app.showToast('يرجى اختيار المنتج والعميل', 'error');
      return;
    }

    const success = window.app.addSale({ productId, customerId, quantity, notes });

    if (success) {
      window.app.showToast('تم تسجيل المبيعة بنجاح ✅', 'success');
      this.form.reset();
      this.populateProducts();
      this.updatePreview();

      // الانتقال إلى لوحة التحكم بعد الإضافة
      if (window.uiController) {
        window.uiController.goToPage('dashboard');
      }
    }
  }
}

let formHandler;
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    formHandler = new FormHandler();
    window.formHandler = formHandler;
  }, 0);
});
