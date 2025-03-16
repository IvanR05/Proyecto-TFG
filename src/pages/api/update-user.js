import { supabase } from '../../lib/supabase.js';

export async function POST({ request }) {
    try {
        const { id, aceptado } = await request.json();
        
        // Validación reforzada
        if (!id || typeof aceptado !== 'boolean') {
            return new Response(
                JSON.stringify({ error: "Datos inválidos" }),
                { 
                    status: 400, 
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*' 
                    } 
                }
            );
        }

        if (!aceptado) {
            // Obtener el auth_id antes de eliminar el usuario
            const { data: usuario, error: fetchError } = await supabase
                .from('usuarios')
                .select('auth_id')
                .eq('id', id)
                .single();

            if (fetchError || !usuario) {
                throw new Error('No se pudo encontrar el usuario');
            }

            const authId = usuario.auth_id; // Obtener el ID real de auth.users

            // Eliminar el usuario de la tabla 'usuarios'
            const { error: userError } = await supabase
                .from('usuarios')
                .delete()
                .eq('id', id);

            if (userError) {
                throw new Error(userError.message);
            }

            /*
            // Intentar eliminar el usuario de 'auth.users'
            const { error: authError } = await supabase.auth.admin.deleteUser(authId);

            if (authError) {
                throw new Error(authError.message);
            }
                */
        } else {
            // Si el usuario es aceptado, solo actualizamos el estado en la tabla 'usuarios'
            const { error } = await supabase
                .from('usuarios')
                .update({ aceptado })
                .eq('id', id);

            if (error) throw error;
        }

        return new Response(
            JSON.stringify({ success: true }),
            { 
                status: 200,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*' 
                } 
            }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { 
                status: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*' 
                } 
            }
        );
    }
}
