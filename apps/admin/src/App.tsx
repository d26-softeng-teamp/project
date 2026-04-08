import { TopNav } from "@myapp/ui/components/top-nav";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import AdminContentPage from "@/pages/content/page";
import UsersPage from "@/pages/users/page";
import UserFormPage from "@/pages/users/user-form";

const navItems = [
  { label: "Content", to: "/content" },
  { label: "User Management", to: "/users" },
];

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground">
        <TopNav items={navItems} />
        <Routes>
          <Route path="/" element={<Navigate to="/content" replace />} />
          <Route path="/content" element={<AdminContentPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/new" element={<UserFormPage />} />
          <Route path="/users/:id" element={<UserFormPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
