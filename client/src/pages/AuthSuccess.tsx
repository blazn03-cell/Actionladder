import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

export default function AuthSuccess() {
  const { data: authData, isLoading } = useQuery({
    queryKey: ["/api/auth/success"],
    refetchInterval: false,
  });

  useEffect(() => {
    if (!isLoading && authData) {
      const { role, redirectUrl } = authData;
      
      // Redirect based on role
      switch (role) {
        case "admin":
          window.location.href = "/app?tab=admin";
          break;
        case "operator":
          window.location.href = "/app?tab=operator-settings";
          break;
        case "player":
        default:
          window.location.href = "/app?tab=dashboard";
          break;
      }
    }
  }, [authData, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-felt-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">Completing Sign-Up</h2>
          <p className="text-gray-400">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-felt-dark flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 mb-4">⚠️</div>
        <h2 className="text-2xl font-semibold text-white mb-2">Sign-Up Error</h2>
        <p className="text-gray-400 mb-4">There was an issue completing your registration.</p>
        <a 
          href="/" 
          className="text-emerald-400 hover:text-emerald-300 underline"
        >
          Return to homepage
        </a>
      </div>
    </div>
  );
}