import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { I18nextProvider } from "react-i18next";
import i18n from "./lib/i18n";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { StaffProtectedRoute } from "@/components/admin/StaffProtectedRoute";
import ScrollToTop from "@/components/layout/ScrollToTop";

const Index = lazy(() => import("./pages/Index"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Crafts = lazy(() => import("./pages/Crafts"));
const Cart = lazy(() => import("./pages/Cart"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

const Order = lazy(() => import("./pages/Order"));
const Auth = lazy(() => import("./pages/Auth"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancelled = lazy(() => import("./pages/PaymentCancelled"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));
const Wallet = lazy(() => import("./pages/Wallet"));
const DeliveryDashboard = lazy(() => import("./pages/DeliveryDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const StaffDashboard = lazy(() => import("./pages/StaffDashboard"));
const Contact = lazy(() => import("./pages/Contact"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Refund = lazy(() => import("./pages/Refund"));
const Shipping = lazy(() => import("./pages/Shipping"));
const FAQ = lazy(() => import("./pages/FAQ"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const DesignShowcase = lazy(() => import("./pages/DesignShowcase"));
const OfflineFallback = lazy(() => import("./pages/OfflineFallback"));

const queryClient = new QueryClient();

const NavigationHandler = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleBackButton = () => {
          if (location.pathname === '/') {
            // Potential exit logic here
          }
        };

        window.addEventListener('popstate', handleBackButton);
        return () => window.removeEventListener('popstate', handleBackButton);
    }, [location.pathname, navigate]);

    return null;
};

const App = () => (
  <I18nextProvider i18n={i18n}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <NotificationProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter
                future={{
                  v7_relativeSplatPath: true,
                  v7_startTransition: true,
                }}
              >
                <NavigationHandler />
                <ScrollToTop />
                <Suspense fallback={<div className="h-screen flex items-center justify-center text-sm text-slate-400">Loading...</div>}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/crafts" element={<Crafts />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/order" element={<Order />} />
                    <Route
                      path="/orders"
                      element={
                        <ProtectedRoute>
                          <OrderHistory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/orders/:id"
                      element={
                        <ProtectedRoute>
                          <OrderDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/refund" element={<Refund />} />
                    <Route path="/shipping" element={<Shipping />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route
                      path="/subscriptions"
                      element={
                        <ProtectedRoute>
                          <Subscriptions />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/subscription-success" element={<SubscriptionSuccess />} />
                    <Route
                      path="/wallet"
                      element={
                        <ProtectedRoute>
                          <Wallet />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/payment-success" element={<PaymentSuccess />} />
                    <Route path="/payment-cancelled" element={<PaymentCancelled />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />
                    <Route path="/design-showcase" element={<DesignShowcase />} />
                    <Route path="/offline" element={<OfflineFallback />} />

                    {/* Admin Routes */}
                    <Route
                      path="/admin/dashboard"
                      element={
                        <AdminProtectedRoute>
                          <AdminDashboard />
                        </AdminProtectedRoute>
                      }
                    />
                    {/* Staff Routes */}
                    <Route
                      path="/staff/dashboard"
                      element={
                        <StaffProtectedRoute>
                          <StaffDashboard />
                        </StaffProtectedRoute>
                      }
                    />

                    <Route
                      path="/delivery/dashboard"
                      element={
                        <StaffProtectedRoute>
                          <DeliveryDashboard />
                        </StaffProtectedRoute>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </NotificationProvider>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </I18nextProvider>
);

export default App;
