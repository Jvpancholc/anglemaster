import { BrainCircuit, Sparkles, TrendingUp, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AnalisisIAPage() {
    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <BrainCircuit className="w-8 h-8 text-blue-500" />
                    Análisis de Mercado IA
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Deja que nuestra IA analice a tus competidores y encuentre patrones de éxito en tu nicho.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-xl hover:bg-black/60 transition-colors group cursor-pointer">
                    <CardHeader>
                        <TrendingUp className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                        <CardTitle>Tendencias de Nicho</CardTitle>
                        <CardDescription>Descubre qué ángulos están funcionando ahora mismo.</CardDescription>
                    </CardHeader>
                </Card>
                <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-xl hover:bg-black/60 transition-colors group cursor-pointer">
                    <CardHeader>
                        <Search className="w-6 h-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                        <CardTitle>Espiar Competidores</CardTitle>
                        <CardDescription>Analiza los anuncios activos de tu competencia directa.</CardDescription>
                    </CardHeader>
                </Card>
                <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-xl hover:bg-black/60 transition-colors group cursor-pointer">
                    <CardHeader>
                        <Sparkles className="w-6 h-6 text-fuchsia-400 mb-2 group-hover:scale-110 transition-transform" />
                        <CardTitle>Análisis de Reseñas</CardTitle>
                        <CardDescription>Extrae objeciones y deseos de reseñas de Amazon/Shopify.</CardDescription>
                    </CardHeader>
                </Card>
            </div>

            <Card className="border-white/10 bg-gradient-to-br from-blue-900/20 to-violet-900/20 backdrop-blur-xl shadow-2xl mt-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
                <CardHeader className="text-center pb-2 relative z-10">
                    <CardTitle className="text-2xl">Nuevo Análisis</CardTitle>
                    <CardDescription className="text-base max-w-2xl mx-auto">
                        Introduce la URL de un competidor o un término de búsqueda y generaremos un reporte de ángulos inmediatamente.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4 relative z-10 py-8">
                    <div className="w-full max-w-2xl flex gap-2">
                        <input
                            type="text"
                            placeholder="URL del competidor o palabra clave..."
                            className="flex-1 rounded-full bg-white/5 border border-white/10 px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-zinc-500"
                        />
                        <Button className="rounded-full px-8 py-4 h-auto bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                            Analizar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
