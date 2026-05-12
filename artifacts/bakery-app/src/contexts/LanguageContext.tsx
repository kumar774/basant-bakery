import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'hi';

type OrderShareData = {
  customer_name: string;
  phone_number: string;
  item_name: string;
  category: string;
  quantity: number;
  total_amount: number;
  advance_payment: number;
  remaining_balance: number;
  pickup_date: string;
  order_status: string;
  payment_status: string;
  notes?: string | null;
};

function buildWhatsApp(
  header: string,
  footer: string,
  o: OrderShareData
): string {
  const isPaid = o.payment_status === 'Paid' || Number(o.remaining_balance) <= 0;
  const total    = Number(o.total_amount).toFixed(0);
  const advance  = Number(o.advance_payment).toFixed(0);
  const balance  = Number(o.remaining_balance).toFixed(0);

  const paymentSection = isPaid
    ? `💰 Total: ₹${total}\n💳 Payment: ✅ Fully Paid`
    : Number(o.advance_payment) > 0
    ? `💰 Total: ₹${total}\n✅ Advance Paid: ₹${advance}\n⏳ Balance Due: ₹${balance}`
    : `💰 Total: ₹${total}\n💳 Payment: ⏳ Pending`;

  return [
    header,
    '',
    `👤 Customer: ${o.customer_name}`,
    `📞 Phone: ${o.phone_number}`,
    '',
    `🛒 Item: ${o.item_name} × ${o.quantity}`,
    `📦 Category: ${o.category}`,
    '',
    paymentSection,
    '',
    `📅 Pickup Date: ${o.pickup_date}`,
    `📋 Order Status: ${o.order_status}`,
    ...(o.notes ? [`📝 Notes: ${o.notes}`] : []),
    '',
    footer,
  ].join('\n');
}

function buildWhatsAppHi(o: OrderShareData): string {
  const isPaid = o.payment_status === 'Paid' || Number(o.remaining_balance) <= 0;
  const total   = Number(o.total_amount).toFixed(0);
  const advance = Number(o.advance_payment).toFixed(0);
  const balance = Number(o.remaining_balance).toFixed(0);

  const paymentSection = isPaid
    ? `💰 कुल: ₹${total}\n💳 भुगतान: ✅ पूरी तरह भुगतान`
    : Number(o.advance_payment) > 0
    ? `💰 कुल: ₹${total}\n✅ अग्रिम: ₹${advance}\n⏳ शेष: ₹${balance}`
    : `💰 कुल: ₹${total}\n💳 भुगतान: ⏳ बकाया`;

  return [
    '*🍞 बसंत बेकरी — ऑर्डर विवरण*',
    '',
    `👤 ग्राहक: ${o.customer_name}`,
    `📞 फोन: ${o.phone_number}`,
    '',
    `🛒 आइटम: ${o.item_name} × ${o.quantity}`,
    `📦 श्रेणी: ${o.category}`,
    '',
    paymentSection,
    '',
    `📅 पिकअप: ${o.pickup_date}`,
    `📋 स्थिति: ${o.order_status}`,
    ...(o.notes ? [`📝 नोट: ${o.notes}`] : []),
    '',
    '_बसंत बेकरी में आपका स्वागत है_ 🙏',
  ].join('\n');
}

