"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, BrainCircuit, ArrowRight, Dna, FileQuestion, Key, Sparkles, Loader2 } from "lucide-react";
import { useProjectStore } from "@/lib/store";
import { toast } from "sonner";
import { useAuth, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function AnalisisIAPage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const { user } = useUser();
    const { activeProjectId, projects, updateProject } = useProjectStore();
    const [mounted, setMounted] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [product, setProduct] = useState("");
    const [avatar, setAvatar] = useState("");
    const [mup, setMup] = useState("");
    const [ums, setUms] = useState("");
    const [promise, setPromise] = useState("");

    useEffect(() => {
        setMounted(true);
        if (!activeProjectId) {
            router.push("/");
            return;
        }

        const project = projects.find(p => p.id === activeProjectId);
        if (project && project.analysis) {
            setProduct(project.analysis.product || "");
            setAvatar(project.analysis.avatar || "");
            setMup(project.analysis.mup || "");
            setUms(project.analysis.ums || "");
            setPromise(project.analysis.promise || "");
        }
    }, [activeProjectId, projects, router]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        const toastId = toast.loading("Analizando documento con IA...");

        // Simulamos el retraso de análisis de OpenAI
        setTimeout(() => {
            setProduct("Masterclass de E-commerce y Ventas Digitales Avanzadas");
            setAvatar("Emprendedores digitales de 25-45 años que se sienten abrumados por los costos de anuncios, desean estabilidad en sus ventas y buscan un método sistémico en lugar de trucos mágicos.");
            setMup("Los métodos tradicionales enseñan a crear anuncios bonitos pero no a convertirlos en un embudo rentable. Consumen presupuesto rápido sin retorno claro.");
            setUms("El Sistema 'AngleMaster': Un enfoque basado en psicología de cliente que testea ángulos baratos antes de escalar presupuesto, garantizando rentabilidad.");
            setPromise("Transformar tu tienda online en una máquina predecible de ventas, multiplicando tu ROAS en menos de 30 días sin aumentar tu inversión publicitaria inicial.");

            toast.success("Análisis completado exitosamente", { id: toastId });
            setIsAnalyzing(false);
            if (e.target) e.target.value = '';
        }, 3000);
    };

    const handleSave = async () => {
        if (!activeProjectId || !user) {
            toast.error("Debes iniciar sesión y seleccionar un proyecto.");
            return;
        }

        setIsSaving(true);
        const toastId = toast.loading("Guardando estrategia de negocio...");

        try {
            // Guardar localmente
            updateProject(activeProjectId, {
                analysis: { product, avatar, mup, ums, promise }
            });

            // Guardar en Supabase
            const token = await getToken({ template: 'supabase' });
            if (!token) throw new Error("No se pudo obtener el token de autenticación");

            const supabaseAuth = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                { global: { headers: { Authorization: `Bearer ${token}` } } }
            );

            const adn_json = { product, avatar, mup, ums, promise };

            const { error } = await supabaseAuth
                .from('analysis')
                .upsert({
                    project_id: activeProjectId,
                    user_id: user.id,
                    adn: adn_json
                }, { onConflict: 'project_id' });

            if (error) throw error;

            toast.success("Estrategia y ADN guardados.", { id: toastId });
            router.push("/angulos");
        } catch (error: any) {
            console.error("Error guardando ADN:", error);
            toast.error(`Error guardando en BD: ${error.message}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="text-center sm:text-left flex flex-col items-center sm:items-start">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 font-medium mb-4">
                    <BrainCircuit className="w-3.5 h-3.5" />
                    Generación de Conceptos
                </div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">
                    Alimenta tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Cerebro de IA</span>
                </h1>
                <p className="text-zinc-400 text-lg max-w-2xl">
                    Sube documentos legales, landing pages o notas de producto. Nuestra IA extraerá los <b>mecanismos únicos</b> y la <b>psicología del avatar</b>.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Drag and Drop Zone */}
                <div className="lg:col-span-5 relative">
                    <Card className="bg-zinc-950/40 border-white/5 border-dashed border-2 shadow-2xl relative overflow-hidden group min-h-[500px] flex items-center justify-center transition-colors hover:border-indigo-500/50 hover:bg-zinc-950/60 cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
                        <CardContent className="flex flex-col items-center justify-center p-8 text-center relative z-10 w-full">
                            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 group-hover:text-indigo-400 transition-all duration-300">
                                <UploadCloud className="w-10 h-10 text-zinc-500 transition-colors" />
                            </div>
                            <h3 className="text-2xl font-bold text-zinc-200 mb-2">Arrastra tus archivos aquí</h3>
                            <p className="text-zinc-500 mb-8 max-w-[250px]">
                                Soporta PDF, DOCX, TXT e imágenes. Máximo 100MB por archivo.
                            </p>
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.txt,image/*"
                            />
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isAnalyzing}
                                className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-full px-8 py-5"
                            >
                                {isAnalyzing ? "Analizando..." : <><FileText className="w-4 h-4 mr-2" /> Seleccionar Archivos</>}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Arrow Connector (Hidden on mobile) */}
                <div className="hidden lg:flex lg:col-span-1 justify-center items-center h-full opacity-30 px-2">
                    <svg viewBox="0 0 100 100" className="w-full h-8 text-white preserve-aspect-ratio-none">
                        <path d="M0,50 L80,50" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" fill="none" />
                        <polygon points="80,45 100,50 80,55" fill="currentColor" />
                    </svg>
                </div>

                {/* ADN del Producto Form */}
                <div className="lg:col-span-6">
                    <Card className="bg-zinc-950/60 border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Dna className="w-32 h-32" />
                        </div>
                        <CardHeader className="border-b border-white/5 pb-6">
                            <CardTitle className="flex items-center gap-3 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
                                <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                                    <Dna className="w-5 h-5 text-indigo-400" />
                                </div>
                                ADN del Producto
                            </CardTitle>
                            <CardDescription className="text-zinc-500">
                                Información estratégica extraída de tus archivos. Edita lo que necesites.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    Producto / Servicio
                                </Label>
                                <Textarea
                                    className="bg-black/40 border-white/10 resize-none h-14 focus-visible:ring-indigo-500 text-zinc-300 rounded-xl"
                                    placeholder="Ej: Masterclass de E-commerce"
                                    value={product}
                                    onChange={(e) => setProduct(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    Avatar (Análisis Psicográfico)
                                </Label>
                                <Textarea
                                    className="bg-black/40 border-white/10 resize-none h-24 focus-visible:ring-indigo-500 text-zinc-300 rounded-xl"
                                    placeholder="Descripción detallada de miedos, deseos y situación actual..."
                                    value={avatar}
                                    onChange={(e) => setAvatar(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-rose-500/80 uppercase tracking-widest flex items-center gap-2">
                                    <FileQuestion className="w-3.5 h-3.5" /> MUP (Problema Raíz)
                                </Label>
                                <Textarea
                                    className="bg-rose-950/10 border-rose-500/20 resize-none h-16 focus-visible:ring-rose-500 text-rose-100/80 rounded-xl"
                                    placeholder="¿Por qué han fallado otros métodos? ¿Cuál es el dolor principal?"
                                    value={mup}
                                    onChange={(e) => setMup(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-emerald-500/80 uppercase tracking-widest flex items-center gap-2">
                                    <Key className="w-3.5 h-3.5" /> UMS (Mecanismo Único)
                                </Label>
                                <Textarea
                                    className="bg-emerald-950/10 border-emerald-500/20 resize-none h-16 focus-visible:ring-emerald-500 text-emerald-100/80 rounded-xl"
                                    placeholder="¿Cuál es tu ventaja injusta? ¿Cómo solucionas el MUP?"
                                    value={ums}
                                    onChange={(e) => setUms(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label className="text-xs font-semibold text-amber-500/80 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5" /> Gran Promesa
                                </Label>
                                <Textarea
                                    className="bg-amber-950/10 border-amber-500/20 resize-none h-16 focus-visible:ring-amber-500 text-amber-100/80 rounded-xl"
                                    placeholder="La transformación final que ofreces..."
                                    value={promise}
                                    onChange={(e) => setPromise(e.target.value)}
                                />
                            </div>
                        </CardContent>

                        <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end">
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all px-8 py-6 rounded-full w-full sm:w-auto text-base"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : "Confirmar Estrategia"}
                                {!isSaving && <ArrowRight className="w-5 h-5 ml-2" />}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
