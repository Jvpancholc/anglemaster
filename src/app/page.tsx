"use client";

import { useAuth } from "@clerk/nextjs";
import { ArrowRight, Sparkles, Zap, Image as ImageIcon, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LandingPage() {
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isLoaded && isSignedIn) {
            router.replace("/dashboard");
        }
    }, [isLoaded, isSignedIn, router]);

    if (!mounted) return null;

    return (
        <div className="flex flex-col min-h-screen bg-black text-white selection:bg-pink-500/30">
            {/* Promotional Banner */}
            <div className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-3 text-center sm:px-6 lg:px-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] animate-[shimmer_3s_infinite]" />

                <p className="text-sm font-semibold text-white relative z-10 mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-center gap-2">
                    <span className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-yellow-300 animate-pulse" />
                        <span className="bg-white/20 px-2 py-0.5 rounded text-xs tracking-wider uppercase backdrop-blur-sm mr-1">Oferta Flash</span>
                    </span>
                    <span>
                        Solo por tiempo limitado: la app creativa desde <strong className="text-yellow-300">$49.99/mensual</strong> con planes exclusivos.
                    </span>
                    <span className="hidden sm:inline-block mx-2 opacity-50">•</span>
                    <Link href="/sign-in" className="underline decoration-white/50 underline-offset-4 hover:decoration-white transition-all font-bold group-hover:text-yellow-200">
                        Acceder
                    </Link>
                </p>
            </div>

            {/* Nav */}
            <header className="flex items-center justify-between p-6 border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">AngleMaster</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/sign-in">
                        <Button className="bg-white text-black hover:bg-zinc-200 rounded-full px-6 font-semibold shadow-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all">Iniciar Sesión</Button>
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.15),transparent_50%)] pointer-events-none" />

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400 font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Zap className="w-3 h-3" /> La revolución para E-commerce
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter max-w-4xl mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    Crea anuncios ganadores con Inteligencia Artificial.
                </h1>

                <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    AngleMaster centraliza tu identidad de marca, genera ángulos psicológicos y produce creativos de alta conversión en segundos.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-1000 z-10">
                    <Link href="/sign-in">
                        <Button className="bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-500 hover:to-orange-500 text-white rounded-full px-10 py-7 text-xl font-bold shadow-[0_0_40px_rgba(236,72,153,0.3)] border-0 transition-transform hover:scale-105">
                            Acceso Privado <ArrowRight className="w-6 h-6 ml-2" />
                        </Button>
                    </Link>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl w-full text-left relative z-10">
                    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm shadow-xl">
                        <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center mb-4 border border-pink-500/20">
                            <Sparkles className="w-6 h-6 text-pink-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Ángulos de Venta</h3>
                        <p className="text-zinc-400 text-sm">Descubre docenas de ángulos persuasivos creados por IA basándose en el ADN de tu producto.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm shadow-xl">
                        <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 border border-violet-500/20">
                            <ImageIcon className="w-6 h-6 text-violet-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Fábrica Creativa</h3>
                        <p className="text-zinc-400 text-sm">Genera imágenes hiperrealistas, ilustraciones o renders 3D que integren tu producto perfectamente.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm shadow-xl">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                            <LayoutTemplate className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Formatos Listos</h3>
                        <p className="text-zinc-400 text-sm">Desde layouts de noticiero hasta infografías de beneficios. Todo listo para exportar a Meta Ads.</p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 bg-black py-8 px-6">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-zinc-500">
                    <p>&copy; {new Date().getFullYear()} AngleMaster. Todos los derechos reservados.</p>
                    <div className="flex gap-6">
                        <Link href="/terms" className="hover:text-zinc-300 transition-colors">Términos y Privacidad</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
