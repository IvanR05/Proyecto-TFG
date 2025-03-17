import { supabase } from "../../../lib/supabase.js";
export const prerender = false; // 🔥 Habilita SSR para manejar POST

export const POST = async ({ request, cookies }) => {
    const authToken = cookies.get("sb-access-token")?.value;
    if (!authToken) {
        return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
    }

    try {
        const { newEmail } = await request.json();

        if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
            return new Response(JSON.stringify({ error: "Correo inválido" }), { status: 400 });
        }

        const { error } = await supabase.auth.updateUser({ email: newEmail });

        if (error) {
            console.error("Error cambiando email:", error);
            return new Response(JSON.stringify({ error: error.message }), { status: 400 });
        }

        return new Response(JSON.stringify({ message: "Correo actualizado correctamente. Revisa tu email para confirmarlo." }), { status: 200 });

    } catch (error) {
        console.error("Error en el servidor:", error);
        return new Response(JSON.stringify({ error: "Error interno del servidor" }), { status: 500 });
    }
};