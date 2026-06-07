import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Safe back-navigation helper.
 * Falls back to a provided path (default "/") when there is no history
 * to pop — e.g., when the user lands on a page via direct URL or refresh.
 */
export const useGoBack = (fallback: string = "/") => {
  const navigate = useNavigate();
  return useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  }, [navigate, fallback]);
};

export default useGoBack;