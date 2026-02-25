"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Factory, Wand2, Download, Image as ImageIcon, AlertTriangle, ArrowLeft } from "lucide-react";
import { useProjectStore } from "@/lib/store";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const FALLBACK_CONTEXT = {
    visualStyle: "3D Render",
    creativeFormats: ["Noticiero"],
    identity: {
        primaryColor: "#4F46E5",
        secondaryColor: "#EC4899",
    },
    analysis: {
        product: "Curso de marketing digital",
    }
};
const FALLBACK_ANGLES = [
    { id: "fallback-1", text: "Ahorra 10 horas semanales automatizando procesos clave." },
    { id: "fallback-2", text: "El método exacto para escalar tu agencia a 6 cifras." }
];

export default function FabricaCreativaPage() {
    const router = useRouter();
    const { activeProjectId, projects } = useProjectStore();
    const [mounted, setMounted] = useState(false);

    const [angles, setAngles] = useState<{ id: string; text: string }[]>([]);
    const [selectedAngleId, setSelectedAngleId] = useState<string>("");
    const [variantCount, setVariantCount] = useState<string>("4");

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [projectContext, setProjectContext] = useState<any>(null);

    useEffect(() => {
        setMounted(true);
        const project = activeProjectId ? projects.find(p => p.id === activeProjectId) : null;

        if (project && project.angles && project.angles.length > 0) {
            // Include ALL angles
            setAngles(project.angles);
            // Pre-select the first one that was "selected" previously, or just the first one
            const previouslySelected = project.angles.find((a: any) => a.selected);
            setSelectedAngleId(previouslySelected ? previouslySelected.id : project.angles[0].id);

            // Collect context for the prompt
            setProjectContext({
                creativeFormats: project.creativeFormats,
                visualStyle: project.visualStyle,
                identity: project.identity,
                analysis: project.analysis
            });
        } else {
            // FALLBACK DUMMY DATA OR NO ANGLES
            if (!activeProjectId) {
                setAngles(FALLBACK_ANGLES);
                setSelectedAngleId(FALLBACK_ANGLES[0].id);
                setProjectContext(FALLBACK_CONTEXT);
                toast.info("Modo demostración: utilizando datos de ejemplo porque no hay proyecto activo.");
            } else {
                setAngles([]);
            }
        }
    }, [activeProjectId, projects]);

    const handleGenerate = async () => {
        if (!selectedAngleId) return;
        setIsGenerating(true);
        setGeneratedImages([]);

        try {
            const angleObj = angles.find(a => a.id === selectedAngleId);

            const payload = {
                projectId: activeProjectId || "demo-project",
                angleId: selectedAngleId,
                numVariants: variantCount,
                context: {
                    ...projectContext,
                    angleText: angleObj?.text
                }
            };

            const res = await fetch("/api/generate-creatives", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                throw new Error("Error en la respuesta del servidor");
            }

            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setGeneratedImages(data.images || []);
            toast.success("Creativos generados existosamente.");
        } catch (error: any) {
            console.error("Generación fallida:", error);
            toast.error(error.message || "Error al conectar con la API de generación.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadAll = async () => {
        if (generatedImages.length === 0) return;

        toast.info("Preparando archivo ZIP para descargar...");
        try {
            const zip = new JSZip();

            // Fetch each image as a blob
            const imagePromises = generatedImages.map(async (url, idx) => {
                const response = await fetch(url);
                const blob = await response.blob();
                zip.file(`creativo_${idx + 1}.png`, blob);
            });

            await Promise.all(imagePromises);

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, "creativos_anglemaster.zip");
            toast.success("¡Descarga completada!");
        } catch (error) {
            console.error("Error al descargar ZIP:", error);
            toast.error("Hubo un problema al crear el archivo ZIP. Abre la consola para más detalles.");
        }
    };

    const handleDownloadSingle = async (url: string, index: number) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            saveAs(blob, `creativo_${index + 1}.png`);
        } catch (error) {
            console.error("Error al descargar imagen:", error);
            toast.error("No se pudo descargar la imagen individual.");
        }
    };

    if (!mounted) return null;

    if (angles.length === 0 && activeProjectId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
                    <AlertTriangle className="w-10 h-10 text-rose-500" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-4">No hay ángulos generados</h1>
                <p className="text-zinc-400 text-lg max-w-md mx-auto mb-8">
                    Para generar creativos necesitas la materia prima. Vuelve a la sección de Ángulos y guarda al menos uno.
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
                    Combina tus formatos, estilo visual y ángulos guardados para renderizar anuncios listos para publicar.
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
                                <SelectContent className="bg-zinc-900 border-white/10 max-h-60">
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
                            Renderizando usando modelo High-Res. Consumirá {variantCount} créditos.
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
                                    <Wand2 className="w-5 h-5 animate-spin" /> Renderizando IA...
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
                            <Download className="w-4 h-4 mr-2" /> Descargar Todo (ZIP)
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {generatedImages.map((src, index) => (
                            <div key={index} className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-zinc-900 border border-white/10 shadow-xl">
                                {/* Next Image no es adecuado aquí por requerir dominios preconfigurados para imagenes dinamicas */}
                                <img
                                    src={src}
                                    alt={`Variante ${index + 1}`}
                                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                                    crossOrigin="anonymous"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <div className="flex gap-2 w-full">
                                        <Button size="sm" onClick={() => handleDownloadSingle(src, index)} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">
                                            <Download className="w-4 h-4 mr-1" /> HD
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
