"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Zap, Plus, ArrowRight, CheckSquare, Square, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useProjectStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MOCK_ANGLES = [
    { id: "mock-1", text: "Ahorra 10 horas semanales automatizando procesos clave." },
    { id: "mock-2", text: "El secreto que tu competencia no quiere que sepas sobre retención." },
    { id: "mock-3", text: "De cero a experto: transformamos la curva de aprendizaje en una línea recta." },
    { id: "mock-4", text: "Por qué el método tradicional te está haciendo perder dinero sin darte cuenta." },
];

export default function AngulosPage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const { user } = useUser();
    const { activeProjectId, projects, settings } = useProjectStore();
    const [mounted, setMounted] = useState(false);

    const activeProject = projects.find(p => p.id === activeProjectId);
    const analysis = activeProject?.analysis;

    // Internal state for angles array
    const [angles, setAngles] = useState<{ id: string; text: string; selected: boolean }[]>([]);

    // UI state
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualAngleText, setManualAngleText] = useState("");

    // Load from localStorage on mount
    useEffect(() => {
        setMounted(true);
        const savedAngles = localStorage.getItem("selectedAngles");
        if (savedAngles) {
            try {
                let parsed = JSON.parse(savedAngles);
                // Limpieza retroactiva para los que quedaron cacheados con prefijo
                parsed = parsed.map((a: any) => ({
                    ...a,
                    text: a.text.replace(/^【.*?】\s*:\s*/, '').replace(/^\[.*?\]\s*:\s*/, '').trim()
                }));
                setAngles(parsed);
            } catch (e) {
                console.error("Error parsing saved angles", e);
            }
        }
    }, []);

    // Save to localStorage whenever angles state changes (realtime persistence)
    useEffect(() => {
        if (mounted) {
            localStorage.setItem("selectedAngles", JSON.stringify(angles));
        }
    }, [angles, mounted]);

    const handleGenerate = async () => {
        if (!activeProjectId || !analysis) {
            toast.error("Falta el análisis del producto. Ve a Análisis IA primero.");
            return;
        }

        setIsGenerating(true);
        try {
            const res = await fetch('/api/generate-angles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: activeProjectId,
                    analysis: analysis,
                    settings: settings,
                    userId: user?.id
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Error al conectar con la IA.");
            }

            const data = await res.json();

            if (data.angles && Array.isArray(data.angles)) {
                const newAngles = data.angles.map((text: string) => ({
                    id: crypto.randomUUID(),
                    text,
                    selected: false
                }));
                // Si la IA generó 10, reemplazaremos o añadiremos. Si es el primer click usualmente se reemplaza para no sobrecargar
                setAngles(newAngles);
                toast.success("Ángulos generados por IA.");
            } else {
                throw new Error("Respuesta inválida de la IA.");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(`Generación fallida: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddManual = () => {
        if (!manualAngleText.trim()) return;
        setAngles(prev => [
            { id: crypto.randomUUID(), text: manualAngleText, selected: true },
            ...prev
        ]);
        setManualAngleText("");
        setShowManualInput(false);
    };

    const toggleAngleSelection = (id: string) => {
        setAngles(prev => prev.map(a => a.id === id ? { ...a, selected: !a.selected } : a));
    };

    const deleteAngle = (id: string) => {
        setAngles(prev => prev.filter(a => a.id !== id));
    };

    const handleSave = async () => {
        const selectedCount = angles.filter(a => a.selected).length;
        if (selectedCount === 0) {
            toast.error("Selecciona al menos un ángulo para continuar.");
            return;
        }

        if (!activeProjectId || !user) {
            toast.error("Debes tener un proyecto activo y estar autenticado.");
            return;
        }

        setIsSaving(true);
        const toastId = toast.loading("Guardando ángulos...");

        try {
            // Guardar localmente también por si acaso
            localStorage.setItem("selectedAngles", JSON.stringify(angles));

            const token = await getToken({ template: 'supabase' });
            if (!token) throw new Error("No se pudo obtener el token de autenticación");

            const supabaseAuth = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                { global: { headers: { Authorization: `Bearer ${token}` } } }
            );

            // Primero borramos los ángulos anteriores para este proyecto para evitar duplicados en la re-generación
            const { error: deleteError } = await supabaseAuth.from('angles').delete().eq('project_id', activeProjectId);

            if (deleteError) {
                console.error("Error al borrar ángulos previos:", deleteError);
                throw new Error("No se pudieron borrar los ángulos anteriores. " + deleteError.message);
            }

            // Preparar el bulk insert
            const anglesToInsert = angles.map(a => ({
                id: a.id.length === 36 ? a.id : crypto.randomUUID(), // Valid UUID required
                project_id: activeProjectId,
                user_id: user.id,
                angle_text: a.text,
                selected: a.selected
            }));

            const { error } = await supabaseAuth.from('angles').insert(anglesToInsert);

            if (error) throw error;

            toast.success(`${selectedCount} ángulos guardados correctamente.`, { id: toastId });
            router.push("/fabrica");
        } catch (error: any) {
            console.error("Error guardando ángulos:", error);
            toast.error(`Error de base de datos: ${error.message}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end">
                <div className="text-center sm:text-left flex flex-col items-center sm:items-start">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-medium mb-4">
                        <Lightbulb className="w-3.5 h-3.5" />
                        Persuasión y Copywriting
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">
                        Ángulos de <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Venta</span>
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-xl">
                        Basado en el ADN de tu producto, la IA elaborará ideas disruptivas para atacar los dolores de tu avatar.
                    </p>
                    {analysis && analysis.product && (
                        <div className="mt-4 p-3 bg-zinc-950/80 border border-white/5 rounded-lg text-sm text-zinc-300 max-w-xl">
                            <strong className="text-amber-500/80">ADN Detectado:</strong> Vendiendo <span className="text-white font-medium">{analysis.product}</span> a <span className="text-white font-medium">{analysis.avatar}</span> para ayudarles a <span className="text-white font-medium">{analysis.promise}</span>.
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold"
                    >
                        {isGenerating ? (
                            <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /> Analizando ADN...</span>
                        ) : (
                            <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Generar Ángulos de Marketing</span>
                        )}
                    </Button>
                    <Button
                        onClick={() => setShowManualInput(!showManualInput)}
                        variant="outline"
                        className="bg-white/5 border-white/10 hover:bg-white/10 font-semibold"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Crear Manualmente
                    </Button>
                </div>
            </div>

            {/* Manual Input Area */}
            {showManualInput && (
                <Card className="bg-zinc-900 border-white/10 shadow-lg animate-in slide-in-from-top-2">
                    <CardContent className="p-4 flex gap-3">
                        <Input
                            value={manualAngleText}
                            onChange={(e) => setManualAngleText(e.target.value)}
                            placeholder="Ej. Descubre cómo triplicar tus leads sin aumentar el presupuesto en ads."
                            className="bg-black/50 border-white/10 focus-visible:ring-amber-500 text-base py-6"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
                        />
                        <Button onClick={handleAddManual} className="bg-amber-600 hover:bg-amber-500 text-white h-auto px-6">
                            Añadir
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Angles List */}
            <div className="space-y-4">
                {angles.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
                        <Lightbulb className="w-12 h-12 text-zinc-600 mb-4" />
                        <h3 className="text-xl font-bold text-zinc-400 mb-2">No tienes ángulos generados</h3>
                        <p className="text-zinc-500 max-w-md">
                            Haz clic en "Generar Ángulos" para que la IA haga el trabajo pesado, o crea uno manual.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {angles.map((angle) => (
                            <Card
                                key={angle.id}
                                onClick={() => toggleAngleSelection(angle.id)}
                                className={`cursor-pointer transition-all duration-200 border-l-4 ${angle.selected
                                    ? "bg-amber-500/10 border-amber-500 border-y-white/10 border-r-white/10"
                                    : "bg-zinc-950 border-white/5 hover:bg-zinc-900"
                                    }`}
                            >
                                <CardContent className="p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 flex-1">
                                        <button className={`shrink-0 rounded-md flex items-center justify-center transition-colors ${angle.selected ? "text-amber-500" : "text-zinc-600"}`}>
                                            {angle.selected ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                                        </button>
                                        <p className={`text-sm sm:text-base leading-relaxed ${angle.selected ? "text-amber-50 font-medium" : "text-zinc-400"}`}>
                                            {angle.text}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => { e.stopPropagation(); deleteAngle(angle.id); }}
                                        className="text-zinc-600 hover:text-red-400 hover:bg-red-400/10 shrink-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {angles.length > 0 && (
                <div className="sticky bottom-6 mt-4 p-4 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <span className="font-bold text-amber-500">{angles.filter(a => a.selected).length}</span>
                        </div>
                        <div>
                            <p className="font-semibold text-zinc-200">Ángulos seleccionados</p>
                            <p className="text-xs text-zinc-500">Estos se utilizarán en la Fábrica Creativa.</p>
                        </div>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all px-8 py-6 rounded-full w-full sm:w-auto text-base"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : "Guardar Ángulos y Continuar"}
                        {!isSaving && <ArrowRight className="w-5 h-5 ml-2" />}
                    </Button>
                </div>
            )}
        </div>
    );
}
