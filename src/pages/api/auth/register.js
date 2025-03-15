import { supabase } from "../../../lib/supabase.js";

export const prerender = false; // 🔥 Habilita SSR para manejar POST

export const POST = async ({ request, redirect }) => {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
        return new Response("Correo electrónico y contraseña obligatorios", { status: 400 });
    }

    // Registrar al usuario en Supabase
    const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (signUpError) {
        return new Response(signUpError.message, { status: 500 });
    }

    const authUserId = data?.user?.id; // Obtener el UUID generado por Supabase

    if (!authUserId) {
        return new Response("Error al obtener el ID del usuario", { status: 500 });
    }

    // Insertar el usuario en la tabla 'usuarios' con el mismo auth_id
    const { error: insertError } = await supabase
        .from("usuarios")
        .insert([
            {
                correo: email,
                auth_id: authUserId, // Usamos el mismo ID que Supabase generó
                tipo: "usuario", // Puedes cambiarlo según lo necesites
                aceptado: false, // Puede ajustarse si lo requieres
            },
        ]);

    if (insertError) {
        return new Response(insertError.message, { status: 500 });
    }

    return redirect("/Login");
};
