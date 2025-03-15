/*export function onRequest({ request, cookies, redirect }, next) {
    const accessToken = cookies.get("sb-access-token")?.value;

    if (request.url.includes("/Login") || request.url.includes("/Register")) {
        return next(); // Allow the login page to be accessible
    }

    // Si no hay accessToken, redirigir a la página de login
    if (!accessToken) {
        return redirect("/Login"); // Redirige si no está autenticado
    }

    // Si hay accessToken, continuar con la solicitud
    return next();
}*/

export function onRequest({ request, redirect, url, cookies }, next) {
    const pathname = url.pathname;
    const isAuthRoute = pathname === "/Login" || pathname === "/Register";

    // Allow auth pages, static assets, and auth API routes
    if (
        isAuthRoute ||
        pathname.startsWith("/_astro/") ||
        pathname.startsWith("/public/") ||
        pathname.startsWith("/api/auth/") // Add your auth API routes here
    ) {
        return next();
    }

    const authToken = cookies.get("sb-access-token")?.value;

    // Redirect unauthenticated users to login
    if (!authToken) {
        return redirect(`/Login?redirect=${encodeURIComponent(pathname)}`);
    }

    return next();
}