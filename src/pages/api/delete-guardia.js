import { supabase } from '../../lib/supabase.js';

export const prerender = false; // 🔥 Habilita SSR para manejar DELETE

export async function DELETE({ request }) {
    try {
        const bodyText = await request.text();
        console.log("Cuerpo recibido (texto):", bodyText);

        const body = JSON.parse(bodyText);
        console.log("Cuerpo parseado (JSON):", body);

        const { id, id_aula } = body;

        // 🔴 Validar que el ID no sea nulo o vacío
        if (!id) {
            console.error("Error: ID inválido", { id });
            return new Response(JSON.stringify({ message: "ID inválido" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        async function generarNotificacion(id_aula) {
            try {
                const mensaje = `Se ha eliminado una guardia para el aula ${id_aula}`;

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

        generarNotificacion(id_aula);

        // 🗑️ Intentar eliminar la guardia
        const { error } = await supabase
            .from('guardias')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error en Supabase:", error);
            return new Response(JSON.stringify({ message: 'Error deleting guardia', error }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ message: 'Guardia deleted successfully' }), {
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
