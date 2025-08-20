import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import ScrollToTop from "./ScrollToTop";

const Layout = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]); 

  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
};

export default Layout;
