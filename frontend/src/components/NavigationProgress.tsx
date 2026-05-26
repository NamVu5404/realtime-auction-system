import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

NProgress.configure({ showSpinner: false, speed: 350, minimum: 0.08 });

// Completes the bar when the new page finishes rendering
export const NavigationProgress = () => {
  const location = useLocation();

  useEffect(() => {
    NProgress.done();
  }, [location.pathname]);

  return null;
};
