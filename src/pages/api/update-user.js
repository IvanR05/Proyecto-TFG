import { supabase } from '../../lib/supabase.js';

export async function PUT({ request }) {
  try {
    const body = await request.json();
    console.log("Datos recibidos:", body);

    //Comprobamos que estén todos los datos
    if (!body.id || typeof body.aceptado !== 'boolean' || !body.nombreAdmin) {
      return invalidResponse("Datos incompletos", 400);
    }

    // Obtener los horarios actuales del usuario
    const { data: existingSchedules, error: fetchSchedulesError } = await supabase
      .from('horarios_profesor')
      .select('*')
      .eq('id_profesor', body.id);

    if (fetchSchedulesError) throw new Error('Error al obtener los horarios existentes');

    const updatePromises = [];

    // Actualizar usuario
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

     // Obtener el nombre del usuario usando su ID
     const { data: user, error: userError } = await supabase
     .from('usuarios')
     .select('nombre')
     .eq('id', body.id)
     .single(); // Solo queremos un resultado

   if (userError) {
     throw new Error('Error al obtener el nombre del usuario');
   }

   const nombreUsuario = user?.nombre || 'Usuario desconocido'; 

    if (body.guardias && Array.isArray(body.guardias)) {
      //Se crea una nueva guardia
      const newGuardias = body.guardias.map((g) => ({
        dia_semana: g.dia,
        inicio: g.inicio,
        fin: g.fin,
        turno: g.turno,
      }));

      //Si la guardia ya no existe la borra
      const toDelete = existingSchedules.filter((existing) =>
        !newGuardias.some((newG) =>
          newG.dia_semana === existing.dia_semana &&
          newG.inicio === existing.inicio &&
          newG.fin === existing.fin &&
          newG.turno === existing.turno
        )
      );

      if (toDelete.length > 0) {
        updatePromises.push(
          supabase
            .from('horarios_profesor')
            .delete()
            .in('id', toDelete.map((g) => g.id))
        );
      }

      //crea los nuevos horarios
      const nuevasGuardias = body.guardias.map(guardia => ({
        id_profesor: body.id,
        dia_semana: guardia.dia,
        inicio: guardia.inicio,
        fin: guardia.fin,
        turno: guardia.turno
      }));

      //Inserta los horarios en la base de datos
      updatePromises.push(
        supabase
          .from('horarios_profesor')
          .upsert(nuevasGuardias)
      );
    }

    //Espera a que todo termine y comprueba si a habido errores
    const results = await Promise.all(updatePromises);
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      throw new Error(`Error en actualización: ${errors.map(e => e.error.message).join(', ')}`);
    }

    // Llamar a `generarNotificacion` después de actualizar
    await generarNotificacion(body.nombreAdmin, nombreUsuario);
    console.log(body.nombre);

    return successResponse(results.map(r => r.data));

  } catch (error) {
    return errorResponse(error);
  }
}

// Función para generar una notificación
async function generarNotificacion(nombreAdmin, nombreUsuario) {
  try {
    const mensaje = `El admin '${nombreAdmin}' ha actualizado el usuario '${nombreUsuario}'`;

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

    //Avisa si no hay administradores
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

const errorResponse = (error) => {
  console.error("Error:", error); // Log detallado del error
  return new Response(
    JSON.stringify({ 
      error: error.message,
      details: error.details || error.stack // Incluir stack trace para mejor depuración
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
