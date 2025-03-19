import { supabase } from '../../lib/supabase.js';

export async function PUT({ request }) {
  try {
    const body = await request.json();

    // Validación avanzada
    if (!body.id || typeof body.aceptado !== 'boolean') {
      return invalidResponse("Datos incompletos", 400);
    }

    // Obtener los horarios actuales del usuario
    const { data: existingSchedules, error: fetchSchedulesError } = await supabase
      .from('horarios_profesor')
      .select('*')
      .eq('id_profesor', body.id);

    if (fetchSchedulesError) throw new Error('Error al obtener los horarios existentes');

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
        })
        .eq('id', body.id)
    );

    // Comparar horarios existentes con los nuevos
    if (body.guardias && Array.isArray(body.guardias)) {
      // Eliminar los horarios existentes que no estén en los nuevos
      const newGuardias = body.guardias.map((g) => ({
        dia_semana: g.dia,
        inicio: g.inicio,
        fin: g.fin,
        turno: g.turno,
      }));

      // Filtrar los horarios que necesitan ser eliminados
      const toDelete = existingSchedules.filter((existing) => 
        !newGuardias.some((newG) =>
          newG.dia_semana === existing.dia_semana &&
          newG.inicio === existing.inicio &&
          newG.fin === existing.fin &&
          newG.turno === existing.turno
        )
      );

      // Eliminar los horarios que no coinciden
      if (toDelete.length > 0) {
        updatePromises.push(
          supabase
            .from('horarios_profesor')
            .delete()
            .in('id', toDelete.map((g) => g.id))
        );
      }

      // Insertar los nuevos horarios
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
          .upsert(nuevasGuardias) // Usar upsert para insertar o actualizar
      );
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

// Modify the error response to log the error details
const errorResponse = (error) => {
    console.error("Error:", error); // Log the full error to server logs
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.details || error.stack  // Include stack trace for better debugging
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' 
        } 
      }
    );
  };
  
