import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import { ChatWidget } from "@/components/chat/ChatWidget";
import Index from "./pages/Index";
import Despre from "./pages/Despre";
import Produse from "./pages/Produse";
import ProductDentTastic from "./pages/ProductDentTastic";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import NotFound from "./pages/NotFound";
import { AdminLogin, AdminDashboard, AdminOverview, AdminProducts, AdminOrders } from "./pages/admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/despre" element={<Despre />} />
                <Route path="/produse" element={<Produse />} />
                <Route path="/produse/dent-tastic" element={<ProductDentTastic />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/cos" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/comanda-confirmata" element={<OrderConfirmation />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminDashboard />}>
                  <Route index element={<AdminOverview />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
              <ChatWidget />
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
