import { supabase } from "../../../lib/supabase.js";

export const GET = async () => {
    const { data, error } = await supabase
        .from("usuarios")
        .select("id, nombre, correo")
        .eq("aceptado", false);

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
};
