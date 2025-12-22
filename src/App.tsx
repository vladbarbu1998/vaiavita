import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { ScrollToTop } from "@/components/ScrollToTop";
import CookieBanner from "@/components/CookieBanner";
import Index from "./pages/Index";
import Despre from "./pages/Despre";
import Produse from "./pages/Produse";
import ProductDentTastic from "./pages/ProductDentTastic";
import ProductPage from "./pages/ProductPage";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import PoliticaConfidentialitate from "./pages/PoliticaConfidentialitate";
import TermeniConditii from "./pages/TermeniConditii";
import PoliticaCookies from "./pages/PoliticaCookies";
import PoliticaRetur from "./pages/PoliticaRetur";
import PoliticaLivrare from "./pages/PoliticaLivrare";
import NotFound from "./pages/NotFound";
import { AdminDashboard, AdminOverview, AdminProducts, AdminCategories, AdminOrders, AdminCustomers, AdminReviews, AdminCoupons, AdminInbox } from "./pages/admin";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <CartProvider>
              <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ScrollToTop />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/despre" element={<Despre />} />
                  <Route path="/produse" element={<Produse />} />
                  <Route path="/produse/dent-tastic" element={<ProductDentTastic />} />
                  <Route path="/produse/:slug" element={<ProductPage />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/cos" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/comanda-confirmata" element={<OrderConfirmation />} />
                  <Route path="/politica-confidentialitate" element={<PoliticaConfidentialitate />} />
                  <Route path="/termeni-si-conditii" element={<TermeniConditii />} />
                  <Route path="/politica-cookie-uri" element={<PoliticaCookies />} />
                  <Route path="/politica-retur" element={<PoliticaRetur />} />
                  <Route path="/politica-livrare" element={<PoliticaLivrare />} />
                  <Route path="/admin" element={<AdminDashboard />}>
                    <Route index element={<AdminOverview />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="customers" element={<AdminCustomers />} />
                    <Route path="reviews" element={<AdminReviews />} />
                    <Route path="coupons" element={<AdminCoupons />} />
                    <Route path="inbox" element={<AdminInbox />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <ChatWidget />
                <CookieBanner />
              </BrowserRouter>
            </TooltipProvider>
            </CartProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
