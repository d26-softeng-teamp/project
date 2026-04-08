import { TopNav } from "@myapp/ui/components/top-nav";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import BusinessAnalyst from "@/pages/business-analyst/page.tsx";
import ContentFormPage from "@/pages/content/content-form.tsx";
import ContentListPage from "@/pages/content/page.tsx";
import DashboardPage from "@/pages/dashboard/page.tsx";
import EmployeesFormPage from "@/pages/employees/employees-form.tsx";
import EmployeesPage from "@/pages/employees/page.tsx";
import HeroPage from "@/pages/hero/page.tsx";
import UnderwriterPage from "@/pages/underwriter/page.tsx";

const navItems = [
  { label: "Hero", to: "/hero" },
  { label: "Underwriter", to: "/underwriter" },
  { label: "Business Analyst", to: "/businessAnalyst" },
  { label: "Employees", to: "/employees" },
  { label: "Content", to: "/content" },
  { label: "Dashboard", to: "/dashboard" },
];

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground">
        <TopNav items={navItems} />
        <Routes>
          <Route path="/" element={<Navigate to="/hero" replace />} />
          <Route path="/hero" element={<HeroPage />} />
          <Route path="/underwriter" element={<UnderwriterPage />} />
          <Route path="/businessAnalyst" element={<BusinessAnalyst />} />

          {/* Employees: list → create / edit */}
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/employees/new" element={<EmployeesFormPage />} />
          <Route path="/employees/:id" element={<EmployeesFormPage />} />

          {/* Content: list → create / edit */}
          <Route path="/content" element={<ContentListPage />} />
          <Route path="/content/new" element={<ContentFormPage />} />
          <Route path="/content/:id/edit" element={<ContentFormPage />} />

          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
