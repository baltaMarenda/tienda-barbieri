import { Navigate, Route, Routes } from "react-router-dom";

import { Layout } from "./components/layout/Layout";
import { RequireAdmin } from "./components/RequireAdmin";
import { AdminCategories } from "./pages/admin/AdminCategories";
import { AdminImages } from "./pages/admin/AdminImages";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminOrders } from "./pages/admin/AdminOrders";
import { AdminProducts } from "./pages/admin/AdminProducts";
import { Catalog } from "./pages/Catalog";
import { Contact } from "./pages/Contact";
import { Home } from "./pages/Home";
import { NotFound } from "./pages/NotFound";
import { ProductDetail } from "./pages/ProductDetail";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="productos" element={<Catalog />} />
        <Route path="productos/:id" element={<ProductDetail />} />
        <Route path="contacto" element={<Contact />} />

        <Route element={<RequireAdmin />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="productos" replace />} />
            <Route path="productos" element={<AdminProducts />} />
            <Route path="categorias" element={<AdminCategories />} />
            <Route path="imagenes" element={<AdminImages />} />
            <Route path="pedidos" element={<AdminOrders />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
