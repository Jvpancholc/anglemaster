"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Factory, Wand2, Download, Image as ImageIcon, AlertTriangle, ArrowLeft, Loader2, Gauge, Trash2 } from "lucide-react";
import { useProjectStore } from "@/lib/store";
import { toast } from "sonner";
import { useAuth, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { ApiKeyModal } from "@/components/ui/ApiKeyModal";

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
    const { getToken, userId } = useAuth();
    const { user } = useUser();
    const { activeProjectId, projects, settings } = useProjectStore();
    const [mounted, setMounted] = useState(false);

    const [angles, setAngles] = useState<{ id: string; text: string }[]>([]);
    const [selectedAngleId, setSelectedAngleId] = useState<string>("");
    const [variantCount, setVariantCount] = useState<string>("4");
    const [generationStyle, setGenerationStyle] = useState<string>("brand");
    const [generationModel, setGenerationModel] = useState<string>("sdxl");
    const [generationFormat, setGenerationFormat] = useState<string>("4:5");

    const [isGenerating, setIsGenerating] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [projectContext, setProjectContext] = useState<any>(null);
    const [savedCreatives, setSavedCreatives] = useState<any[]>([]);
    const [generationsLeft, setGenerationsLeft] = useState<number | 'Ilimitado'>(0);
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

    const fetchAngles = async () => {
        setIsFetching(true);
        try {
            if (!activeProjectId || !userId) return;

            const token = await getToken({ template: 'supabase' });
            if (!token) return;

            const supabaseAuth = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                { global: { headers: { Authorization: `Bearer ${token}` } } }
            );

            const { data, error } = await supabaseAuth
                .from('angles')
                .select('*')
                .eq('project_id', activeProjectId)
                .eq('selected', true);

            if (error) throw error;

            if (data && data.length > 0) {
                const fetchedAngles = data.map(a => ({ id: a.id, text: a.angle_text }));
                setAngles(fetchedAngles);
                setSelectedAngleId(fetchedAngles[0].id);
            } else {
                setAngles([]);
            }
            // Fetch current limits too
            const { data: apiKeyData } = await supabaseAuth
                .from('api_keys')
                .select('daily_generations, last_generation_date')
                .eq('user_id', userId)
                .single();

            const hasOwnImageKey =
                (settings?.providersKeys?.replicate && settings.providersKeys.replicate.length > 0) ||
                (settings?.providersKeys?.huggingface && settings.providersKeys.huggingface.length > 0);

            if (hasOwnImageKey) {
                setGenerationsLeft('Ilimitado');
            } else if (apiKeyData) {
                const today = new Date().toISOString().split('T')[0];
                if (apiKeyData.last_generation_date !== today) {
                    setGenerationsLeft(100);
                } else if (apiKeyData.daily_generations !== null) {
                    setGenerationsLeft(apiKeyData.daily_generations);
                }
            }

        } catch (error) {
            console.error("Error fetching angles:", error);
        } finally {
            setIsFetching(false);
        }
    };

    const fetchSavedCreatives = async () => {
        if (!activeProjectId || !userId) return;
        try {
            const token = await getToken({ template: 'supabase' });
            if (!token) return;
            const supabaseAuth = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                { global: { headers: { Authorization: `Bearer ${token}` } } }
            );

            const { data, error } = await supabaseAuth
                .from('creatives')
                .select('*')
                .eq('project_id', activeProjectId)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setSavedCreatives(data);
            }
        } catch (error) {
            console.error("Error fetching saved creatives:", error);
        }
    };

    const handleDeleteCreative = async (creativeId: string) => {
        const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar este creativo de tu proyecto?");
        if (!confirmDelete) return;

        const loadingToast = toast.loading("Eliminando creativo...", { icon: '🗑️' });

        try {
            const res = await fetch("/api/delete-creative", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ creativeId })
            });

            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || "Falló la eliminación");

            setSavedCreatives(prev => prev.filter(c => c.id !== creativeId));
            toast.success("Creativo eliminado correctamente.", { id: loadingToast, icon: '✅' });

        } catch (error: any) {
            console.error("Delete creative error", error);
            toast.error(error.message || "No se pudo eliminar el creativo.", { id: loadingToast });
        }
    };

    useEffect(() => {
        setMounted(true);
        const project = activeProjectId ? projects.find(p => p.id === activeProjectId) : null;

        if (project) {
            setProjectContext({
                creativeFormats: project.creativeFormats,
                visualStyle: project.visualStyle,
                identity: project.identity,
                analysis: project.analysis
            });
            fetchAngles();
            fetchSavedCreatives();
        } else {
            // FALLBACK DUMMY DATA OR NO ANGLES
            setAngles(FALLBACK_ANGLES);
            setSelectedAngleId(FALLBACK_ANGLES[0].id);
            setProjectContext(FALLBACK_CONTEXT);
            setIsFetching(false);
            if (!activeProjectId) {
                toast.info("Modo demostración: utilizando datos de ejemplo porque no hay proyecto activo.");
            }
        }
    }, [activeProjectId, projects, userId]);

    const handleGenerate = async () => {
        setIsApiKeyModalOpen(false); // Make sure model doesn't block

        if (angles.length === 0) {
            toast.error("No hay ángulos disponibles.");
            return;
        }

        const countPerAngle = parseInt(variantCount) || 1;
        const totalImagesToGenerate = countPerAngle * angles.length;

        if (generationsLeft !== 'Ilimitado' && typeof generationsLeft === 'number' && generationsLeft < totalImagesToGenerate) {
            toast.error(`Límite diario insuficiente para generar ${totalImagesToGenerate} imágenes. Actualiza tu plan o añade API keys en Preferencias.`);
            return;
        }

        setIsGenerating(true);
        setGeneratedImages([]);

        try {
            const token = await getToken({ template: 'supabase' });
            if (!token) throw new Error("No autenticado en Supabase");

            toast.loading(`Generando para ${angles.length} ángulo(s)...`, { id: 'genToast' });

            const generationPromises = angles.map(async (angleObj) => {
                const payload = {
                    projectId: activeProjectId,
                    angleId: angleObj.id,
                    variantCount,
                    userId: user?.id,
                    settings,
                    context: {
                        ...projectContext,
                        angleText: angleObj.text
                    },
                    freeStyle: generationStyle === "free",
                    generationModel,
                    supabaseToken: token
                };

                const res = await fetch("/api/generate-creatives", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const responseText = await res.text();
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (e) {
                    console.error("Non-JSON:", responseText);
                    throw new Error("El servidor devolvió un error inesperado.");
                }

                if (!res.ok || data.error) {
                    throw new Error(data.error || "Error en la respuesta del servidor");
                }
                return data;
            });

            const results = await Promise.all(generationPromises);

            let allCreativeIds: string[] = [];
            let synchronousUrls: string[] = [];

            results.forEach(res => {
                if (res.queued && res.creativeIds) {
                    allCreativeIds = [...allCreativeIds, ...res.creativeIds];
                } else if (res.images) {
                    synchronousUrls = [...synchronousUrls, ...res.images];
                }
            });

            if (allCreativeIds.length > 0) {
                toast.loading(`Trabajos encolados. Generando las ${totalImagesToGenerate} imágenes finales...`, { id: 'genToast' });

                let attempts = 0;
                const maxAttempts = 60;

                const pollInterval = setInterval(async () => {
                    attempts++;
                    try {
                        const statusRes = await fetch(`/api/creatives/status?ids=${allCreativeIds.join(',')}`);
                        const statusData = await statusRes.json();

                        if (statusData.success && statusData.statuses) {
                            const statusesObj = statusData.statuses;
                            const allCompleted = Object.values(statusesObj).every((s: any) => s.status === 'completed');

                            if (allCompleted || attempts >= maxAttempts) {
                                clearInterval(pollInterval);

                                const finalUrls: string[] = Object.values(statusesObj)
                                    .map((s: any) => s.url)
                                    .filter(Boolean) as string[];

                                setGeneratedImages(finalUrls);

                                if (generationsLeft !== 'Ilimitado') {
                                    setGenerationsLeft(prev => typeof prev === 'number' ? prev - totalImagesToGenerate : prev);
                                }

                                setIsGenerating(false);
                                toast.success("¡Creativos generados existosamente!", { id: 'genToast' });
                                fetchSavedCreatives();
                            }
                        }
                    } catch (e) {
                        console.error("Polling error", e);
                    }
                }, 3000);
            } else if (synchronousUrls.length > 0) {
                setGeneratedImages(synchronousUrls);
                if (generationsLeft !== 'Ilimitado') {
                    setGenerationsLeft(prev => typeof prev === 'number' ? prev - totalImagesToGenerate : prev);
                }
                setIsGenerating(false);
                toast.success("Creativos generados existosamente.", { id: 'genToast' });
                fetchSavedCreatives();
            } else {
                toast.dismiss('genToast');
                setIsGenerating(false);
            }

        } catch (error: any) {
            console.error("Generación fallida:", error);
            setIsGenerating(false);
            toast.error(error.message || "Error al conectar con la API de generación.", { id: 'genToast' });
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

    if (isFetching) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
                <p className="text-zinc-500">Cargando ángulos y contexto...</p>
            </div>
        );
    }

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400 font-medium mb-4">
                        <Wand2 className="w-3.5 h-3.5" />
                        Fábrica Creativa
                    </div>
                    <h1 className="text-4xl font-black tracking-tight mb-2 text-white">
                        Generador de <span className="text-cyan-400">Contenido</span>
                    </h1>
                    <p className="text-zinc-500 text-sm max-w-2xl">
                        Visualiza, genera y escala tus creativos ganadores.
                    </p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs font-semibold text-violet-300 whitespace-nowrap">
                        Límite Diario: {generationsLeft} restantes
                    </div>
                    <div className="flex gap-1 bg-white/5 rounded-full p-1 border border-white/10 text-xs text-zinc-400 font-medium shrink-0">
                        {["1:1", "4:5", "9:16", "16:9", "4:3"].map((fmt) => (
                            <button
                                key={fmt}
                                onClick={() => setGenerationFormat(fmt)}
                                className={`px-4 py-2 rounded-full transition-colors ${generationFormat === fmt ? "bg-cyan-900/50 text-cyan-400" : "hover:text-white"}`}
                            >
                                {fmt}
                            </button>
                        ))}
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || (generationsLeft !== 'Ilimitado' && generationsLeft < parseInt(variantCount))}
                        className="bg-violet-600 hover:bg-violet-500 text-white rounded-full px-6 h-10 shadow-[0_0_20px_rgba(124,58,237,0.3)] shrink-0 font-semibold"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        )}
                        Generar Todo (Masters)
                    </Button>
                </div>
            </div>



            <Card className="bg-[#0B0A0F] border-white/5 shadow-2xl relative overflow-hidden rounded-3xl">
                <CardContent className="p-6 md:p-10 flex flex-col md:flex-row gap-10 min-h-[500px]">

                    {/* LEFT CONTENT */}
                    <div className="flex-1 flex flex-col justify-between space-y-8">
                        <div>
                            <div className="bg-[#0e0e12] border border-white/5 rounded-2xl p-6 relative">
                                <span className="absolute -top-3 left-6 inline-block px-3 py-1 bg-violet-600 border border-violet-500 rounded-full text-[10px] text-white font-bold tracking-wider">
                                    {angles.length} ÁNGULO{angles.length > 1 ? 'S' : ''} SELECCIONADO{angles.length > 1 ? 'S' : ''}
                                </span>

                                <div className="mt-4 space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {angles.map((a, i) => (
                                        <div key={a.id} className="flex gap-3 text-sm text-zinc-300 items-start">
                                            <div className="text-zinc-600 font-bold shrink-0 mt-0.5">{i + 1}.</div>
                                            <p className="line-clamp-2 leading-relaxed">&ldquo;{a.text}&rdquo;</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-[#050505] border border-white/5 rounded-2xl p-6 space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 tracking-wider mb-2 block">VISUAL</label>
                                    <Select value={generationStyle} onValueChange={setGenerationStyle}>
                                        <SelectTrigger className="w-full bg-zinc-900 border-white/10 text-white h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10">
                                            <SelectItem value="brand">Identidad de Marca</SelectItem>
                                            <SelectItem value="free">Estilo Libre</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {generationStyle === 'brand' && (
                                        <div className="mt-3 p-3 bg-zinc-900/50 rounded-xl border border-white/5">
                                            <p className="text-zinc-300 text-xs italic line-clamp-2">
                                                ★ {projectContext?.visualStyle || "Estilo visual no definido"}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-white/5 pt-6">
                                    <label className="text-[10px] font-bold text-zinc-500 tracking-wider block mb-2">FORMATO</label>
                                    <Select value={generationFormat} onValueChange={setGenerationFormat}>
                                        <SelectTrigger className="w-full bg-zinc-900 border-white/10 text-white h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10">
                                            <SelectItem value="1:1">Cuadrado (1:1)</SelectItem>
                                            <SelectItem value="4:5">Feed (4:5)</SelectItem>
                                            <SelectItem value="9:16">Stories/Reels (9:16)</SelectItem>
                                            <SelectItem value="16:9">Wide (16:9)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-zinc-500 tracking-wider block mb-2">MODELO DE IA</label>
                                        <Select value={generationModel} onValueChange={setGenerationModel}>
                                            <SelectTrigger className="w-full bg-zinc-900 border-white/10 text-white h-10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10">
                                                <SelectItem value="flux-pro">Flux 1.1 Pro</SelectItem>
                                                <SelectItem value="sdxl">SD XL</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-zinc-500 tracking-wider block mb-2">VARIANTES</label>
                                        <Select value={variantCount} onValueChange={setVariantCount}>
                                            <SelectTrigger className="w-full bg-zinc-900 border-white/10 text-white h-10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10">
                                                {[1, 2, 4].map(n => <SelectItem key={n} value={n.toString()}>{n} Imágenes</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating || (generationsLeft !== 'Ilimitado' && generationsLeft < parseInt(variantCount))}
                                className="bg-violet-600 hover:bg-violet-500 text-white rounded-full px-8 py-6 font-semibold shadow-[0_4px_20px_rgba(124,58,237,0.3)] w-full sm:w-auto"
                            >
                                {isGenerating ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Wand2 className="w-5 h-5 mr-3 text-cyan-300" />}
                                {isGenerating ? 'Generando...' : 'Generar Imagen Principal'}
                            </Button>
                        </div>
                    </div>

                    {/* RIGHT CONTENT (IMAGE PLACEHOLDER/RESULT) */}
                    <div className="w-full md:w-[400px] shrink-0 flex flex-col items-center justify-center relative">
                        {generatedImages.length > 0 ? (
                            <div
                                className={`relative w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 group bg-zinc-900 transition-all duration-700 ease-in-out`}
                                style={{
                                    aspectRatio: generationFormat === '9:16' ? '9/16' : generationFormat === '16:9' ? '16/9' : generationFormat === '1:1' ? '1/1' : '4/5'
                                }}
                            >
                                <img src={generatedImages[0]} crossOrigin="anonymous" className="w-full h-full object-cover transition-transform duration-700 ease-in-out" />
                                {generatedImages.length > 1 && (
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-xs font-bold text-white shadow-xl">
                                        + {generatedImages.length - 1} variantes
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                className={`w-full rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-white/[0.01] flex flex-col items-center justify-center text-zinc-500 shadow-inner group transition-all duration-700 ease-in-out`}
                                style={{
                                    aspectRatio: generationFormat === '9:16' ? '9/16' : generationFormat === '16:9' ? '16/9' : generationFormat === '1:1' ? '1/1' : '4/5'
                                }}
                            >
                                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:32px_32px] pointer-events-none rounded-3xl" />
                                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-xl">
                                    <ImageIcon strokeWidth={1} className="w-8 h-8 opacity-50 text-cyan-500" />
                                </div>
                                <span className="text-sm font-semibold tracking-wide text-zinc-400">Previsualización Base</span>
                                <span className="text-[10px] uppercase font-bold text-zinc-600 mt-2 tracking-widest bg-white/5 px-2 py-1 rounded-full">{generationFormat}</span>
                            </div>
                        )}
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

            {/* Historial de Creativos del Proyecto */}
            {savedCreatives.length > 0 && !isGenerating && (
                <div className="space-y-6 mt-16 border-t border-white/10 pt-16 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h2 className="text-2xl font-bold flex items-center gap-3 text-zinc-300">
                            <ImageIcon className="w-6 h-6 text-zinc-500" /> Archivo de Creativos
                        </h2>
                    </div>

                    {savedCreatives.length === 0 ? (
                        <div className="p-12 border border-white/5 rounded-2xl bg-zinc-900/50 flex flex-col items-center justify-center text-center">
                            <ImageIcon className="w-12 h-12 text-zinc-600 mb-4 opacity-50" />
                            <h3 className="text-zinc-400 font-medium">No hay creativos guardados</h3>
                            <p className="text-xs text-zinc-600 mt-2 max-w-sm">Los creativos que generes para este proyecto aparecerán aquí y formarán parte del historial contable de tu Dashboard.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {savedCreatives.map((creative) => (
                                <div key={creative.id} className="group relative rounded-xl overflow-hidden aspect-square bg-zinc-900 border border-white/5 hover:border-white/20 transition-all">
                                    <img
                                        src={creative.image_url}
                                        alt="Creativo Guardado"
                                        className="object-cover w-full h-full"
                                        crossOrigin="anonymous"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-2 p-4">
                                        <Button size="sm" onClick={() => handleDownloadSingle(creative.image_url, 0)} className="w-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md">
                                            <Download className="w-4 h-4 mr-2" /> Descargar
                                        </Button>
                                        <Button size="sm" onClick={() => handleDeleteCreative(creative.id)} className="w-full bg-red-500/20 hover:bg-red-500 hover:text-white text-red-200 backdrop-blur-md transition-colors border border-red-500/30">
                                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <ApiKeyModal
                isOpen={isApiKeyModalOpen}
                onClose={() => setIsApiKeyModalOpen(false)}
                onSuccess={() => { toast.success("API Key guardada. Ahora puedes generar creativos.") }}
            />
        </div>
    );
}
