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
// Manejar PUT para actualizaciones
export async function PUT({ request }) {
    try {
        const body = await request.json();
        
        // Validación avanzada
        if (!body.id || typeof body.aceptado !== 'boolean') {
            return invalidResponse("Datos incompletos", 400);
        }

        // Iniciar transacción
        const updatePromises = [];

        // Actualización de datos básicos
        updatePromises.push(
            supabase
                .from('usuarios')
                .update({
                    nombre: body.nombre?.trim(),
                    correo: body.correo?.toLowerCase().trim(),
                    tipo: body.tipo,
                    aceptado: body.aceptado,
                    turno: body.turno
                })
                .eq('id', body.id)
        );

        // Actualización de guardias si existen
        if (body.guardias && Array.isArray(body.guardias)) {
            // Eliminar guardias existentes
            await supabase
                .from('horarios_profesor')
                .delete()
                .eq('id_profesor', body.id);

            // Insertar nuevas guardias si hay
            if (body.guardias.length > 0) {
                const nuevasGuardias = body.guardias.map(guardia => ({
                    id_profesor: body.id,
                    dia_semana: guardia.dia,
                    inicio: guardia.inicio,
                    fin: guardia.fin,
                    turno: guardia.turno
                }));

                updatePromises.push(
                    supabase
                        .from('horarios_profesor')
                        .insert(nuevasGuardias)
                );
            }
        }

        // Ejecutar todas las operaciones
        const results = await Promise.all(updatePromises);
        
        // Verificar errores
        const errors = results.filter(r => r.error);
        if (errors.length > 0) {
            throw new Error(`Error en actualización: ${errors.map(e => e.error.message).join(', ')}`);
        }

        return successResponse(results.map(r => r.data));

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