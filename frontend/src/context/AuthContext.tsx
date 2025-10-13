import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { API_BASE_URL } from "../config";

type StudentApiResponse = {
  id: number;
  full_name: string;
  email: string;
  avatar_url?: string | null;
};

type Student = {
  id: number;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
};

type AuthContextValue = {
  student: Student | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<Student>;
  logout: () => void;
  refreshProfile: () => Promise<Student | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_STORAGE_KEY = "orus:access_token";

const normaliseStudent = (payload: StudentApiResponse): Student => ({
  id: payload.id,
  fullName: payload.full_name,
  email: payload.email,
  avatarUrl: payload.avatar_url ?? null,
});

const safeReadJson = async (response: Response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(
    async (accessToken: string): Promise<Student> => {
      const response = await fetch(`${API_BASE_URL}/profile/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const data = await safeReadJson(response);
        const message = (data && data.detail) || "Failed to load profile";
        throw new Error(message);
      }

      const payload = (await response.json()) as StudentApiResponse;
      const normalised = normaliseStudent(payload);
      setStudent(normalised);
      return normalised;
    },
    []
  );

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetchProfile(token)
      .catch(() => {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setStudent(null);
      })
      .finally(() => setIsLoading(false));
  }, [fetchProfile, token]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: email,
          password,
        }).toString(),
      });

      if (!response.ok) {
        const data = await safeReadJson(response);
        const message = (data && data.detail) || "Invalid email or password";
        throw new Error(message);
      }

      const payload = (await response.json()) as { access_token: string; token_type: string };
      const accessToken = payload.access_token;
      window.localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      setToken(accessToken);

      try {
        return await fetchProfile(accessToken);
      } catch (error) {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setStudent(null);
        throw error;
      }
    },
    [fetchProfile]
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setStudent(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) {
      return null;
    }

    try {
      return await fetchProfile(token);
    } catch (error) {
      logout();
      throw error;
    }
  }, [fetchProfile, logout, token]);

  const value = useMemo(
    () => ({
      student,
      token,
      isLoading,
      login,
      logout,
      refreshProfile,
    }),
    [isLoading, login, logout, refreshProfile, student, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
