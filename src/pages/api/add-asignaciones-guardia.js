import { supabase } from '../../lib/supabase.js';

export const prerender = false; // 🔥 Habilita SSR para manejar POST

export async function POST({ request }) {
    try {
        const bodyText = await request.text(); // ⬅️ Leer como texto
        console.log("Cuerpo recibido (texto):", bodyText); // 🔍 Ver qué llega

        const body = JSON.parse(bodyText); // ⬅️ Intentar convertirlo en JSON
        console.log("Cuerpo parseado (JSON):", body);

        const { id_guardia, id_usuario, nombreUsuario, inicio, id_aula } = body;

        // 🔴 Validar que los campos importantes no sean nulos o vacíos
        if (!id_guardia || !id_usuario) {
            console.error("Error: Datos inválidos");
            return new Response(JSON.stringify({ message: "Datos inválidos" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        async function generarNotificacion(nombreUsuario, inicio, id_aula) {
            try {
                const mensaje = `Se ha asignado una guardia a ${nombreUsuario} en el aula ${id_aula} a las ${inicio.split("T")[1]}`;

                // Insertar la notificación en la tabla 'notificacion'
                const { data: notificacion, error: notificacionError } = await supabase
                    .from('notificacion')
                    .insert([{ mensaje }])
                    .select('id')
                    .single(); // Obtener el ID de la notificación insertada

                if (notificacionError) throw new Error('Error al insertar la notificación');

                const idNotificacion = notificacion.id;

                // Obtener todos los administradores
                const { data: admins, error: adminsError } = await supabase
                    .from('usuarios')
                    .select('id')
                    .eq('tipo', 'admin');

                if (adminsError) throw new Error('Error al obtener administradores');

                if (admins.length === 0) {
                    console.warn("No hay administradores para recibir la notificación.");
                    return;
                }

                // Crear asignaciones de notificaciones para cada administrador
                const asignaciones = admins.map(admin => ({
                    id_notificacion: idNotificacion,
                    id_usuario: admin.id
                }));

                const { error: asignacionError } = await supabase
                    .from('asignaciones_notificaciones')
                    .insert(asignaciones);

                if (asignacionError) throw new Error('Error al asignar notificación a los administradores');

            } catch (error) {
                console.error("Error al generar notificación:", error);
            }
        }

        generarNotificacion(nombreUsuario, inicio, id_aula);

        // 🟢 Intentar insertar en Supabase
        const { data, error } = await supabase
            .from('asignaciones_guardia')
            .insert([{ id_guardia, id_profesor: id_usuario }]);

        if (error) {
            console.error("Error en Supabase:", error);
            return new Response(JSON.stringify({ message: 'Error adding guardia', error }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ message: 'Guardia added successfully', data }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Error procesando JSON:", error);
        return new Response(JSON.stringify({ message: 'Invalid JSON input', error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
