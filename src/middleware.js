export function onRequest({ request, redirect, url, cookies }, next) {
    const pathname = url.pathname;
    const isAuthRoute = pathname === "/Login" || pathname === "/Register";

    // Allow auth pages, static assets, and auth API routes
    if (
        isAuthRoute ||
        pathname.startsWith("/_astro/") ||
        pathname.startsWith("/public/") ||
        pathname.includes("/auth/login") ||
        pathname.includes("/auth/logout") 
    ) {
        return next();
    }

    const authToken = cookies.get("sb-access-token")?.value;

    // Redirect unauthenticated users to login
    if (!authToken) {
        return redirect(`/Login?redirect=${encodeURIComponent(pathname)}`);
    }

    
    if (pathname.startsWith("/api/")) {
        const referer = request.headers.get("referer"); // 🌍 De dónde viene la petición
        const accept = request.headers.get("accept"); // 📦 Qué tipo de respuesta espera

        // 🚫 Bloquear si no hay Referer o no viene de nuestra web
        if (!referer) {
            return new Response("Acceso denegado", { status: 403 });
        }

        // 🚫 Bloquear si espera HTML (indica que alguien puso la URL en el navegador)
        if (accept && accept.includes("text/html")) {
            return new Response("Acceso denegado", { status: 403 });
        }
    }



    if(pathname === "/") {
        return redirect("/Home");
    }

    return next();
}