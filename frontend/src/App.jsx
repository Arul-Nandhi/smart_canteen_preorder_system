import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';

import Login         from './pages/Login';
import Register      from './pages/Register';
import Landing       from './pages/Landing';
import Menu          from './pages/Menu';
import Offers        from './pages/Offers';
import Cart          from './pages/Cart';
import OrderSuccess  from './pages/OrderSuccess';
import OrderHistory  from './pages/OrderHistory';
import QueueTracker  from './pages/QueueTracker';
import StudentDash   from './pages/StudentDashboard';
import KitchenDash   from './pages/KitchenDashboard';
import StaffDash     from './pages/StaffDashboard';
import AdminDash     from './pages/AdminDashboard';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminMenuPage from './pages/admin/AdminMenuPage';
import AdminSlotsPage from './pages/admin/AdminSlotsPage';
import AdminStaffPage from './pages/admin/AdminStaffPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminQueuePage from './pages/admin/AdminQueuePage';
import AdminImagesPage from './pages/admin/AdminImagesPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminComboPage from './pages/admin/AdminComboPage';
import AdminFeedbackPage from './pages/admin/AdminFeedbackPage';
import StaffOperations from './pages/staff/StaffOperations';
import QueueManagement from './pages/staff/QueueManagement';
import SlotManagement from './pages/staff/SlotManagement';
import StaffMenuPage from './pages/staff/StaffMenuPage';
import StaffOrdersPage from './pages/staff/StaffOrdersPage';
import StaffStatusPage from './pages/staff/StaffStatusPage';
import StaffNotificationsPage from './pages/staff/StaffNotificationsPage';
import StaffSettingsPage from './pages/staff/StaffSettingsPage';
import StaffComboPage from './pages/staff/StaffComboPage';
import StaffBillingPage from './pages/staff/StaffBillingPage';
import Profile       from './pages/Profile';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'var(--surface)',
                  color: 'var(--text-1)',
                  border: '1px solid var(--border)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                },
                success: { iconTheme: { primary: '#14D1B2', secondary: '#0B0F14' } },
                error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              }}
            />
            <Routes>
              <Route path="/"         element={<Landing />} />
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route path="/menu"          element={<ProtectedRoute><Menu /></ProtectedRoute>} />
              <Route path="/offers"        element={<ProtectedRoute><Offers /></ProtectedRoute>} />
              <Route path="/cart"          element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
              <Route path="/orders"        element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
              <Route path="/queue"         element={<ProtectedRoute><QueueTracker /></ProtectedRoute>} />
              <Route path="/dashboard"     element={<ProtectedRoute><StudentDash /></ProtectedRoute>} />
              <Route path="/profile"       element={<ProtectedRoute><Profile /></ProtectedRoute>} />

              <Route path="/kitchen" element={
                <ProtectedRoute roles={['staff','admin']}><KitchenDash /></ProtectedRoute>
              }/>
              <Route path="/staff" element={
                <ProtectedRoute roles={['staff','admin']}><StaffDash /></ProtectedRoute>
              }/>
              <Route path="/staff/operations" element={
                <ProtectedRoute roles={['staff','admin']}><StaffOperations /></ProtectedRoute>
              }/>
              <Route path="/staff/billing" element={
                <ProtectedRoute roles={['staff','admin']}><StaffBillingPage /></ProtectedRoute>
              }/>
              <Route path="/staff/orders" element={
                <ProtectedRoute roles={['staff','admin']}><StaffOrdersPage /></ProtectedRoute>
              }/>
              <Route path="/staff/queue" element={
                <ProtectedRoute roles={['staff','admin']}><QueueManagement /></ProtectedRoute>
              }/>
              <Route path="/staff/slots" element={
                <ProtectedRoute roles={['staff','admin']}><SlotManagement /></ProtectedRoute>
              }/>
              <Route path="/staff/menu" element={
                <ProtectedRoute roles={['staff','admin']}><StaffMenuPage /></ProtectedRoute>
              }/>
              <Route path="/staff/combo" element={
                <ProtectedRoute roles={['staff','admin']}><StaffComboPage /></ProtectedRoute>
              }/>
              <Route path="/staff/status" element={
                <ProtectedRoute roles={['staff','admin']}><StaffStatusPage /></ProtectedRoute>
              }/>
              <Route path="/staff/notifications" element={
                <ProtectedRoute roles={['staff','admin']}><StaffNotificationsPage /></ProtectedRoute>
              }/>
              <Route path="/staff/settings" element={
                <ProtectedRoute roles={['staff','admin']}><StaffSettingsPage /></ProtectedRoute>
              }/>

              <Route path="/admin" element={
                <ProtectedRoute roles={['admin']}><AdminDash /></ProtectedRoute>
              }/>
              <Route path="/admin/orders" element={
                <ProtectedRoute roles={['admin']}><AdminOrdersPage /></ProtectedRoute>
              }/>
              <Route path="/admin/queue" element={
                <ProtectedRoute roles={['admin']}><AdminQueuePage /></ProtectedRoute>
              }/>
              <Route path="/admin/slots" element={
                <ProtectedRoute roles={['admin']}><AdminSlotsPage /></ProtectedRoute>
              }/>
              <Route path="/admin/menu" element={
                <ProtectedRoute roles={['admin']}><AdminMenuPage /></ProtectedRoute>
              }/>
              <Route path="/admin/images" element={
                <ProtectedRoute roles={['admin']}><AdminImagesPage /></ProtectedRoute>
              }/>
              <Route path="/admin/staff" element={
                <ProtectedRoute roles={['admin']}><AdminStaffPage /></ProtectedRoute>
              }/>
              <Route path="/admin/users" element={
                <ProtectedRoute roles={['admin']}><AdminUsersPage /></ProtectedRoute>
              }/>
              <Route path="/admin/analytics" element={
                <ProtectedRoute roles={['admin']}><AdminAnalyticsPage /></ProtectedRoute>
              }/>
              <Route path="/admin/notifications" element={
                <ProtectedRoute roles={['admin']}><AdminNotificationsPage /></ProtectedRoute>
              }/>
              <Route path="/admin/settings" element={
                <ProtectedRoute roles={['admin']}><AdminSettingsPage /></ProtectedRoute>
              }/>
              <Route path="/admin/combo" element={
                <ProtectedRoute roles={['admin']}><AdminComboPage /></ProtectedRoute>
              }/>
              <Route path="/admin/feedback" element={
                <ProtectedRoute roles={['admin']}><AdminFeedbackPage /></ProtectedRoute>
              }/>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
