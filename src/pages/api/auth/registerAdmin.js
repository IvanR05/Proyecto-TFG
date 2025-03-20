import { supabase } from "../../../lib/supabase.js";

export const prerender = false;

export const POST = async ({ request }) => {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const nombre = formData.get("nombre")?.toString();
    const tipo = formData.get("tipo")?.toString();
    const turno = formData.get("turno")?.toString();
    const userName = formData.get("nombre2")?.toString();
    const guardiasSeleccionadas = JSON.parse(formData.get("guardiasSeleccionadas")?.toString() || "[]");

    if (!email || !password || !nombre || !tipo || !turno) {
        return new Response("Todos los campos son obligatorios", { status: 400 });
    }

    const { data: existingUser } = await supabase.from("usuarios").select("correo").eq("correo", email).single();
    if (existingUser) {
        return new Response("Este correo ya está registrado.", { status: 400 });
    }

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
        return new Response(signUpError.message, { status: 500 });
    }

    const authUserId = data?.user?.id;
    if (!authUserId) {
        return new Response("Error al obtener el ID del usuario", { status: 500 });
    }

    const { data: usuarioFinal, error: insertError } = await supabase
        .from("usuarios")
        .insert([{ nombre, correo: email, auth_id: authUserId, tipo, aceptado: true }])
        .select("id")
        .single();

    if (insertError) {
        return new Response(insertError.message, { status: 500 });
    }

    const usuarioId = usuarioFinal?.id;
    if (!usuarioId) {
        return new Response("Error al obtener el ID del usuario en la tabla 'usuarios'", { status: 500 });
    }

    let horarios = [];

    if (guardiasSeleccionadas.length > 0) {
        horarios = guardiasSeleccionadas.map(guardia => ({
            id_profesor: usuarioId,
            turno: turno,
            dia_semana: guardia.dia,
            inicio: guardia.horaInicio,
            fin: guardia.horaFin
        }));

        const { error: insertGuardiasError } = await supabase.from("horarios_profesor").insert(horarios);
        if (insertGuardiasError) {
            return new Response(insertGuardiasError.message, { status: 500 });
        }
    }

    const { data: admins, error: adminsError } = await supabase.from("usuarios").select("id").eq("tipo", "admin");
    if (adminsError) {
        return new Response(adminsError.message, { status: 500 });
    }

    const guardiasAdmins = [];
    for (const admin of admins) {
        guardiasSeleccionadas.forEach(guardia => {
            guardiasAdmins.push({
                id_profesor: admin.id,
                turno: turno,
                dia_semana: guardia.dia,
                inicio: guardia.horaInicio,
                fin: guardia.horaFin
            });
        });
    }

    if (guardiasAdmins.length > 0) {
        const { error: insertAdminsGuardiasError } = await supabase.from("horarios_profesor").insert(guardiasAdmins);
        if (insertAdminsGuardiasError) {
            return new Response(insertAdminsGuardiasError.message, { status: 500 });
        }
    }

    const { data: notificacion, error: insertNotificationError } = await supabase.from("notificacion").insert([{ mensaje: `Se ha creado el usuario ${nombre} por ${userName}.`, visto: false }]).select("id").single();
    if (insertNotificationError) {
        return new Response(insertNotificationError.message, { status: 500 });
    }

    const asignaciones = admins.map(admin => ({ id_notificacion: notificacion.id, id_usuario: admin.id }));
    const { error: insertAsignacionesError } = await supabase.from("asignaciones_notificaciones").insert(asignaciones);
    if (insertAsignacionesError) {
        return new Response(insertAsignacionesError.message, { status: 500 });
    }

    return new Response(JSON.stringify({ message: "Usuario y guardias creados exitosamente", success: true }), { status: 200 });
};
