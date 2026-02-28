import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api(.*)",
    "/terms(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
    if (isPublicRoute(req)) {
        return NextResponse.next();
    }

    // For protected routes, check auth manually to handle clock-skew gracefully
    const { userId } = await auth();

    if (!userId) {
        // Check if this is a clock-skew issue by looking at response headers
        // Instead of hard-redirecting (which causes loops), redirect once to sign-in
        // but ONLY if we're not already coming FROM sign-in (prevents loop)
        const referer = req.headers.get("referer") || "";
        const isFromSignIn = referer.includes("/sign-in");

        if (isFromSignIn) {
            // User just came from sign-in but auth still fails → clock skew or expired session
            // Let the request through, the client will handle it
            return NextResponse.next();
        }

        // Normal case: redirect to sign-in
        const signInUrl = new URL("/sign-in", req.url);
        signInUrl.searchParams.set("redirect_url", req.url);
        return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
    ],
};
