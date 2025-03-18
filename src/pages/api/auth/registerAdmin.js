import { supabase } from "../../../lib/supabase.js";

export const prerender = false; // 🔥 Habilita SSR para manejar POST

export const POST = async ({ request, redirect }) => {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const nombre = formData.get("nombre")?.toString();
    const tipo = formData.get("tipo")?.toString(); // Especificado por el admin
    const turno = formData.get("turno")?.toString(); // El turno pasado por parámetro
    const guardiasSeleccionadas = JSON.parse(formData.get("guardiasSeleccionadas")?.toString() || "[]"); // Guardias seleccionadas desde el frontend

    if (!email || !password || !nombre || !tipo || !turno) {
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
    const { data: usuarioData, error: insertError } = await supabase
        .from("usuarios")
        .insert([{
            nombre,
            correo: email,
            auth_id: authUserId,
            tipo, // Especificado por el admin
            aceptado: true, // Aceptado automáticamente
        }])
        .single(); // Usamos .single() para obtener solo un registro

    if (insertError) {
        return new Response(insertError.message, { status: 500 });
    }

    // Aquí agregamos un select después de la inserción para asegurarnos de obtener el ID
    const { data: usuarioFinal, error: selectError } = await supabase
        .from("usuarios")
        .select("id")
        .eq("correo", email)
        .single();

    if (selectError) {
        return new Response(selectError.message, { status: 500 });
    }

    const usuarioId = usuarioFinal?.id; // Ahora tenemos el ID del usuario recién creado en la tabla 'usuarios'

    if (!usuarioId) {
        return new Response("Error al obtener el ID del usuario en la tabla 'usuarios'", { status: 500 });
    }

    // Insertar las guardias seleccionadas en la tabla 'horarios_profesor'
    if (guardiasSeleccionadas.length > 0) {
        const horarios = guardiasSeleccionadas.map(guardia => ({
            id_profesor: usuarioId, // Usamos el ID del usuario insertado en la tabla 'usuarios'
            turno: turno,
            dia_semana: guardia.dia,
            inicio: guardia.horaInicio,
            fin: guardia.horaFin
        }));

        // Insertar las filas de guardias en la tabla horarios_profesor
        const { error: insertGuardiasError } = await supabase
            .from("horarios_profesor")
            .insert(horarios);

        if (insertGuardiasError) {
            return new Response(insertGuardiasError.message, { status: 500 });
        }
    }

    // Insertar las filas de guardias en la tabla horarios_profesor
    const { error: insertGuardiasError } = await supabase
        .from("horarios_profesor")
        .insert(horarios);

    if (insertGuardiasError) {
        return new Response(insertGuardiasError.message, { status: 500 });
    }

    return new Response(
        JSON.stringify({ message: "Usuario y guardias creados exitosamente", success: true }),
        { status: 200 }
    );
};
