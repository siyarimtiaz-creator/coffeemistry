import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CafeProvider } from "@/contexts/CafeContext";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const AdminOrdersPage = lazy(() => import("@/pages/AdminOrders"));
const CheckoutPage = lazy(() => import("@/pages/Checkout"));
const EditorialPage = lazy(() => import("@/pages/Editorial").then(module => ({ default: module.EditorialPage })));
const Home = lazy(() => import("@/pages/Home"));
const MenuPage = lazy(() => import("@/pages/Menu"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const OrderConfirmationPage = lazy(() => import("@/pages/OrderConfirmation"));
const VisitPage = lazy(() => import("@/pages/Visit"));

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/menu" component={MenuPage} />
    <Route path="/menu/:categorySlug" component={MenuPage} />
    <Route path="/checkout" component={CheckoutPage} />
    <Route path="/order/:orderNumber" component={OrderConfirmationPage} />
    <Route path="/admin" component={AdminOrdersPage} />
    <Route path="/admin/orders" component={AdminOrdersPage} />
    <Route path="/about">{() => <EditorialPage kind="about" />}</Route>
    <Route path="/experience">{() => <EditorialPage kind="experience" />}</Route>
    <Route path="/reviews">{() => <EditorialPage kind="reviews" />}</Route>
    <Route path="/visit" component={VisitPage} />
    <Route path="/privacy">{() => <EditorialPage kind="privacy" />}</Route>
    <Route path="/terms">{() => <EditorialPage kind="terms" />}</Route>
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><CafeProvider><Toaster richColors position="top-center" /><Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#fffaf0] font-display text-3xl text-[#2a1710]">Coffeemistry</div>}><Router /></Suspense></CafeProvider></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
