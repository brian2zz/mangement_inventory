"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";

export function useRequireAuth() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // ⛔ MASIH CEK LOGIN → JANGAN APA-APA
        if (isLoading) return;

        if (!user) {
            router.replace("/login");
        }
    }, [user, isLoading, router]);

    return { user, isLoading };
}
