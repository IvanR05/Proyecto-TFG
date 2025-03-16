import { supabase } from '../../lib/supabase.js';

export const prerender = false; // 🔥 Habilita SSR para manejar POST

export async function POST({ request }) {
    try {
        const bodyText = await request.text(); // ⬅️ Leer como texto
        console.log("Cuerpo recibido (texto):", bodyText); // 🔍 Ver qué llega

        const body = JSON.parse(bodyText); // ⬅️ Intentar convertirlo en JSON
        console.log("Cuerpo parseado (JSON):", body);

        const { id_guardia, id_usuario } = body;

        // 🔴 Validar que los campos importantes no sean nulos o vacíos
        if (!id_guardia || !id_usuario) {
            console.error("Error: Datos inválidos");
            return new Response(JSON.stringify({ message: "Datos inválidos" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

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
