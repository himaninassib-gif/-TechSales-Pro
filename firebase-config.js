/**
 * TechSales Pro - إعدادات Firebase
 * للمزامنة السحابية واحتفظ البيانات
 */

// ملاحظة: استبدل بيانات اعتماد Firebase الخاصة بك
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
  measurementId: 'YOUR_MEASUREMENT_ID'
};

class FirebaseManager {
  constructor() {
    this.isConfigured = false;
    this.initFirebase();
  }

  initFirebase() {
    // تحقق من أن بيانات اعتماد Firebase تم ملؤها
    if (firebaseConfig.apiKey === 'YOUR_API_KEY') {
      console.log('Firebase not configured. Using local storage only.');
      return;
    }

    // سيتم تحميل Firebase SDK من CDN في index.html
    this.isConfigured = true;
  }

  // حفظ البيانات في السحابة
  async saveToCloud() {
    if (!this.isConfigured || !firebase.auth().currentUser) {
      console.log('Firebase not available or user not logged in');
      return;
    }

    try {
      const db = firebase.firestore();
      const userId = firebase.auth().currentUser.uid;

      const data = {
        products: app.products,
        customers: app.customers,
        sales: app.sales,
        settings: app.settings,
        lastSync: new Date().toISOString(),
      };

      await db.collection('users').doc(userId).set(data);
      app.showToast('تم حفظ البيانات في السحابة', 'success');
    } catch (error) {
      console.error('Error saving to cloud:', error);
      app.showToast('خطأ في حفظ البيانات في السحابة', 'error');
    }
  }

  // تحميل البيانات من السحابة
  async loadFromCloud() {
    if (!this.isConfigured || !firebase.auth().currentUser) {
      console.log('Firebase not available or user not logged in');
      return;
    }

    try {
      const db = firebase.firestore();
      const userId = firebase.auth().currentUser.uid;

      const doc = await db.collection('users').doc(userId).get();
      
      if (doc.exists) {
        const data = doc.data();
        app.products = data.products || [];
        app.customers = data.customers || [];
        app.sales = data.sales || [];
        app.settings = { ...app.settings, ...data.settings };
        app.showToast('تم تحميل البيانات من السحابة', 'success');
      }
    } catch (error) {
      console.error('Error loading from cloud:', error);
      app.showToast('خطأ في تحميل البيانات من السحابة', 'error');
    }
  }

  // تسجيل دخول المستخدم
  async login(email, password) {
    if (!this.isConfigured) {
      app.showToast('خدمة السحابة غير متاحة', 'error');
      return false;
    }

    try {
      const auth = firebase.auth();
      await auth.signInWithEmailAndPassword(email, password);
      app.showToast('تم تسجيل الدخول بنجاح', 'success');
      await this.loadFromCloud();
      return true;
    } catch (error) {
      app.showToast('خطأ في تسجيل الدخول: ' + error.message, 'error');
      return false;
    }
  }

  // إنشاء حساب جديد
  async signup(email, password) {
    if (!this.isConfigured) {
      app.showToast('خدمة السحابة غير متاحة', 'error');
      return false;
    }

    try {
      const auth = firebase.auth();
      await auth.createUserWithEmailAndPassword(email, password);
      app.showToast('تم إنشاء الحساب بنجاح', 'success');
      return true;
    } catch (error) {
      app.showToast('خطأ في إنشاء الحساب: ' + error.message, 'error');
      return false;
    }
  }

  // تسجيل الخروج
  async logout() {
    if (!this.isConfigured) {
      return;
    }

    try {
      const auth = firebase.auth();
      await auth.signOut();
      app.showToast('تم تسجيل الخروج', 'success');
      return true;
    } catch (error) {
      app.showToast('خطأ في تسجيل الخروج', 'error');
      return false;
    }
  }

  // المراقبة المستمرة للبيانات
  watchSalesData() {
    if (!this.isConfigured || !firebase.auth().currentUser) {
      return;
    }

    const db = firebase.firestore();
    const userId = firebase.auth().currentUser.uid;

    db.collection('users').doc(userId).onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data();
        // تحديث البيانات المحلية إذا تم تغييرها من جهاز آخر
        app.sales = data.sales || [];
        app.renderDashboard();
      }
    });
  }

  // مزامنة دورية
  enableAutoSync(intervalMs = 300000) { // كل 5 دقائق
    setInterval(async () => {
      if (this.isConfigured && firebase.auth().currentUser) {
        await this.saveToCloud();
      }
    }, intervalMs);
  }
}

// تهيئة مدير Firebase
let firebaseManager;
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    firebaseManager = new FirebaseManager();
    firebaseManager.enableAutoSync();
  }, 500);
});
