"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/lib/store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sparkles, UploadCloud, Trash2, ArrowRight, Square, Loader2, ImagePlus, Scan, Lightbulb } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useTranslation } from "@/lib/i18n";

interface AnalysisResult {
    id: string;
    title: string;
    composition: string;
    emotions: string[];
    palette: string[];
    thumbnail: string;
}

export default function SimilitudIAPage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const { activeProjectId } = useProjectStore();
    const [mounted, setMounted] = useState(false);
    const { t } = useTranslation();

    const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
    const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0 });
    const stopRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
        if (!activeProjectId) {
            router.push("/");
            return;
        }
    }, [activeProjectId, router]);

    const handleFilesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setReferenceFiles(prev => {
                const combined = [...prev, ...newFiles];
                if (combined.length > 10) {
                    toast.warning("Máximo 10 referencias.");
                    return combined.slice(0, 10);
                }
                return combined;
            });
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
        setReferenceFiles(prev => {
            const combined = [...prev, ...files];
            if (combined.length > 10) {
                toast.warning("Máximo 10 referencias.");
                return combined.slice(0, 10);
            }
            return combined;
        });
    }, []);

    const removeFile = useCallback((idx: number) => {
        setReferenceFiles(prev => prev.filter((_, i) => i !== idx));
    }, []);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                // Remove data:image/...;base64, prefix
                resolve(result.split(",")[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const startAnalysis = async () => {
        if (referenceFiles.length === 0) {
            toast.error("Sube al menos una imagen de referencia.");
            return;
        }

        setIsAnalyzing(true);
        stopRef.current = false;
        setAnalysisProgress({ current: 0, total: referenceFiles.length });

        for (let i = 0; i < referenceFiles.length; i++) {
            if (stopRef.current) break;

            setAnalysisProgress({ current: i + 1, total: referenceFiles.length });

            try {
                const base64 = await fileToBase64(referenceFiles[i]);
                const res = await fetch("/api/analyze-reference", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        imageBase64: base64,
                        mimeType: referenceFiles[i].type,
                    }),
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || "Error en el análisis");
                }

                const data = await res.json();
                if (data.success && data.analysis) {
                    const newResult: AnalysisResult = {
                        id: `analysis-${Date.now()}-${i}`,
                        title: data.analysis.title,
                        composition: data.analysis.composition,
                        emotions: data.analysis.emotions,
                        palette: data.analysis.palette,
                        thumbnail: URL.createObjectURL(referenceFiles[i]),
                    };
                    setAnalyses(prev => [...prev, newResult]);
                }
            } catch (error: any) {
                console.error(`Error analyzing image ${i + 1}:`, error);
                toast.error(`Error en imagen ${i + 1}: ${error.message}`);
            }
        }

        setIsAnalyzing(false);
        if (!stopRef.current) {
            toast.success("✅ Análisis completado.");
        } else {
            toast.info("⏹️ Análisis detenido.");
        }
    };

    const stopAnalysis = () => {
        stopRef.current = true;
    };

    const removeAnalysis = (id: string) => {
        setAnalyses(prev => prev.filter(a => a.id !== id));
    };

    const clearAll = () => {
        setAnalyses([]);
        setReferenceFiles([]);
    };

    const handleGenerateAngles = () => {
        if (analyses.length === 0) {
            toast.error("Analiza al menos una referencia primero.");
            return;
        }
        // Store analyses in sessionStorage for the angles page to use
        sessionStorage.setItem("visualAnalyses", JSON.stringify(analyses));
        router.push("/angulos");
    };

    if (!mounted) return null;

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-green-400 font-medium mb-3">
                        <Scan className="w-3.5 h-3.5" />
                        Fase 5: Espionaje Visual
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
                        Decodifica el <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">Éxito</span>
                    </h1>
                    <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
                        Sube anuncios ganadores. Gemini Vision extraerá sus patrones ocultos (ángulos, colores, emociones) para replicar su éxito.
                    </p>
                </div>

                <div className="flex gap-3 shrink-0">
                    {analyses.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={clearAll}
                            className="bg-transparent border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar Todos
                        </Button>
                    )}
                    <Button
                        onClick={handleGenerateAngles}
                        disabled={analyses.length === 0}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold shadow-lg shadow-green-500/20 disabled:opacity-40"
                    >
                        Generar Mis Ángulos <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* ─── LEFT: Upload + Tips ─── */}
                <div className="lg:col-span-4 space-y-5">

                    {/* Upload Area */}
                    <div
                        className="bg-zinc-950/70 border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-green-500/30 hover:bg-green-500/[0.02] transition-all min-h-[200px]"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                    >
                        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <UploadCloud className="w-7 h-7 text-zinc-500" />
                        </div>
                        <h3 className="font-bold text-white text-base mb-1">Sube Referencias</h3>
                        <p className="text-xs text-zinc-500 max-w-[200px]">
                            Arrastra imágenes de tu competencia o productos virales
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handleFilesChange}
                        />
                    </div>

                    {/* Uploaded Files Preview */}
                    {referenceFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {referenceFiles.map((f, idx) => (
                                <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 group/img">
                                    <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" alt="" />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                        className="absolute inset-0 bg-black/70 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Analyze / Stop Buttons */}
                    {referenceFiles.length > 0 && (
                        <div className="flex gap-3">
                            {!isAnalyzing ? (
                                <Button
                                    onClick={startAnalysis}
                                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold h-12 rounded-xl"
                                >
                                    <Sparkles className="w-4 h-4 mr-2" /> Analizar ({referenceFiles.length})
                                </Button>
                            ) : (
                                <Button
                                    onClick={stopAnalysis}
                                    variant="destructive"
                                    className="flex-1 h-12 rounded-xl font-bold"
                                >
                                    <Square className="w-4 h-4 mr-2" /> Detener Análisis
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Analysis Progress */}
                    {isAnalyzing && (
                        <div className="bg-zinc-950/70 border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center">
                            <Loader2 className="w-10 h-10 text-green-400 animate-spin mb-3" />
                            <p className="text-white font-bold text-lg">
                                Analizando {analysisProgress.current}/{analysisProgress.total}...
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                                Descifrando psicología visual...
                            </p>
                        </div>
                    )}

                    {/* Tips Card */}
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-green-400">
                            <Lightbulb className="w-4 h-4" />
                            ¿Qué funciona mejor?
                        </div>
                        <ul className="space-y-2 text-xs text-zinc-400">
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 mt-0.5">•</span>
                                Anuncios con alto CTR de competidores
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 mt-0.5">•</span>
                                Fotos de estilo de vida de tu producto
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 mt-0.5">•</span>
                                Capturas de landings que convierten
                            </li>
                        </ul>
                    </div>
                </div>

                {/* ─── RIGHT: Analysis Results ─── */}
                <div className="lg:col-span-8 space-y-5">

                    {/* Empty State */}
                    {analyses.length === 0 && !isAnalyzing && (
                        <div className="bg-zinc-950/70 border border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
                            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                                <ImagePlus className="w-7 h-7 text-zinc-600" />
                            </div>
                            <h3 className="font-bold text-white text-lg mb-1">Esperando Datos</h3>
                            <p className="text-sm text-zinc-500 max-w-sm">
                                La IA necesita &ldquo;alimentarse&rdquo; de ejemplos visuales para generar ángulos de venta precisos.
                            </p>
                        </div>
                    )}

                    {/* Analysis Cards */}
                    {analyses.map((a, idx) => (
                        <div
                            key={a.id}
                            className="bg-zinc-950/70 border border-white/5 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 hover:border-white/10 transition-colors"
                        >
                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center absolute -top-1 -left-1 z-10">
                                            <Sparkles className="w-3 h-3 text-green-400" />
                                        </div>
                                        <img
                                            src={a.thumbnail}
                                            alt={a.title}
                                            className="w-12 h-12 rounded-lg object-cover border border-white/10"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{a.title}</h4>
                                        <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                                            Análisis #{String(idx + 1).padStart(2, "0")}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeAnalysis(a.id)}
                                    className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Composition */}
                            <div className="space-y-2">
                                <div className="text-[10px] font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3" />
                                    COMPOSICIÓN
                                </div>
                                <p className="text-sm text-zinc-300 bg-zinc-900/50 rounded-xl p-4 border border-white/5 leading-relaxed">
                                    {a.composition}
                                </p>
                            </div>

                            {/* Emotions + Palette */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="text-[10px] font-bold text-zinc-500 tracking-wider mb-2">EMOCIONES</div>
                                    <div className="flex flex-wrap gap-2">
                                        {a.emotions.map((em, ei) => (
                                            <span
                                                key={ei}
                                                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-medium"
                                            >
                                                {em}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-zinc-500 tracking-wider mb-2">PALETA</div>
                                    <div className="flex gap-1.5">
                                        {a.palette.map((color, ci) => (
                                            <div
                                                key={ci}
                                                className="w-7 h-7 rounded-full border border-white/20 shadow-md hover:scale-110 transition-transform cursor-pointer"
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
