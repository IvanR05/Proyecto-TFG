import { supabase } from '../lib/supabase.js';

export const post = async ({ request }) => {
    try {
        const { id, aceptado } = await request.json();
        
        // Validación de datos
        if (!id || typeof aceptado !== 'boolean') {
            return new Response('Datos inválidos', { status: 400 });
        }

        // Actualizar usuario en Supabase
        const { error } = await supabase
            .from('usuarios')
            .update({ 
                aceptado,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error en API:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Error del servidor' }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};