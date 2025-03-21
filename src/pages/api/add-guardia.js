import { supabase } from '../../lib/supabase.js';

export const prerender = false; // 🔥 Habilita SSR para manejar POST

export async function POST({ request }) {
    try {
        const bodyText = await request.text(); // ⬅️ Leer como texto
        console.log("Cuerpo recibido (texto):", bodyText); // 🔍 Ver qué llega

        const body = JSON.parse(bodyText); // ⬅️ Intentar convertirlo en JSON
        console.log("Cuerpo parseado (JSON):", body);

        const { tipo, inicio, fin, observaciones, ausencias, id_aula, profesor_ausente } = body;

        // 🔴 Validar que los campos importantes no sean nulos o vacíos
        if (!tipo || !inicio || !fin || !id_aula) {
            console.error("Error: Datos inválidos", { tipo, inicio, fin, id_aula });
            return new Response(JSON.stringify({ message: "Datos inválidos" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        async function generarNotificacion(id_aula) {
            try {
                const mensaje = `Se ha creado una guardia para el aula ${id_aula} a las ${inicio.split("T")[1]}`;

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

        

        const { data, error } = await supabase
            .from('guardias')
            .insert([{ tipo, inicio, fin, observaciones, ausencias, id_aula, profesor_ausente }]);

        generarNotificacion(id_aula);

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
