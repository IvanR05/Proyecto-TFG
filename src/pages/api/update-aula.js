import { supabase } from '../../lib/supabase.js';

export const prerender = false; // 🔥 Habilita SSR para manejar PUT

export async function PUT({ request }) {
    try {
        const bodyText = await request.text();
        console.log("Cuerpo recibido (texto):", bodyText);

        const body = JSON.parse(bodyText);
        console.log("Cuerpo parseado (JSON):", body);

        const { id_original, id_nuevo, curso_nuevo } = body;

        // 🔴 Validar que los datos sean correctos
        if (!id_original || (!id_nuevo && !curso_nuevo)) {
            console.error("Error: Datos inválidos", { id_original, id_nuevo, curso_nuevo });
            return new Response(JSON.stringify({ message: "Datos inválidos" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // 🛑 Verificar si el aula original existe
        const { data: existingAula, error: selectError } = await supabase
            .from('aulas')
            .select('id_aula')
            .eq('id_aula', id_original)
            .single();

        if (selectError) {
            console.error("Error buscando el aula:", selectError);
            return new Response(JSON.stringify({ message: "Error buscando el aula", selectError }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (!existingAula) {
            return new Response(JSON.stringify({ message: "El aula no existe" }), {
                status: 404, // Código 404: No encontrado
                headers: { "Content-Type": "application/json" }
            });
        }

        // 🛑 Si se cambia el ID del aula, asegurarse de que no haya duplicados
        if (id_nuevo && id_nuevo !== id_original) {
            const { data: aulaDuplicada, error: errorDuplicado } = await supabase
                .from('aulas')
                .select('id_aula')
                .eq('id_aula', id_nuevo)
                .single();

            if (aulaDuplicada) {
                return new Response(JSON.stringify({ message: "El nuevo ID ya existe" }), {
                    status: 409, // Código 409: Conflicto
                    headers: { "Content-Type": "application/json" }
                });
            }

            if (errorDuplicado && errorDuplicado.code !== 'PGRST116') {
                console.error("Error verificando duplicados:", errorDuplicado);
                return new Response(JSON.stringify({ message: "Error al verificar duplicados", errorDuplicado }), {
                    status: 500,
                    headers: { "Content-Type": "application/json" }
                });
            }
        }

        // 🔄 Construir el objeto de actualización
        const updateData = {};
        if (id_nuevo) updateData.id_aula = id_nuevo;
        if (curso_nuevo) updateData.curso = curso_nuevo;

        // 🟢 Actualizar el aula en Supabase
        const { data, error } = await supabase
            .from('aulas')
            .update(updateData)
            .eq('id_aula', id_original);

        if (error) {
            console.error("Error en Supabase:", error);
            return new Response(JSON.stringify({ message: "Error actualizando aula", error }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({ message: "Aula actualizada correctamente", data }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Error procesando JSON:", error);
        return new Response(JSON.stringify({ message: "Entrada JSON inválida", error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
        });
    }
}