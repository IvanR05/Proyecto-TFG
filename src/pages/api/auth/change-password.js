import { supabase } from "../../../lib/supabase.js";
export const prerender = false; // 🔥 Habilita SSR para manejar POST

export const POST = async ({ request, cookies }) => {
    const authToken = cookies.get("sb-access-token")?.value;
    if (!authToken) {
        return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
    }

    try {
        const { newPassword } = await request.json();

        if (!newPassword || newPassword.length < 6) {
            return new Response(JSON.stringify({ error: "Contraseña inválida" }), { status: 400 });
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            console.error("Error cambiando contraseña:", error);
            return new Response(JSON.stringify({ error: error.message }), { status: 400 });
        }

        return new Response(JSON.stringify({ message: "Contraseña actualizada correctamente" }), { status: 200 });

    } catch (error) {
        console.error("Error en el servidor:", error);
        return new Response(JSON.stringify({ error: "Error interno del servidor" }), { status: 500 });
    }
};