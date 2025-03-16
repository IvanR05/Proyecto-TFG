import { supabase } from "../../../lib/supabase.js";
export const prerender = false; // 🔥 Habilita SSR para manejar POST

export const GET = async ({ cookies }) => {
    const authToken = cookies.get("sb-access-token")?.value;

    if (!authToken) {
        return new Response(JSON.stringify({ user: null }), { status: 200 });
    }

    try {
        // ✅ Validate token instead of refreshing the session
        const { data, error } = await supabase.auth.getUser(authToken);

        if (error || !data || !data.user) {
            console.error("Invalid or expired token:", error);
            return new Response(JSON.stringify({ user: null }), { status: 401 });
        }

        // Access the `id` inside `data.user`
        const auth_id = data.user.id;

        const { data: u, error: dbError } = await supabase
            .from("usuarios")
            .select("*")
            .eq("auth_id", auth_id);

        if (dbError) {
            console.error("Error fetching user data:", dbError);
            return new Response(JSON.stringify({ error: "Error fetching user data" }), { status: 500 });
        }

        return new Response(JSON.stringify(u[0] || null), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Error obteniendo datos del usuario:", error);
        return new Response(JSON.stringify({ user: null }), { status: 500 });
    }
};
