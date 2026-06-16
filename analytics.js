/**
 * TechSales Pro - التحليلات والإحصائيات
 * تتبع الأداء والتنبيهات
 */

class Analytics {
  constructor() {
    this.events = [];
    this.alerts = [];
    this.setupTracking();
  }

  setupTracking() {
    // تتبع إضافة مبيعة جديدة
    const originalAddSale = app.addSale.bind(app);
    app.addSale = (saleData) => {
      const result = originalAddSale(saleData);
      if (result) {
        this.trackEvent('sale_added', { productId: saleData.productId });
      }
      return result;
    };

    // تتبع الأخطاء
    window.addEventListener('error', (e) => {
      this.trackEvent('error', { message: e.message });
    });
  }

  // تتبع الأحداث
  trackEvent(eventName, data = {}) {
    const event = {
      name: eventName,
      timestamp: new Date().toISOString(),
      data: data,
    };

    this.events.push(event);

    // حفظ الأحداث كل 10 أحداث
    if (this.events.length % 10 === 0) {
      this.saveEvents();
    }

    // إرسال إلى خادم تحليلات (اختياري)
    this.sendToServer(event);
  }

  // حفظ الأحداث
  saveEvents() {
    localStorage.setItem('techsales_events', JSON.stringify(this.events));
  }

  // إرسال الأحداث إلى الخادم
  async sendToServer(event) {
    // يمكنك إضافة رابط خادم التحليلات هنا
    // const response = await fetch('https://your-analytics-server.com/track', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event)
    // });
  }

  // إنشاء تنبيهات ذكية
  generateAlerts() {
    const alerts = [];

    // تحذير: منتجات بمخزون منخفض
    app.products.forEach(product => {
      if (product.stock < 2) {
        alerts.push({
          type: 'warning',
          title: 'مخزون منخفض',
          message: `${product.name} المخزون متبقي: ${product.stock}`,
          icon: '⚠️',
          timestamp: new Date().toISOString(),
        });
      }
    });

    // إحصائية: أعلى المنتجات بيعاً
    const topProducts = app.getTopProducts(1);
    if (topProducts.length > 0) {
      const topProduct = topProducts[0];
      alerts.push({
        type: 'success',
        title: 'أفضل منتج',
        message: `${topProduct.name} بيع ${topProduct.count} مرات`,
        icon: '⭐',
        timestamp: new Date().toISOString(),
      });
    }

    // تحذير: عدم وجود مبيعات اليوم
    const today = new Date().toDateString();
    const todaySales = app.sales.filter(s => new Date(s.date).toDateString() === today);
    if (todaySales.length === 0 && new Date().getHours() > 14) {
      alerts.push({
        type: 'info',
        title: 'لا توجد مبيعات اليوم',
        message: 'لم يتم تسجيل أي مبيعات حتى الآن',
        icon: '📊',
        timestamp: new Date().toISOString(),
      });
    }

    this.alerts = alerts;
    return alerts;
  }

  // عرض الإحصائيات
  displayAlerts() {
    const alertsContainer = document.querySelector('#alerts-container');
    if (!alertsContainer) return;

    const alerts = this.generateAlerts();
    
    if (alerts.length === 0) {
      alertsContainer.innerHTML = '';
      return;
    }

    alertsContainer.innerHTML = alerts.map(alert => `
      <div class="ai-insight ${alert.type === 'warning' ? 'warning' : alert.type === 'error' ? 'danger' : alert.type === 'success' ? 'success' : ''}">
        <div class="ai-insight-title">${alert.icon} ${alert.title}</div>
        <div class="ai-insight-body">${alert.message}</div>
      </div>
    `).join('');
  }

  // إحصائيات الأداء
  getPerformanceMetrics() {
    const kpis = app.getKPIs();
    const topProducts = app.getTopProducts();
    const dailyStats = app.getDailySalesStats();

    const metrics = {
      kpis,
      topProducts,
      dailyStats,
      performance: {
        avgSaleValue: kpis.averageOrderValue,
        profitMargin: kpis.profitMargin,
        todaySales: app.sales.filter(s => 
          new Date(s.date).toDateString() === new Date().toDateString()
        ).length,
        monthSales: app.sales.filter(s => {
          const saleDate = new Date(s.date);
          const now = new Date();
          return saleDate.getMonth() === now.getMonth() && 
                 saleDate.getFullYear() === now.getFullYear();
        }).length,
      },
    };

    return metrics;
  }

  // الإحصائيات المقارنة
  compareMetrics(metric1, metric2) {
    const diff = metric2 - metric1;
    const percentChange = metric1 !== 0 ? ((diff / metric1) * 100).toFixed(2) : 0;
    
    return {
      difference: diff,
      percentChange: percentChange,
      trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat',
    };
  }

  // الإحصائيات الموسمية
  getSeasonalTrends() {
    const monthlyStats = {};
    
    app.sales.forEach(sale => {
      const date = new Date(sale.date);
      const month = date.toLocaleString('ar-SA', { month: 'long' });
      
      if (!monthlyStats[month]) {
        monthlyStats[month] = { revenue: 0, profit: 0, count: 0 };
      }
      
      monthlyStats[month].revenue += sale.totalPrice;
      monthlyStats[month].profit += sale.profit;
      monthlyStats[month].count += 1;
    });

    return monthlyStats;
  }

  // توقعات المبيعات (بسيطة)
  predictNextMonth() {
    const currentMonth = new Date().getMonth();
    const lastMonthSales = app.sales.filter(sale => {
      const saleMonth = new Date(sale.date).getMonth();
      return saleMonth === (currentMonth === 0 ? 11 : currentMonth - 1);
    });

    const lastMonthRevenue = lastMonthSales.reduce((sum, s) => sum + s.totalPrice, 0);
    const trend = lastMonthRevenue > 0 ? lastMonthRevenue * 1.1 : 0; // نمو متوقع 10%

    return {
      predictedRevenue: Math.round(trend),
      predictedProfit: Math.round(trend * 0.3),
      predictedSalesCount: Math.round(lastMonthSales.length * 1.1),
    };
  }

  // تقرير شامل
  generateReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      kpis: app.getKPIs(),
      topProducts: app.getTopProducts(),
      topCustomers: app.getTopCustomers(),
      performance: this.getPerformanceMetrics().performance,
      seasonalTrends: this.getSeasonalTrends(),
      forecast: this.predictNextMonth(),
      alerts: this.generateAlerts(),
    };

    return report;
  }

  // تصدير التقرير
  exportReport() {
    const report = this.generateReport();
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `techsales_report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// تهيئة التحليلات
let analytics;
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (window.app) {
      analytics = new Analytics();
      analytics.displayAlerts();
      
      // تحديث التنبيهات كل دقيقة
      setInterval(() => {
        analytics.displayAlerts();
      }, 60000);
    }
  }, 300);
});
