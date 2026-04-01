import React from "react";
import Header from "./Components/Header.jsx";
import Footer from "./Components/Footer.jsx";
import PopupBanner from "./Components/PopupBanner.jsx";
import ScrollToTop from "./Components/ScrollToTop.jsx";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <PopupBanner />
      <Outlet />
      <Footer />
    </>
  );
}

export default Layout;
