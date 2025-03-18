import { supabase } from '../../lib/supabase.js';

export const prerender = false; // 🔥 Habilita SSR para manejar DELETE

export async function DELETE({ request }) {
    try {
        const bodyText = await request.text();
        console.log("Cuerpo recibido (texto):", bodyText);

        const body = JSON.parse(bodyText);
        console.log("Cuerpo parseado (JSON):", body);

        const { id_aula } = body;

        // 🔴 Validar que el ID no sea nulo o vacío
        if (!id_aula) {
            console.error("Error: ID inválido", { id_aula });
            return new Response(JSON.stringify({ message: "ID inválido" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // 🗑️ Intentar eliminar el aula
        const { error } = await supabase
            .from('aulas')
            .delete()
            .eq('id_aula', id_aula);

        if (error) {
            console.error("Error en Supabase:", error);
            return new Response(JSON.stringify({ message: 'Error deleting aula', error }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ message: 'Aula deleted successfully' }), {
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
