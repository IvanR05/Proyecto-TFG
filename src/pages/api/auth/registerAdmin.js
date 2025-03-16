import { supabase } from "../../../lib/supabase.js";

export const prerender = false; // 🔥 Habilita SSR para manejar POST

export const POST = async ({ request, redirect }) => {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const nombre = formData.get("nombre")?.toString();
    const tipo = formData.get("tipo")?.toString(); // Especificado por el admin

    if (!email || !password || !nombre || !tipo) {
        return new Response("Todos los campos son obligatorios", { status: 400 });
    }
    
    // Verificar si el usuario ya existe en la tabla 'usuarios'
    const { data: existingUser, error: userCheckError } = await supabase
        .from("usuarios")
        .select("correo")
        .eq("correo", email)
        .single();

    if (existingUser) {
        return new Response("Este correo ya está registrado.", { status: 400 });
    }

    // Registrar al usuario en Supabase Auth
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

    // Insertar el usuario en la tabla 'usuarios' con el tipo especificado y aceptado en true
    const { error: insertError } = await supabase
        .from("usuarios")
        .insert([{
            nombre,
            correo: email,
            auth_id: authUserId,
            tipo, // Especificado por el admin
            aceptado: true, // Aceptado automáticamente
        }]);

    if (insertError) {
        return new Response(insertError.message, { status: 500 });
    }

    return new Response(
        JSON.stringify({ message: "Usuario creado exitosamente", success: true }),
        { status: 200 }
    );
};
