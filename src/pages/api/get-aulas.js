import { supabase } from '../../lib/supabase.js';

export const prerender = false; // Habilita SSR para manejar POST

export async function GET() {
    const { data, error } = await supabase
        .from('aulas')
        .select('*'); 
    
    if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}