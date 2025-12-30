export async function apiFetch(
    endpoint: string,
    options: RequestInit = {}
) {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {
            credentials: "include", // 🔥 INI WAJIB
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
        }
    );

    if (res.status === 401 && typeof window !== "undefined") {
        window.location.href = "/login";
        throw new Error("Unauthorized");
    }

    return res;
}
