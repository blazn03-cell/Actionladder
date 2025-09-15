import { useQuery } from "@tanstack/react-query";
import type { GlobalRole } from "@shared/schema";

interface User {
  id: string;
  email: string;
  name: string;
  globalRole: GlobalRole;
  hallName?: string;
  city?: string;
  state?: string;
  subscriptionTier?: string;
  accountStatus: string;
  onboardingComplete: boolean;
}

interface AuthResponse {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

export function useAuth(): AuthResponse {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false, // Don't retry auth failures
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    error: error as Error | null,
  };
}