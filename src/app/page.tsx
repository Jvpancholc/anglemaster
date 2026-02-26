import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { ArrowRight, Sparkles, Zap, Image as ImageIcon, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
    // Si ya tiene sesión iniciada, va directo al dashboard
    const { userId } = await auth();
    if (userId) {
        redirect("/dashboard");
    }

    return (
        <div className="flex flex-col min-h-screen bg-black text-white selection:bg-pink-500/30">
            {/* Nav */}
            <header className="flex items-center justify-between p-6 border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">AngleMaster</span>
                </div>
                <div className="flex items-center gap-4">
                    <SignedOut>
                        <SignInButton fallbackRedirectUrl="/dashboard" mode="modal">
                            <Button variant="ghost" className="text-zinc-300 hover:text-white font-medium">Iniciar Sesión</Button>
                        </SignInButton>
                        <SignUpButton fallbackRedirectUrl="/dashboard" mode="modal">
                            <Button className="bg-white text-black hover:bg-zinc-200 rounded-full px-6 font-semibold shadow-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all">Registro</Button>
                        </SignUpButton>
                    </SignedOut>
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
                    <SignUpButton fallbackRedirectUrl="/dashboard" mode="modal">
                        <Button className="bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-500 hover:to-orange-500 text-white rounded-full px-8 py-6 text-lg font-bold shadow-[0_0_30px_rgba(236,72,153,0.3)] border-0">
                            Empezar Gratis <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </SignUpButton>
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
        </div>
    );
}
