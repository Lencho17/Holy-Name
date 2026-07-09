import React from 'react';
import { Outlet } from 'react-router-dom';
import ScrollToTop from "./Components/ScrollToTop.jsx";
import SaaSHeader from "./Components/SaaSHeader.jsx";
import SaaSFooter from "./Components/SaaSFooter.jsx";

const SaaSLayout = () => {
  return (
    <>
      <ScrollToTop />
      <SaaSHeader />
      <Outlet />
      <SaaSFooter />
    </>
  );
};

export default SaaSLayout;
