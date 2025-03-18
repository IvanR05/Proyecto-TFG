import { supabase } from '../../lib/supabase.js';

export const prerender = false; // 🔥 Habilita SSR para manejar POST

export async function POST({ request }) {
    try {
        const bodyText = await request.text(); // ⬅️ Leer como texto
        console.log("Cuerpo recibido (texto):", bodyText);

        const body = JSON.parse(bodyText); // ⬅️ Intentar convertirlo en JSON
        console.log("Cuerpo parseado (JSON):", body);

        const { id_aula, curso } = body;  // ⚠️ Cambiar nombres según la base de datos

        // 🔴 Validar que los campos no sean nulos o vacíos
        if (!id_aula || !curso) {
            console.error("Error: Datos inválidos", { id_aula, curso });
            return new Response(JSON.stringify({ message: "Datos inválidos" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // 🛑 Verificar si el aula ya existe antes de insertarla
        const { data: existingAula, error: selectError } = await supabase
            .from('aulas')
            .select('id_aula')
            .eq('id_aula', id_aula)
            .single();

        if (selectError && selectError.code !== 'PGRST116') {
            console.error("Error verificando aula existente:", selectError);
            return new Response(JSON.stringify({ message: 'Error checking aula', selectError }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (existingAula) {
            return new Response(JSON.stringify({ message: "El aula ya existe" }), {
                status: 409, // Código 409: Conflicto (ya existe)
                headers: { "Content-Type": "application/json" }
            });
        }

        // 🟢 Insertar aula en Supabase
        const { data, error } = await supabase
            .from('aulas')
            .insert([{ id_aula, curso }]);

        if (error) {
            console.error("Error en Supabase:", error);
            return new Response(JSON.stringify({ message: 'Error añadiendo aula', error }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ message: 'Aula añadida correctamente', data }), {
            status: 201, // Código 201: Creado
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Error procesando JSON:", error);
        return new Response(JSON.stringify({ message: 'Entrada JSON inválida', error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}