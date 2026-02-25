import { PenTool, Wand2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EstiloVisualPage() {
    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <PenTool className="w-8 h-8 text-emerald-500" />
                    Estilos Visuales
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Personaliza la estética de tus anuncios para distintos tipos de campaña.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Estilos Predefinidos */}
                {[
                    {
                        title: "Neon Cyberpunk",
                        desc: "Alta conversión en tecnología y gaming.",
                        color: "from-cyan-500 to-fuchsia-500",
                        glow: "group-hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] border-cyan-500/20"
                    },
                    {
                        title: "Minimalista Elegante",
                        desc: "Perfecto para salud, belleza y high-ticket.",
                        color: "from-neutral-300 to-neutral-500",
                        glow: "group-hover:shadow-[0_0_20px_rgba(163,163,163,0.3)] border-neutral-500/20"
                    },
                    {
                        title: "Ugc Orgánico",
                        desc: "Simula el estilo nativo de TikTok y Reels.",
                        color: "from-emerald-400 to-teal-500",
                        glow: "group-hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] border-emerald-500/20"
                    }
                ].map((estilo, i) => (
                    <Card key={i} className={`bg-black/40 backdrop-blur-md cursor-pointer transition-all duration-300 group overflow-hidden relative ${estilo.glow}`}>
                        <div className={`h-24 w-full bg-gradient-to-r ${estilo.color} opacity-20 group-hover:opacity-40 transition-opacity`} />
                        <CardHeader className="pt-4">
                            <CardTitle className="text-xl">{estilo.title}</CardTitle>
                            <CardDescription className="text-zinc-400">{estilo.desc}</CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button variant="ghost" className="w-full text-white hover:bg-white/10 flex items-center justify-between group-hover:px-6 transition-all">
                                Aplicar <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Card className="border-white/10 bg-gradient-to-br from-emerald-900/10 to-teal-900/10 backdrop-blur-md shadow-2xl relative overflow-hidden mt-4 border-dashed">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
                <CardContent className="flex flex-col items-center justify-center p-12 text-center relative z-10">
                    <Wand2 className="w-12 h-12 text-emerald-400 mb-6 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                    <h3 className="text-2xl font-bold mb-2">Editor Avanzado de Estilos</h3>
                    <p className="text-zinc-400 max-w-lg mb-8">
                        Crea un estilo visual completamente único combinando filtros, superposiciones y gradientes personalizados para tu marca.
                    </p>
                    <Button className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-8 py-6 text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        Crear Estilo Personalizado
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
