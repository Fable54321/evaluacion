// src/context/AuthContext.tsx
import {
    createContext,
    useState,
    useContext,
    type ReactNode,
    useEffect,
} from "react";

type App = {
    slug: string;
    role: string;
}

type AppAccess = App[];

type User = {
    id: number;
    username: string;
    role?: string;
    appAccess: AppAccess;
};

interface AuthContextType {
    user: User | null;
    loading: boolean;
    authChecked: boolean;
    checkAuth: () => Promise<void>;
    clearAuth: () => void;
    isAuthorized: boolean;
    setIsAuthorized: (authorized: boolean) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const OFFLINE_USER_KEY = "vegibec-evaluacion-offline-user";
const OFFLINE_USER_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function saveOfflineUser(user: User) {
    localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify({ user, savedAt: Date.now() }));
}

function getOfflineUser(): User | null {
    try {
        const cached = JSON.parse(localStorage.getItem(OFFLINE_USER_KEY) ?? "null") as { user?: User; savedAt?: number } | null;
        if (!cached?.user || !cached.savedAt || Date.now() - cached.savedAt > OFFLINE_USER_MAX_AGE) {
            localStorage.removeItem(OFFLINE_USER_KEY);
            return null;
        }
        return cached.user;
    } catch {
        localStorage.removeItem(OFFLINE_USER_KEY);
        return null;
    }
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    authChecked: false,
    checkAuth: async () => { },
    clearAuth: () => { },
    isAuthorized: false,
    setIsAuthorized: () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);

    const clearAuth = () => {
        localStorage.removeItem(OFFLINE_USER_KEY);
        setUser(null);
        setAuthChecked(true);
        setLoading(false);
    };

    const fetchMe = async (): Promise<User | null> => {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
            method: "GET",
            credentials: "include",
        });

        if (!res.ok) {
            return null;
        }

        const data = await res.json();
        return data.user ?? null;
    };

    const tryRefresh = async (): Promise<boolean> => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: "POST",
                credentials: "include",
            });

            return res.ok;
        } catch {
            return false;
        }
    };

    const checkAuth = async () => {
        setLoading(true);

        try {
            let me = await fetchMe();

            if (!me) {
                const refreshed = await tryRefresh();

                if (refreshed) {
                    me = await fetchMe();
                }
            }

            setUser(me);
            if (me) saveOfflineUser(me);
            else localStorage.removeItem(OFFLINE_USER_KEY);
        } catch (err) {
            console.warn("Auth check failed:", err);
            setUser(getOfflineUser());
        } finally {
            setLoading(false);
            setAuthChecked(true);
        }
    };

    useEffect(() => {
        // Authentication is intentionally initiated once when the provider mounts.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        checkAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                authChecked,
                checkAuth,
                clearAuth,
                isAuthorized,
                setIsAuthorized,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
