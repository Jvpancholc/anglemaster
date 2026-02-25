"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Factory, Wand2, Download, Image as ImageIcon, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import { useProjectStore } from "@/lib/store";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

export default function FabricaCreativaPage() {
    const router = useRouter();
    const { activeProjectId, projects } = useProjectStore();
    const [mounted, setMounted] = useState(false);

    const [angles, setAngles] = useState<{ id: string; text: string; selected: boolean }[]>([]);
    const [selectedAngleId, setSelectedAngleId] = useState<string>("");
    const [variantCount, setVariantCount] = useState<string>("4");

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);

    useEffect(() => {
        setMounted(true);
        if (!activeProjectId) {
            router.push("/");
            return;
        }

        const project = projects.find(p => p.id === activeProjectId);
        if (project && project.angles) {
            const selectedOnly = project.angles.filter(a => a.selected);
            setAngles(selectedOnly);
            if (selectedOnly.length > 0) {
                setSelectedAngleId(selectedOnly[0].id);
            }
        }
    }, [activeProjectId, projects, router]);

    const handleGenerate = () => {
        if (!selectedAngleId) return;
        setIsGenerating(true);

        // Simular generación de imágenes con Picsum API (añadimos timestamp para engañar caché)
        setTimeout(() => {
            const count = parseInt(variantCount);
            const newImages = Array.from({ length: count }).map((_, i) =>
                `https://picsum.photos/seed/${crypto.randomUUID()}/400/600`
            );
            setGeneratedImages(newImages);
            setIsGenerating(false);
            toast.success("Creativos generados exitosamente.");
        }, 2000);
    };

    const handleDownloadAll = () => {
        toast.info("Descarga iniciada (Simulación).");
    };

    if (!mounted) return null;

    if (angles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
                    <AlertTriangle className="w-10 h-10 text-rose-500" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-4">No hay ángulos seleccionados</h1>
                <p className="text-zinc-400 text-lg max-w-md mx-auto mb-8">
                    Para generar creativos necesitas la materia prima. Vuelve a la sección de Ángulos y selecciona al menos uno.
                </p>
                <Link href="/angulos">
                    <Button className="bg-white hover:bg-zinc-200 text-black px-8 py-6 rounded-full font-bold">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Volver a Ángulos
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="text-center sm:text-left flex flex-col items-center sm:items-start">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400 font-medium mb-4">
                    <Factory className="w-3.5 h-3.5" />
                    Producción Final
                </div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">
                    Fábrica <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Creativa</span>
                </h1>
                <p className="text-zinc-400 text-lg max-w-2xl">
                    Combina tus formatos, estilo visual y ángulos seleccionados para renderizar anuncios listos para publicar.
                </p>
            </div>

            <Card className="bg-zinc-950/60 border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

                <CardContent className="p-6 sm:p-8 space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                                Ángulo a Renderizar
                            </label>
                            <Select value={selectedAngleId} onValueChange={setSelectedAngleId}>
                                <SelectTrigger className="w-full bg-black/50 border-white/10 h-14 text-base focus:ring-cyan-500 rounded-xl">
                                    <SelectValue placeholder="Selecciona un ángulo" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10">
                                    {angles.map((a) => (
                                        <SelectItem key={a.id} value={a.id} className="py-3 cursor-pointer">
                                            <span className="line-clamp-1">{a.text}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                                Número de Variantes
                            </label>
                            <Select value={variantCount} onValueChange={setVariantCount}>
                                <SelectTrigger className="w-full bg-black/50 border-white/10 h-14 text-base focus:ring-cyan-500 rounded-xl">
                                    <SelectValue placeholder="Cantidad" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10">
                                    {[1, 2, 4, 6, 8, 10].map((num) => (
                                        <SelectItem key={num.toString()} value={num.toString()} className="cursor-pointer">
                                            {num} {num === 1 ? 'Variante' : 'Variantes'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-between items-center">
                        <p className="text-xs text-zinc-500 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                            Modelos listos. Consumirá {variantCount} créditos.
                        </p>
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className={`px-8 py-6 rounded-full font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all ${isGenerating
                                    ? "bg-zinc-800 text-zinc-400 border border-white/5"
                                    : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
                                }`}
                        >
                            {isGenerating ? (
                                <span className="flex items-center gap-2 text-base">
                                    <Wand2 className="w-5 h-5 animate-spin" /> Renderizando...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 text-base">
                                    <Wand2 className="w-5 h-5" /> Generar Creativos
                                </span>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Galería de Resultados */}
            {generatedImages.length > 0 && (
                <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <ImageIcon className="w-6 h-6 text-cyan-400" /> Resultados Generados
                        </h2>
                        <Button onClick={handleDownloadAll} variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-full px-6">
                            <Download className="w-4 h-4 mr-2" /> Descargar Todas
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {generatedImages.map((src, index) => (
                            <div key={index} className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-zinc-900 border border-white/10 shadow-xl">
                                <img
                                    src={src}
                                    alt={`Variante ${index + 1}`}
                                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <div className="flex gap-2 w-full">
                                        <Button size="sm" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">
                                            <Download className="w-4 h-4 mr-1" /> HD
                                        </Button>
                                        <Button size="sm" variant="outline" className="w-full bg-black/50 border-white/20 hover:bg-white/10 text-white">
                                            Guardar
                                        </Button>
                                    </div>
                                </div>
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20">
                                        <span className="text-xs font-bold text-white">#{index + 1}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
