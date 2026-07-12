const fs = require('fs');
const path = require('path');

// 1. SuperAdminPages.jsx
const pagesPath = path.join(__dirname, 'VidyaBarta/frontend/src/Components/SuperAdmin/SuperAdminPages.jsx');
let pagesContent = fs.readFileSync(pagesPath, 'utf8');

if (!pagesContent.includes("export { RevenueSettlements }")) {
  pagesContent = pagesContent.replace(
    "export const Subscription = () => <PageWrapper title=\"Subscription\"><p>View active subscriptions.</p></PageWrapper>;",
    "export const Subscription = () => <PageWrapper title=\"Subscription\"><p>View active subscriptions.</p></PageWrapper>;\nexport { RevenueSettlements } from './RevenueSettlements';"
  );
  pagesContent = pagesContent.replace(
    "export const SubscriptionTransaction = () => <PageWrapper title=\"Subscription Transaction\"><p>View subscription transaction history.</p></PageWrapper>;",
    "// export const SubscriptionTransaction"
  );
  fs.writeFileSync(pagesPath, pagesContent, 'utf8');
}

// 2. SuperAdminLayout.jsx
const layoutPath = path.join(__dirname, 'VidyaBarta/frontend/src/Components/SuperAdmin/SuperAdminLayout.jsx');
let layoutContent = fs.readFileSync(layoutPath, 'utf8');

if (!layoutContent.includes("Revenue & Settlements")) {
  layoutContent = layoutContent.replace(
    '<SidebarItem to="/superadmin/subscription-transaction" icon={FiDollarSign} label="Subscription Transaction" />',
    '<SidebarItem to="/superadmin/revenue" icon={FiDollarSign} label="Revenue & Settlements" />'
  );
  fs.writeFileSync(layoutPath, layoutContent, 'utf8');
}

// 3. App.jsx
const appPath = path.join(__dirname, 'VidyaBarta/frontend/src/App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

if (!appContent.includes('path="revenue"')) {
  appContent = appContent.replace(
    '<Route path="subscription-transaction" element={<SA.SubscriptionTransaction />} />',
    '<Route path="revenue" element={<SA.RevenueSettlements />} />'
  );
  fs.writeFileSync(appPath, appContent, 'utf8');
}

console.log('Super Admin Revenue patched successfully!');
