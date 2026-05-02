import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
  isAuthorized: boolean;
}

export function useCustomAuth() {
  const [, setLocation] = useLocation();
  
  // Use tRPC to check authentication
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      setLocation("/login");
    },
  });

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Logout failed:", error);
      setLocation("/login");
    }
  };

  return {
    user: meQuery.data as AuthUser | null,
    loading: meQuery.isLoading,
    isAuthenticated: !!meQuery.data,
    logout,
  };
}
