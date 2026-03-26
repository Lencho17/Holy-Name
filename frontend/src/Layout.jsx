import React from "react";
import Header from "./Components/Header.jsx";
import Footer from "./Components/Footer.jsx";
import PopupBanner from "./Components/PopupBanner.jsx";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <>
      <Header />
      <PopupBanner />
      <Outlet />
      <Footer />
    </>
  );
}

export default Layout;
