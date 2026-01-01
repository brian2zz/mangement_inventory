import axios, { AxiosHeaders } from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export async function apiFetch(
    endpoint: string,
    options: RequestInit = {}
) {
    try {
        const token =
            typeof window !== "undefined"
                ? localStorage.getItem("token")
                : null;

        // ✅ BUAT HEADER YANG SESUAI AXIOS v1
        const headers = AxiosHeaders.from({
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        });

        const res = await api.request({
            url: endpoint,
            method: (options.method || "GET") as any,
            data: options.body
                ? JSON.parse(options.body as string)
                : undefined,
            headers,
        });

        return {
            ok: true,
            status: res.status,
            json: async () => res.data,
        } as Response;
    } catch (err: any) {
        // if (err.response?.status === 401 && typeof window !== "undefined") {
        //     localStorage.removeItem("token");
        //     window.location.href = "/login";
        // }

        return {
            ok: false,
            status: err.response?.status || 500,
            json: async () => err.response?.data,
        } as Response;
    }
}
