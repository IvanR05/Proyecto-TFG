import { supabase } from "../../../lib/supabase.js";

export const prerender = false; // 🔥 Habilita SSR para manejar POST

export const POST = async ({ request, cookies, redirect }) => {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
        return new Response("Correo electrónico y contraseña obligatorios", { status: 400 });
    }

    // Intentar iniciar sesión
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return new Response(error.message, { status: 401 });
    }

    const authUserId = data?.user?.id;

    if (!authUserId) {
        return new Response("No se pudo obtener el ID del usuario", { status: 500 });
    }

    // Verificar si el usuario está aceptado en la tabla 'usuarios'
    const { data: userData, error: userError } = await supabase
        .from("usuarios")
        .select("aceptado")
        .eq("auth_id", authUserId)
        .single();

    if (userError || !userData) {
        return new Response("No se encontró el usuario en la base de datos", { status: 500 });
    }

    if (!userData.aceptado) {
        return new Response("Esperando confirmación del administrador para ser aceptado", { status: 403 });
    }

    // Guardar tokens en cookies
    const { access_token, refresh_token } = data.session;
    cookies.set("sb-access-token", access_token, {
        path: "/",           
        httpOnly: true,      
        secure: true,        
        sameSite: "Strict",  
        maxAge: 60 * 60 * 2  // ⏳ Expira en 2 horas (7200 segundos)
    });
    
    cookies.set("sb-refresh-token", refresh_token, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        maxAge: 60 * 60 * 24 * 7 // ⏳ Expira en 7 días (para renovar el access token)
    });

    supabase.auth.setSession({
        refresh_token,
        access_token
    })

    return redirect("/Home");
};
