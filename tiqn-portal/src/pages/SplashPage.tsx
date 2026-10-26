import React, { useEffect } from "react";
import { Page, Spinner } from "zmp-ui";
import { useAuth } from "@/hooks/useAuth";

const SplashPage: React.FC = () => {
  const { initAuth } = useAuth();

  useEffect(() => {
    console.log("[Splash] App starting, calling initAuth...");
    initAuth();
  }, []);

  return (
    <Page className="flex items-center justify-center">
      <Spinner visible logo />
    </Page>
  );
};

export default SplashPage;
