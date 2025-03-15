import { supabase } from "../../../lib/supabase.js";

export const prerender = false; // 🔥 Habilita SSR para manejar POST

export const POST = async ({ request, redirect }) => {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
        return new Response("Correo electrónico y contraseña obligatorios", { status: 400 });
    }

    // 🔎 Check if the user already exists in auth.users
    const { data: existingUser, error: userCheckError } = await supabase
        .from("usuarios")
        .select("correo")
        .eq("correo", email)

    if (existingUser) {
        return new Response("Este correo ya está registrado.", { status: 400 });
    }

    // 📝 If no existing user, proceed with the sign-up
    const { error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
        return new Response(signUpError.message, { status: 500 });
    }

    return redirect("/Login");
};
