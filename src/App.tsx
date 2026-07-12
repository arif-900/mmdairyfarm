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
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import OrderHistory from "./pages/OrderHistory";
import OrderDetail from "./pages/OrderDetail";
import NotFound from "./pages/NotFound";
import ScrollToTop from "@/components/layout/ScrollToTop";

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
                }}
              >
                <NavigationHandler />
                <ScrollToTop />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/order" element={<Suspense fallback={<div className="h-screen flex items-center justify-center text-sm text-slate-400">Loading...</div>}><Order /></Suspense>} />
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
                  <Route path="/auth" element={<Suspense fallback={<div className="h-screen flex items-center justify-center text-sm text-slate-400">Loading...</div>}><Auth /></Suspense>} />
                  <Route path="/contact" element={<Suspense fallback={<div className="h-screen flex items-center justify-center text-sm text-slate-400">Loading...</div>}><Contact /></Suspense>} />
                  <Route path="/terms" element={<Suspense fallback={<div className="h-screen flex items-center justify-center text-sm text-slate-400">Loading...</div>}><Terms /></Suspense>} />
                  <Route path="/privacy" element={<Suspense fallback={<div className="h-screen flex items-center justify-center text-sm text-slate-400">Loading...</div>}><Privacy /></Suspense>} />
                  <Route path="/refund" element={<Suspense fallback={<div className="h-screen flex items-center justify-center text-sm text-slate-400">Loading...</div>}><Refund /></Suspense>} />
                  <Route path="/shipping" element={<Suspense fallback={<div className="h-screen flex items-center justify-center text-sm text-slate-400">Loading...</div>}><Shipping /></Suspense>} />
                  <Route path="/faq" element={<Suspense fallback={<div className="h-screen flex items-center justify-center text-sm text-slate-400">Loading...</div>}><FAQ /></Suspense>} />
                  <Route
                    path="/subscriptions"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<div className="h-screen flex items-center justify-center text-sm text-slate-400">Loading...</div>}><Subscriptions /></Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/subscription-success" element={<Suspense fallback={<div className="h-screen flex items-center justify-center text-sm text-slate-400">Loading...</div>}><SubscriptionSuccess /></Suspense>} />
                  <Route
                    path="/wallet"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<div className="h-screen flex items-center justify-center text-sm text-slate-400">Loading...</div>}><Wallet /></Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/payment-success" element={<Suspense fallback={<div className="h-screen flex items-center justify-center text-sm text-slate-400">Loading...</div>}><PaymentSuccess /></Suspense>} />
                  <Route path="/payment-cancelled" element={<Suspense fallback={<div className="h-screen flex items-center justify-center text-sm text-slate-400">Loading...</div>}><PaymentCancelled /></Suspense>} />
                  <Route path="/forgot-password" element={<Suspense fallback={<div className="h-screen flex items-center justify-center text-sm text-slate-400">Loading...</div>}><ForgotPassword /></Suspense>} />
                  <Route path="/reset-password" element={<Suspense fallback={<div className="h-screen flex items-center justify-center text-sm text-slate-400">Loading...</div>}><ResetPassword /></Suspense>} />
                  <Route path="/unauthorized" element={<Suspense fallback={<div className="h-screen flex items-center justify-center text-sm text-slate-400">Loading...</div>}><Unauthorized /></Suspense>} />
                  <Route path="/design-showcase" element={<Suspense fallback={<div className="h-screen flex items-center justify-center text-sm text-slate-400">Loading...</div>}><DesignShowcase /></Suspense>} />

                  {/* Admin Routes */}
                  <Route
                    path="/admin/dashboard"
                    element={
                      <AdminProtectedRoute>
                        <Suspense fallback={<div className="h-screen flex items-center justify-center text-sm text-slate-400">Loading dashboard...</div>}>
                          <AdminDashboard />
                        </Suspense>
                      </AdminProtectedRoute>
                    }
                  />
                  {/* Staff Routes */}
                  <Route
                    path="/staff/dashboard"
                    element={
                      <StaffProtectedRoute>
                        <Suspense fallback={<div className="h-screen flex items-center justify-center text-sm text-slate-400">Loading dashboard...</div>}>
                          <StaffDashboard />
                        </Suspense>
                      </StaffProtectedRoute>
                    }
                  />

                  <Route
                    path="/delivery/dashboard"
                    element={
                      <StaffProtectedRoute>
                        <Suspense fallback={<div className="h-screen flex items-center justify-center text-sm text-slate-400">Loading...</div>}><DeliveryDashboard /></Suspense>
                      </StaffProtectedRoute>
                    }
                  />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </NotificationProvider>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </I18nextProvider>
);

export default App;