const translations = {
  en: {
    appName: 'Basant Bakery',
    appTagline: 'Premium Bakery Management',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    dashboard: 'Dashboard',
    orders: 'Orders',
    newOrder: 'New Order',
    customers: 'Customers',
    analytics: 'Analytics',
    settings: 'Settings',
    signOut: 'Sign Out',
    signedInAs: 'Signed in as',
    todayOrders: "Today's Orders",
    pendingOrders: 'Pending Orders',
    pickupToday: 'Pickup Today',
    completed: 'Completed',
    totalRevenue: 'Total Revenue',
    thisMonth: 'This Month',
    pendingPayments: 'Pending Payments',
    totalCustomers: 'Total Customers',
    salesByCategory: 'Sales by Category',
    recentActivity: 'Recent Activity',
    noActivity: 'No recent activity yet',
    search: 'Search',
    searchOrders: 'Search customers, items...',
    searchCustomers: 'Search by name or phone...',
    filterStatus: 'Filter',
    allStatuses: 'All',
    export: 'Export',
    share: 'WhatsApp',
    edit: 'Edit Order',
    delete: 'Delete',
    markPaid: 'Mark as Paid',
    markReady: 'Mark as Ready',
    markCollected: 'Mark as Collected',
    markedReady: 'Order marked Ready',
    markedCollected: 'Order marked Collected',
    confirmDelete: 'Are you sure you want to delete this order?',
    noOrders: 'No orders found.',
    noCustomers: 'No customers found.',
    customer: 'Customer',
    item: 'Item',
    pickupDate: 'Pickup Date',
    amount: 'Amount',
    status: 'Status',
    payment: 'Payment',
    actions: 'Actions',
    customerName: 'Customer Name',
    phoneNumber: 'Phone Number',
    category: 'Category',
    itemName: 'Item Name',
    quantity: 'Quantity',
    totalAmount: 'Total Amount (₹)',
    advancePayment: 'Advance Paid (₹)',
    remainingBalance: 'Remaining Balance',
    orderStatus: 'Order Status',
    paymentStatus: 'Payment Status',
    notes: 'Notes (Optional)',
    specialInstructions: 'Any special instructions...',
    cancel: 'Cancel',
    createOrder: 'Create Order',
    updateOrder: 'Update Order',
    orderCreated: 'Order created successfully!',
    orderUpdated: 'Order updated successfully!',
    orderDeleted: 'Order deleted',
    markedPaid: 'Marked as Paid',
    failedCreate: 'Failed to create',
    failedUpdate: 'Failed to update',
    customerDetails: 'Customer Details',
    orderDetails: 'Order Details',
    paymentDelivery: 'Payment & Pickup',
    statusNotes: 'Status & Notes',
    autoPaymentNote: 'Payment status is computed automatically from amounts',
    appearance: 'Appearance',
    darkMode: 'Dark Mode',
    darkModeDesc: 'Toggle dark / light theme.',
    language: 'Language',
    languageDesc: 'Switch between English and Hindi.',
    totalOrders: 'Total Orders',
    totalSpent: 'Total Spent',
    lastOrder: 'Last Order',
    name: 'Name',
    phone: 'Phone',
    revenueOverTime: 'Revenue Over Time',
    revenueByCategory: 'Revenue by Category',
    ordersByCategory: 'Orders by Category',
    last7Days: 'Last 7 Days',
    last14Days: 'Last 14 Days',
    last30Days: 'Last 30 Days',
    balance: 'Balance',
    pending: 'Pending',
    inProgress: 'In Progress',
    ready: 'Ready',
    collected: 'Collected',
    cancelled: 'Cancelled',
    unpaid: 'Unpaid',
    partial: 'Partial',
    paid: 'Paid',
    editOrder: 'Edit Order',
    orderShareText: (o: OrderShareData) =>
      buildWhatsApp('*🍞 Basant Bakery — Order Details*', '_Thank you for choosing Basant Bakery!_ 🙏', o),
  },
  hi: {
    appName: 'बसंत बेकरी',
    appTagline: 'प्रीमियम बेकरी प्रबंधन',
    signIn: 'साइन इन',
    signUp: 'साइन अप',
    email: 'ईमेल',
    password: 'पासवर्ड',
    dashboard: 'डैशबोर्ड',
    orders: 'ऑर्डर',
    newOrder: 'नया ऑर्डर',
    customers: 'ग्राहक',
    analytics: 'विश्लेषण',
    settings: 'सेटिंग्स',
    signOut: 'साइन आउट',
    signedInAs: 'लॉगिन किया है',
    todayOrders: 'आज के ऑर्डर',
    pendingOrders: 'लंबित ऑर्डर',
    pickupToday: 'आज पिकअप',
    completed: 'पूर्ण',
    totalRevenue: 'कुल राजस्व',
    thisMonth: 'इस महीने',
    pendingPayments: 'बकाया भुगतान',
    totalCustomers: 'कुल ग्राहक',
    salesByCategory: 'श्रेणी अनुसार बिक्री',
    recentActivity: 'हाल की गतिविधि',
    noActivity: 'अभी कोई गतिविधि नहीं',
    search: 'खोजें',
    searchOrders: 'ग्राहक, आइटम खोजें...',
    searchCustomers: 'नाम या फोन से खोजें...',
    filterStatus: 'फ़िल्टर',
    allStatuses: 'सभी',
    export: 'निर्यात',
    share: 'व्हाट्सएप',
    edit: 'ऑर्डर बदलें',
    delete: 'हटाएं',
    markPaid: 'भुगतान किया',
    markReady: 'तैयार करें',
    markCollected: 'संग्रह किया',
    markedReady: 'ऑर्डर तैयार है',
    markedCollected: 'ऑर्डर संग्रह किया',
    confirmDelete: 'क्या आप इस ऑर्डर को हटाना चाहते हैं?',
    noOrders: 'कोई ऑर्डर नहीं मिला।',
    noCustomers: 'कोई ग्राहक नहीं मिला।',
    customer: 'ग्राहक',
    item: 'आइटम',
    pickupDate: 'पिकअप तारीख',
    amount: 'राशि',
    status: 'स्थिति',
    payment: 'भुगतान',
    actions: 'कार्रवाई',
    customerName: 'ग्राहक का नाम',
    phoneNumber: 'फोन नंबर',
    category: 'श्रेणी',
    itemName: 'आइटम का नाम',
    quantity: 'मात्रा',
    totalAmount: 'कुल राशि (₹)',
    advancePayment: 'अग्रिम भुगतान (₹)',
    remainingBalance: 'शेष राशि',
    orderStatus: 'ऑर्डर स्थिति',
    paymentStatus: 'भुगतान स्थिति',
    notes: 'नोट्स (वैकल्पिक)',
    specialInstructions: 'कोई विशेष निर्देश...',
    cancel: 'रद्द करें',
    createOrder: 'ऑर्डर बनाएं',
    updateOrder: 'ऑर्डर अपडेट करें',
    orderCreated: 'ऑर्डर सफलतापूर्वक बनाया गया!',
    orderUpdated: 'ऑर्डर सफलतापूर्वक अपडेट किया गया!',
    orderDeleted: 'ऑर्डर हटाया गया',
    markedPaid: 'भुगतान दर्ज हुआ',
    failedCreate: 'ऑर्डर बनाने में विफल',
    failedUpdate: 'अपडेट करने में विफल',
    customerDetails: 'ग्राहक विवरण',
    orderDetails: 'ऑर्डर विवरण',
    paymentDelivery: 'भुगतान और पिकअप',
    statusNotes: 'स्थिति और नोट्स',
    autoPaymentNote: 'भुगतान स्थिति राशि के आधार पर स्वतः सेट होती है',
    appearance: 'दिखावट',
    darkMode: 'डार्क मोड',
    darkModeDesc: 'थीम बदलें।',
    language: 'भाषा',
    languageDesc: 'अंग्रेजी और हिंदी के बीच स्विच करें।',
    totalOrders: 'कुल ऑर्डर',
    totalSpent: 'कुल खर्च',
    lastOrder: 'अंतिम ऑर्डर',
    name: 'नाम',
    phone: 'फोन',
    revenueOverTime: 'समय के साथ राजस्व',
    revenueByCategory: 'श्रेणी अनुसार राजस्व',
    ordersByCategory: 'श्रेणी अनुसार ऑर्डर',
    last7Days: 'पिछले 7 दिन',
    last14Days: 'पिछले 14 दिन',
    last30Days: 'पिछले 30 दिन',
    balance: 'शेष',
    pending: 'लंबित',
    inProgress: 'प्रगति में',
    ready: 'तैयार',
    collected: 'ले लिया',
    cancelled: 'रद्द',
    unpaid: 'अवैतनिक',
    partial: 'आंशिक',
    paid: 'भुगतान किया',
    editOrder: 'ऑर्डर संपादित करें',
    orderShareText: (o: OrderShareData) => buildWhatsAppHi(o),
  },
};

type Translations = typeof translations.en;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(
    (localStorage.getItem('lang') as Language) || 'en'
  );

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
