"use client";

import { SignUp, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SignUpPage() {
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();
    const [redirectTimeout, setRedirectTimeout] = useState(false);

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            router.replace("/dashboard");
        }
    }, [isLoaded, isSignedIn, router]);

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            const timer = setTimeout(() => setRedirectTimeout(true), 6000);
            return () => clearTimeout(timer);
        }
    }, [isLoaded, isSignedIn]);

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-500 text-sm">Cargando...</p>
                </div>
            </div>
        );
    }

    if (isSignedIn) {
        if (redirectTimeout) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-black">
                    <div className="flex flex-col items-center gap-4 max-w-md text-center p-6">
                        <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mb-2">
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <h2 className="text-white text-lg font-semibold">Problema de sincronización</h2>
                        <p className="text-zinc-400 text-sm">
                            Tu sesión es válida pero la redirección falló. Sincroniza el reloj del sistema.
                        </p>
                        <a href="/dashboard" className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 px-6 rounded-full text-center transition-colors">
                            Ir al Dashboard manualmente
                        </a>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-500 text-sm">Redirigiendo al dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <SignUp
                fallbackRedirectUrl="/dashboard"
                appearance={{
                    elements: {
                        rootBox: "w-full max-w-md",
                        cardBox: "bg-zinc-900 border border-white/10 shadow-2xl",
                        card: "bg-zinc-900",
                        headerTitle: "text-white",
                        headerSubtitle: "text-zinc-400",
                        socialButtonsBlockButton: "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700",
                        socialButtonsBlockButtonText: "text-white",
                        formButtonPrimary: "bg-purple-600 hover:bg-purple-500",
                        formFieldLabel: "text-zinc-300",
                        formFieldInput: "bg-zinc-800 border-zinc-700 text-white",
                        footerActionLink: "text-purple-400 hover:text-purple-300",
                        identityPreviewText: "text-white",
                        identityPreviewEditButton: "text-purple-400",
                        formFieldInputShowPasswordButton: "text-zinc-400",
                        dividerLine: "bg-zinc-700",
                        dividerText: "text-zinc-500",
                    },
                }}
            />
        </div>
    );
}
