import React from "react";
import { Link, Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">

      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4 flex flex-col">
        <h1 className="text-xl font-semibold mb-6">Admin Panel</h1>

        <nav className="flex flex-col space-y-3">
          <Link to="/admin" className="hover:text-blue-600">
            Dashboard
          </Link>

          <Link to="/admin/orders" className="hover:text-blue-600">
            Orders
          </Link>

          <Link to="/admin/users" className="hover:text-blue-600">
            Users
          </Link>

          <Link to="/admin/products" className="hover:text-blue-600">
            Products
          </Link>
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">

        {/* Top Bar */}
        <header className="w-full bg-white shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-lg font-medium">Admin</h2>
          <button className="text-sm bg-red-500 text-white px-3 py-1 rounded">
            Logout
          </button>
        </header>

        {/* Page Content */}
        <main className=""><Outlet/></main>
      </div>
    </div>
  );
};

export default AdminLayout;
