import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";

import Index           from "@/pages/Index";
import Login           from "@/pages/Login";
import Register        from "@/pages/Register";
import CitizenDashboard  from "@/pages/CitizenDashboard";
import OfficialDashboard from "@/pages/OfficialDashboard";
import ReportIssue     from "@/pages/ReportIssue";
import MapView         from "@/pages/MapView";
import IssueDetails    from "@/pages/IssueDetails";
import Profile         from "@/pages/Profile";
import NotFound        from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/"                    element={<Index />} />
              <Route path="/login"               element={<Login />} />
              <Route path="/register"            element={<Register />} />
              <Route path="/citizen-dashboard"   element={<CitizenDashboard />} />
              <Route path="/official-dashboard"  element={<OfficialDashboard />} />
              <Route path="/report-issue"        element={<ReportIssue />} />
              <Route path="/map"                 element={<MapView />} />
              <Route path="/issue/:id"           element={<IssueDetails />} />
              <Route path="/profile"             element={<Profile />} />
              <Route path="*"                    element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
