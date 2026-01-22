"use client";

import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

// Auth server URL
const AUTH_SERVER_URL = process.env.NEXT_PUBLIC_AUTH_SERVER_URL || "http://localhost:5000";

interface AutoLoginContextValue {
    isCheckingAuthServer: boolean;
    authServerSession: { authenticated: boolean; user?: { id: string; email: string; name: string } } | null;
    triggerAutoLogin: () => Promise<void>;
}

const AutoLoginContext = createContext<AutoLoginContextValue | null>(null);

export function useAutoLogin() {
    const context = useContext(AutoLoginContext);
    if (!context) {
        throw new Error("useAutoLogin must be used within AutoLoginProvider");
    }
    return context;
}

interface AutoLoginProviderProps {
    children: React.ReactNode;
    /**
     * Whether to automatically trigger OAuth login if user is logged in on auth server
     * but not on this client app
     */
    autoTrigger?: boolean;
    /**
     * Paths to exclude from auto-login check (e.g., sign-in page, callback pages)
     */
    excludePaths?: string[];
    /**
     * Whether the user has an active session on this client app
     */
    hasLocalSession: boolean;
}

export function AutoLoginProvider({
    children,
    autoTrigger = true,
    excludePaths = ["/sign-in", "/api/auth", "/callback"],
    hasLocalSession,
}: AutoLoginProviderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isCheckingAuthServer, setIsCheckingAuthServer] = useState(false);
    const [authServerSession, setAuthServerSession] = useState<AutoLoginContextValue["authServerSession"]>(null);
    const [hasTriggeredAutoLogin, setHasTriggeredAutoLogin] = useState(false);

    // Check if current path should be excluded from auto-login
    const isExcludedPath = excludePaths.some(path => pathname.startsWith(path));

    // Function to trigger OAuth login
    const triggerAutoLogin = useCallback(async () => {
        try {
            await authClient.signIn.oauth2({
                providerId: "central-oauth",
                callbackURL: pathname || "/",
            });
        } catch (error) {
            console.error("[AutoLogin] Failed to trigger OAuth login:", error);
        }
    }, [pathname]);

    // Check auth server session
    useEffect(() => {
        // Skip if:
        // - User already has a local session
        // - Current path is excluded
        // - Already checking or checked
        if (hasLocalSession || isExcludedPath || isCheckingAuthServer || authServerSession !== null) {
            return;
        }

        const checkAuthServerSession = async () => {
            setIsCheckingAuthServer(true);
            try {
                const response = await fetch(`${AUTH_SERVER_URL}/api/auth/session-check`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setAuthServerSession(data);
                } else {
                    setAuthServerSession({ authenticated: false });
                }
            } catch (error) {
                console.error("[AutoLogin] Failed to check auth server session:", error);
                setAuthServerSession({ authenticated: false });
            } finally {
                setIsCheckingAuthServer(false);
            }
        };

        checkAuthServerSession();
    }, [hasLocalSession, isExcludedPath, isCheckingAuthServer, authServerSession]);

    // Auto-trigger OAuth login if needed
    useEffect(() => {
        // Only trigger if:
        // - Auto-trigger is enabled
        // - User doesn't have a local session
        // - Auth server session is authenticated
        // - Path is not excluded
        // - Haven't already triggered
        if (
            autoTrigger &&
            !hasLocalSession &&
            authServerSession?.authenticated &&
            !isExcludedPath &&
            !hasTriggeredAutoLogin
        ) {
            setHasTriggeredAutoLogin(true);
            triggerAutoLogin();
        }
    }, [autoTrigger, hasLocalSession, authServerSession, isExcludedPath, hasTriggeredAutoLogin, triggerAutoLogin]);

    return (
        <AutoLoginContext.Provider value={{ isCheckingAuthServer, authServerSession, triggerAutoLogin }}>
            {children}
        </AutoLoginContext.Provider>
    );
}
