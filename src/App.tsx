// App entry point
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import IngredientInput from "./pages/IngredientInput";
import RecipeResult from "./pages/RecipeResult";
import CookingMode from "./pages/CookingMode";
import PostCooking from "./pages/PostCooking";
import UserProfile from "./pages/UserProfile";
import Gallery from "./pages/Gallery";
import CookbookBuilder from "./pages/CookbookBuilder";
import Login from "./pages/Login";
import AdminAnalytics from "./pages/AdminAnalytics";
import DebugMatching from "./pages/DebugMatching";
import CategorySelection from "./pages/CategorySelection";
import Upgrade from "./pages/Upgrade";
import FridgeChallenges from "./pages/FridgeChallenges";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="pb-16">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/ingredients" element={<IngredientInput />} />
            <Route path="/recipe" element={<RecipeResult />} />
            <Route path="/cooking" element={<CookingMode />} />
            <Route path="/complete" element={<PostCooking />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/cookbook" element={<CookbookBuilder />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/debug" element={<DebugMatching />} />
            <Route path="/categories" element={<CategorySelection />} />
            <Route path="/upgrade" element={<Upgrade />} />
            <Route path="/challenges" element={<FridgeChallenges />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
