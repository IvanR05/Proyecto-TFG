import { supabase } from "../../../lib/supabase.js";
export const prerender = false; // 🔥 Habilita SSR para manejar POST

export const GET = async ({ cookies, redirect }) => {
    const authToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!authToken) {
        return new Response(JSON.stringify({ user: null }), { status: 200 });
    }

    try {
        
        const { data, userError } = await supabase.auth.setSession({
            access_token: authToken,
            refresh_token: refreshToken,
        })

        if (userError) {
            console.error("Error fetching user data:", userError);
            return new Response(JSON.stringify({ user: null }), { status: 500 });
        }

        const auth_id = data.user.id;
        
        console.log("auth code " + auth_id)

        const { u, error } = await supabase
            .from('usuarios')
            .select('auth_id')
            .eq('auth_id', auth_id)

        if (error) {
            console.log("hello");
            console.error("Error fetching user data:", error);
            return { status: 500, body: "Error fetching user data" };
        }
        console.log("result " + u);

        return new Response(JSON.stringify(u), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Error obteniendo datos del usuario:", error);
        return new Response(JSON.stringify({ user: null }), { status: 500 });
    }
}
