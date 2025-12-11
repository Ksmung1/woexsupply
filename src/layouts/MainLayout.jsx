import React from "react";
import { Link, Outlet } from "react-router-dom";
import Navbar from "../components/Global/Navbar";
import ScrollToTop from "../components/utils/ScrollToTop";

const MainLayout = ({ children }) => {
  return (
    <div>
          <Navbar/>
          <ScrollToTop/>
          <main><Outlet/></main>
    </div>
  );
};

export default MainLayout;
