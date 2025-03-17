import { supabase } from '../../lib/supabase.js';

// Manejar DELETE para eliminar usuarios
export async function DELETE({ request }) {
    try {
        const { id } = await request.json();
        
        if (!id) {
            return invalidResponse("ID de usuario requerido", 400);
        }

        // Obtener auth_id
        const { data: usuario, error: fetchError } = await supabase
            .from('usuarios')
            .select('auth_id')
            .eq('id', id)
            .single();

        if (fetchError || !usuario) {
            throw new Error('Usuario no encontrado');
        }

        // Eliminar de usuarios
        const { error: deleteError } = await supabase
            .from('usuarios')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        /* 
        // Eliminar de autenticación (requiere permisos admin)
        const { error: authError } = await supabase.auth.admin.deleteUser(usuario.auth_id);
        if (authError) throw authError;
        */

        return successResponse();

    } catch (error) {
        return errorResponse(error);
    }
}

// Manejar PUT para actualizaciones
export async function PUT({ request }) {
    try {
        const body = await request.json();
        
        // Validación avanzada
        if (!body.id || typeof body.aceptado !== 'boolean') {
            return invalidResponse("Datos incompletos", 400);
        }

        // Actualización segura
        const { data, error } = await supabase
            .from('usuarios')
            .update({
                nombre: body.nombre?.trim(),
                correo: body.correo?.toLowerCase().trim(),
                tipo: body.tipo,
                aceptado: body.aceptado
            })
            .eq('id', body.id)
            .select();

        if (error) throw error;

        return successResponse(data);

    } catch (error) {
        return errorResponse(error);
    }
}

// Funciones helper
const successResponse = (data = null) => new Response(
    JSON.stringify({ success: true, data }),
    { 
        status: 200,
        headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*' 
        } 
    }
);

const invalidResponse = (message, status = 400) => new Response(
    JSON.stringify({ error: message }),
    { 
        status,
        headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*' 
        } 
    }
);

const errorResponse = (error) => new Response(
    JSON.stringify({ 
        error: error.message,
        details: error.details 
    }),
    { 
        status: 500,
        headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*' 
        } 
    }
);