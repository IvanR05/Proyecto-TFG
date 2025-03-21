// pages/api/update-guardia.js
import { supabase } from '../../lib/supabase.js';

export const prerender = false;

export async function PUT({ request }) {
    try {
        const body = await request.json();
        console.log("Datos recibidos:", body);

        // Validación de campos requeridos
        if (!body.id || !body.inicio || !body.fin || !body.tipo || !body.id_aula) {
            return new Response(JSON.stringify({ 
                message: "Faltan campos requeridos: id, inicio, fin, tipo, id_aula" 
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Verificar que el aula exista
        const { data: aulaExistente, error: errorAula } = await supabase
            .from('aulas')
            .select('id_aula')
            .eq('id_aula', body.id_aula)
            .single();

        if (errorAula || !aulaExistente) {
            return new Response(JSON.stringify({ 
                message: "El aula especificada no existe" 
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Convertir fechas a objetos Date
        // En tu función PUT, antes de guardar en Supabase
        const inicio = new Date(body.inicio);
        const fin = new Date(body.fin);
        
        //TODO Validar fechas
        const inicioLocal = new Date(inicio.getTime() - inicio.getTimezoneOffset() * 60000) // Ajusta a la zona horaria local
        .toISOString()

        const finLocal = new Date(fin.getTime() - fin.getTimezoneOffset() * 60000) // Ajusta a la zona horaria local
        .toISOString()

        // Actualizar la guardia
        const { data, error } = await supabase
            .from('guardias')
            .update({
                inicio: inicioLocal, // Usar ISO string con offset
                fin: finLocal,
                tipo: body.tipo,
                id_aula: body.id_aula,
                observaciones: body.observaciones || null,
                ausencias: body.ausencias || null
            })
            .eq('id', body.id)
            .select();

        if (error) {
            console.error("Error en Supabase:", error);
            return new Response(JSON.stringify({ 
                message: "Error actualizando la guardia",
                error: error.message 
            }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (!data) {
            return new Response(JSON.stringify({ 
                message: "Guardia no encontrada" 
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        async function generarNotificacion(id_aula) {
            try {
                const mensaje = `Se ha editado una guardia para el aula ${id_aula}`;

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


        generarNotificacion(body.id_aula);
        return new Response(JSON.stringify({ 
            message: "Guardia actualizada correctamente",
            data: data[0]
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Error procesando la solicitud:", error);
        return new Response(JSON.stringify({ 
            message: "Error interno del servidor",
            error: error.message 
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}