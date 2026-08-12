import { Navigate, Route, Routes } from "react-router-dom";
import Shell from "./components/Shell.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Companies from "./pages/Companies.jsx";
import CompanyDetails from "./pages/CompanyDetails.jsx";
import Contacts from "./pages/Contacts.jsx";
import ContactDetails from "./pages/ContactDetails.jsx";
import Profile from "./pages/Profile.jsx";

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/:id" element={<CompanyDetails />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/contacts/:id" element={<ContactDetails />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
