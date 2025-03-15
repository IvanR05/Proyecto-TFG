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

    if(pathname === "/") {
        return redirect("/Home");
    }

    return next();
}