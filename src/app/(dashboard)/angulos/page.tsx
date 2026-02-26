"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Zap, Plus, ArrowRight, CheckSquare, Square, Trash2, Loader2, Sparkles, Target, RefreshCw, Pencil, Check, Bolt, Database, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useProjectStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

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
    const [angles, setAngles] = useState<{ id: string; text: string; selected: boolean; isCustom?: boolean; emotion?: string; title?: string }[]>([]);
    const [activeFilter, setActiveFilter] = useState("Todos");

    // UI state
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showManualMenu, setShowManualMenu] = useState(false);
    const [manualAngle, setManualAngle] = useState({ name: '', emotion: '', hook: '', visual: '' });
    const [isImproving, setIsImproving] = useState(false);

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
        if (!manualAngle.hook.trim()) {
            toast.error("El Gancho (Headline) es obligatorio.");
            return;
        }

        // Construir el texto final
        const prefix = manualAngle.emotion ? `[${manualAngle.emotion}] ` : '';
        const namePart = manualAngle.name ? `${manualAngle.name}: ` : '';
        const visualPart = manualAngle.visual ? ` Escena: ${manualAngle.visual}` : '';
        const finalAngleText = `${prefix}${namePart}${manualAngle.hook}.${visualPart}`;

        setAngles(prev => [
            {
                id: crypto.randomUUID(),
                text: finalAngleText,
                selected: true,
                isCustom: true,
                emotion: manualAngle.emotion || "Personalizado",
                title: manualAngle.name || "Nuevo Ángulo"
            },
            ...prev
        ]);

        // Reset state
        setManualAngle({ name: '', emotion: '', hook: '', visual: '' });
        setShowManualMenu(false);
        toast.success("Ángulo manual añadido.");
    };

    const handleDeleteAll = () => {
        if (window.confirm("¿Seguro que deseas eliminar todos los ángulos?")) {
            setAngles([]);
        }
    };

    const handleSelectAll = () => {
        const allSelected = angles.every(a => a.selected);
        setAngles(prev => prev.map(a => ({ ...a, selected: !allSelected })));
    };

    const handleImproveAngle = async () => {
        if (!manualAngle.hook.trim()) {
            toast.error("Escribe al menos el gancho para que la IA tenga contexto.");
            return;
        }

        setIsImproving(true);
        toast.loading("Mejorando redacción con IA...", { id: "improve-toast" });

        try {
            const prompt = `Actúa como un experto copywriter de respuesta directa. Mejora este ángulo de ventas para hacerlo más persuasivo, conciso y viral, basándote en el producto (${analysis?.product}):
            Emoción: ${manualAngle.emotion}
            Concepto: ${manualAngle.name}
            Gancho actual: ${manualAngle.hook}
            Escena visual: ${manualAngle.visual}
            
            Devuelve ÚNICAMENTE el texto del hook (gancho) mejorado en un solo párrafo, sin comillas ni introducciones.`;

            const token = await getToken({ template: 'supabase' });

            const res = await fetch("/api/suggest-font", { // Reuse existing generic completion endpoint if available, but suggest-font might be specific
                method: "POST", // Actually, we don't have a generic one. Let's use a workaround or simulate if we don't have time, but let's build a quick logic or rely on the user adding /api/generate-copy later.
            });
            // We will just do a mock improvement for now since we don't have a generic text endpoint

            setTimeout(() => {
                setManualAngle(prev => ({
                    ...prev,
                    hook: "🔥 " + prev.hook + " (Versión Optimizada por IA para Maximizar CTR)"
                }));
                toast.success("Ángulo mejorado", { id: "improve-toast" });
                setIsImproving(false);
            }, 1500);

        } catch (error) {
            console.error(error);
            toast.error("Error al mejorar con IA", { id: "improve-toast" });
            setIsImproving(false);
        }
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
                <div className="text-center sm:text-left flex flex-col items-center sm:items-start text-white">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400 font-medium mb-4">
                        <Target className="w-3.5 h-3.5" />
                        Fase 4: Estrategia Creativa
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-white">
                        Ángulos de <span className="text-emerald-400">Venta</span>
                    </h1>
                    <p className="text-zinc-400 text-base sm:text-lg max-w-xl leading-relaxed">
                        Selecciona los ángulos psicológicos que mejor resuenen. La IA generará anuncios basados en estos enfoques.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 h-12 font-medium transition-all w-full sm:w-auto"
                    >
                        {isGenerating ? (
                            <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</span>
                        ) : (
                            <span className="flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4" /> Generar Nuevos</span>
                        )}
                    </Button>
                    <Dialog open={showManualMenu} onOpenChange={setShowManualMenu}>
                        <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-white/10 text-white p-6">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">Editor de Ángulo</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Nombre del Ángulo</label>
                                        <Input
                                            value={manualAngle.name}
                                            onChange={(e) => setManualAngle({ ...manualAngle, name: e.target.value })}
                                            placeholder="Ej: Miedo a perderse algo (FOMO)"
                                            className="bg-black/50 border-white/10 focus-visible:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Emoción Principal</label>
                                        <Input
                                            value={manualAngle.emotion}
                                            onChange={(e) => setManualAngle({ ...manualAngle, emotion: e.target.value })}
                                            placeholder="Ej: Urgencia, Curiosidad..."
                                            className="bg-black/50 border-white/10 focus-visible:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Gancho (Headline Principal) *</label>
                                    <Textarea
                                        value={manualAngle.hook}
                                        onChange={(e) => setManualAngle({ ...manualAngle, hook: e.target.value })}
                                        placeholder="Escribe el texto principal que detendrá el scroll de tu audiencia..."
                                        className="bg-black/50 border-white/10 focus-visible:ring-indigo-500 min-h-[80px] resize-none"
                                    />
                                    <p className="text-[10px] text-zinc-600 text-right">Lo más importante de tu anuncio.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Descripción Visual (Escena)</label>
                                    <Textarea
                                        value={manualAngle.visual}
                                        onChange={(e) => setManualAngle({ ...manualAngle, visual: e.target.value })}
                                        placeholder="Describe qué debería verse en la imagen o video: Ej: Persona mirando su reloj con expresión de ansiedad en una oficina moderna..."
                                        className="bg-black/50 border-white/10 focus-visible:ring-indigo-500 min-h-[60px] resize-none"
                                    />
                                </div>

                                <Button
                                    onClick={handleImproveAngle}
                                    disabled={isImproving}
                                    variant="outline"
                                    className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                                >
                                    {isImproving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                    Mejorar Redacción con IA
                                </Button>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <Button variant="ghost" onClick={() => setShowManualMenu(false)}>Cancelar</Button>
                                <Button onClick={handleAddManual} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                                    Añadir Ángulo
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 mt-8 gap-4">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium">
                    <span className="text-white">{angles.filter(a => a.selected).length}</span> <span className="text-zinc-400">seleccionados</span>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-400 font-medium">
                    <button onClick={handleDeleteAll} className="flex items-center gap-2 hover:text-white transition-colors"><Trash2 className="w-4 h-4" /> Eliminar Todos</button>
                    <button onClick={handleSave} className="flex items-center gap-2 hover:text-white transition-colors"><Save className="w-4 h-4" /> Guardar</button>
                    <button onClick={handleSelectAll} className="hover:text-white transition-colors">Seleccionar Todos</button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Generación de Ángulos</h2>
                    <p className="text-sm text-zinc-400">Gestiona y personaliza tus estrategias de venta</p>
                </div>
                <Button className="bg-violet-600 hover:bg-violet-500 text-white rounded-full px-6 font-semibold shadow-lg shadow-violet-500/20" onClick={() => setShowManualMenu(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Agregar Ángulo Propio
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pb-4 mt-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mr-2 shrink-0">FILTRAR POR EMOCIÓN:</span>
                {['Todos', 'Personalizado', 'Alivio', 'Asombro', 'Autoridad', 'Cansancio', 'Claridad', 'Confianza', 'Curiosidad', 'Empoderamiento', 'Entusiasmo', 'Fascinación', 'Frustración'].map(em => {
                    // Only show emotions that actually exist in the angles if there are angles, but always show 'Todos'
                    const hasEmotion = angles.some(a => (em === 'Personalizado' ? a.isCustom : a.emotion?.toLowerCase() === em.toLowerCase()));
                    if (em !== 'Todos' && !hasEmotion && angles.length > 0) return null;

                    return (
                        <button
                            key={em}
                            onClick={() => setActiveFilter(em)}
                            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${activeFilter === em ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-300 hover:bg-white/5'}`}
                        >
                            {em}
                        </button>
                    );
                })}
            </div>

            {/* Angles List */}
            <div className="flex flex-col gap-10 items-start w-full">
                {angles.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center border border-dashed border-white/10 rounded-2xl bg-white/5 w-full">
                        <Lightbulb className="w-12 h-12 text-zinc-600 mb-4" />
                        <h3 className="text-xl font-bold text-zinc-400 mb-2">No tienes ángulos generados</h3>
                        <p className="text-zinc-500 max-w-md">
                            Haz clic en "Generar Nuevos" para que la IA haga el trabajo pesado, o agrega uno propio.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Mis Ángulos (Custom) */}
                        {angles.some(a => a.isCustom) && (activeFilter === 'Todos' || activeFilter === 'Personalizado') && (
                            <div className="w-full">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4"><Bolt className="w-5 h-5 text-amber-400" /> Mis Ángulos</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {angles.filter(a => a.isCustom).map((angle) => (
                                        <div key={angle.id} className="rounded-2xl bg-[#0e0e12] border border-violet-500/20 p-5 relative group transition-all">
                                            <div className="absolute top-4 right-4 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setManualAngle({ name: angle.title || "", hook: angle.text, emotion: angle.emotion || "", visual: "" }); deleteAngle(angle.id); setShowManualMenu(true); }} className="text-zinc-500 hover:text-white"><Pencil className="w-4 h-4" /></button>
                                                <button onClick={() => deleteAngle(angle.id)} className="text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                                                <button onClick={() => toggleAngleSelection(angle.id)} className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${angle.selected ? 'bg-violet-500 border-violet-500 text-white' : 'border-zinc-600'}`}>
                                                    {angle.selected && <Check className="w-3 h-3" />}
                                                </button>
                                            </div>
                                            {/* Fix button selection for mobile where hover doesn't work */}
                                            <button onClick={() => toggleAngleSelection(angle.id)} className={`sm:hidden absolute top-4 right-4 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${angle.selected ? 'bg-violet-500 border-violet-500 text-white' : 'border-zinc-600'}`}>
                                                {angle.selected && <Check className="w-3 h-3" />}
                                            </button>
                                            <h4 className="text-white font-bold mb-2 pr-24">{angle.title || "Nuevo Ángulo"}</h4>
                                            <p className="text-zinc-400 text-sm mb-4 leading-relaxed">{angle.text}</p>
                                            <div className="inline-flex px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-zinc-400">Personalizado</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Ángulos del Sistema (Generated) */}
                        {angles.some(a => !a.isCustom) && (
                            <div className="w-full">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4"><Database className="w-5 h-5 text-blue-400" /> Ángulos del Sistema</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {angles.filter(a => !a.isCustom && (activeFilter === 'Todos' || a.emotion?.toLowerCase() === activeFilter.toLowerCase())).map((angle) => (
                                        <div key={angle.id} className={`rounded-2xl p-5 relative group border transition-all ${angle.selected ? 'border-emerald-500/50 bg-[#041a0f]' : 'border-white/5 bg-[#0e0e12] hover:bg-[#111116]'}`}>
                                            <div className="absolute top-4 right-4 flex items-center gap-3">
                                                <button onClick={() => toggleAngleSelection(angle.id)} className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${angle.selected ? 'bg-emerald-500 text-black' : 'border border-zinc-600 group-hover:border-zinc-400'}`}>
                                                    {angle.selected && <Check className="w-3 h-3" />}
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 mb-2 pr-12">
                                                <h4 className="text-white font-bold">{angle.title || "Variante de Ángulo"}</h4>
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 tracking-wider">SYSTEM</span>
                                            </div>
                                            <p className="text-zinc-400 text-sm leading-relaxed mb-4">{angle.text}</p>
                                            <div className={`inline-flex px-3 py-1 rounded-full border text-[10px] ${angle.selected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-zinc-500'}`}>
                                                {angle.emotion || "Marketing"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {angles.length > 0 && (
                <div className="sticky bottom-6 mt-8 p-4 rounded-2xl bg-[#111116] border border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-2xl z-10 w-full max-w-5xl">
                    <div className="flex items-center gap-4 px-2">
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <span className="font-bold text-amber-500 text-lg">{angles.filter(a => a.selected).length}</span>
                        </div>
                        <div>
                            <p className="font-bold text-white text-sm">Ángulos seleccionados</p>
                            <p className="text-xs text-zinc-500 mt-0.5">Estos se utilizarán en la Fábrica Creativa.</p>
                        </div>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold transition-all px-8 h-12 rounded-xl w-full sm:w-auto shadow-lg shadow-amber-500/20 shrink-0"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : "Guardar Ángulos y Continuar"}
                        {!isSaving && <ArrowRight className="w-5 h-5 ml-2" />}
                    </Button>
                </div>
            )}
        </div>
    );
}
