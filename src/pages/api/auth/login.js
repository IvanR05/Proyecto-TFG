import { supabase } from "../../../lib/supabase.js";

export const prerender = false; // 🔥 Habilita SSR para manejar POST

export const POST = async ({ request, cookies, redirect }) => {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
        return new Response("Correo electrónico y contraseña obligatorios", { status: 400 });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return new Response(error.message, { status: 500 });
    }

    const { access_token, refresh_token } = data.session;
    cookies.set("sb-access-token", access_token, {
        path: "/",
    });
    cookies.set("sb-refresh-token", refresh_token, {
        path: "/",
    });

    return redirect("/Home");
};
