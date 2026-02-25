import { Factory, Play, Image as ImageIcon, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FabricaPage() {
    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Factory className="w-8 h-8 text-yellow-500" />
                        La Fábrica
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        El motor central de AngleMaster. Usa tus configuraciones para generar creativos en lote.
                    </p>
                </div>
                <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white gap-2">
                    <Settings className="w-4 h-4" /> Ajustes de Render
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Generador de Imágenes */}
                <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 transition-opacity opacity-50 group-hover:opacity-100" />
                    <CardHeader className="relative z-10">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                            <ImageIcon className="text-white w-6 h-6" />
                        </div>
                        <CardTitle className="text-2xl">Creativos Estáticos</CardTitle>
                        <CardDescription>Genera imágenes de alta conversión en formato cuadrado o historia.</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-4">
                        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <p className="text-sm font-medium text-yellow-400 mb-2">Configuración Activa</p>
                            <ul className="text-sm text-zinc-300 space-y-1">
                                <li>• Ángulo: <span className="text-white">El Problema Urgente</span></li>
                                <li>• Formato: <span className="text-white">Story (1080x1920)</span></li>
                                <li>• Estilo: <span className="text-white">Neon Cyberpunk</span></li>
                            </ul>
                        </div>
                        <Button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_25px_rgba(234,179,8,0.5)] transition-all">
                            Generar x5 Imágenes
                        </Button>
                    </CardContent>
                </Card>

                {/* Generador de Videos */}
                <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 transition-opacity opacity-50 group-hover:opacity-100" />
                    <CardHeader className="relative z-10">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-cyan-500 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                            <Play className="text-white w-6 h-6 ml-1" />
                        </div>
                        <CardTitle className="text-2xl">Video Ads (Próximamente)</CardTitle>
                        <CardDescription>Crea videos cortos UGC o animaciones a partir de tus ángulos.</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-4">
                        <div className="bg-white/5 p-4 rounded-lg border border-white/10 opacity-50 cursor-not-allowed">
                            <p className="text-sm font-medium text-indigo-400 mb-2">En desarrollo</p>
                            <p className="text-sm text-zinc-400">
                                Estamos entrenando nuestros modelos para generar videos que capturen la atención en los primeros 3 segundos.
                            </p>
                        </div>
                        <Button disabled className="w-full bg-white/10 text-zinc-500">
                            No Disponible
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col text-center mt-10 p-8 border border-white/10 rounded-2xl bg-gradient-to-b from-white/5 to-transparent backdrop-blur-sm">
                <h3 className="text-xl font-medium mb-2">Progreso del Mes</h3>
                <p className="text-zinc-400 max-w-md mx-auto mb-4">
                    Tienes disponibles 150 créditos para generar imágenes este mes.
                </p>
                <div className="w-full max-w-md mx-auto h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full" />
                </div>
                <p className="text-sm text-yellow-500 mt-2 font-medium">50 / 150 Usados</p>
            </div>
        </div>
    );
}
