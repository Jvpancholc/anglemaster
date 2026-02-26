"use client";

import { useState, useEffect } from "react";
import { useProjectStore } from "@/lib/store";
import { toast } from "sonner";
import { Key, Save, AlertTriangle, Cpu, Loader2, Globe } from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PreferenciasPage() {
    const { settings, updateSettings } = useProjectStore();
    const { getToken, userId } = useAuth();
    const { user } = useUser();
    const [openAiKey, setOpenAiKey] = useState("");
    const [replicateKey, setReplicateKey] = useState("");
    const [geminiKey, setGeminiKey] = useState("");
    const [aiProvider, setAiProvider] = useState("openai");
    const [language, setLanguage] = useState("Español");
    const [mounted, setMounted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (settings) {
            setOpenAiKey(settings.openAiKey || "");
            setReplicateKey(settings.replicateKey || "");
            setGeminiKey(settings.geminiKey || "");
            setAiProvider(settings.aiProvider || "openai");
            setLanguage(settings.language || "Español");
        }
    }, [settings]);

    const handleSave = async () => {
        if (!userId) return;

        setIsSaving(true);
        const toastId = toast.loading("Guardando claves...");

        try {
            updateSettings({
                openAiKey,
                replicateKey,
                geminiKey,
                aiProvider,
                language
            });

            const token = await getToken({ template: 'supabase' });
            if (!token) throw new Error("No se pudo obtener el token de autenticación");

            const supabaseAuth = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                { global: { headers: { Authorization: `Bearer ${token}` } } }
            );

            const { error } = await supabaseAuth
                .from('api_keys')
                .upsert({
                    user_id: userId,
                    openai_key: openAiKey,
                    replicate_key: replicateKey,
                    gemini_key: geminiKey
                }, { onConflict: 'user_id' });

            if (error) throw error;

            toast.success("Preferencias guardadas exitosamente", {
                id: toastId,
                description: "Tus API Keys se han almacenado de forma segura en tu cuenta."
            });
        } catch (error: any) {
            console.error("Error saving keys:", error);
            toast.error(`Error de base de datos: ${error.message}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Preferencias</h1>
                <p className="text-muted-foreground mt-2">
                    Configura tus credenciales y llaves de acceso a las IA.
                </p>
            </div>

            <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5 text-fuchsia-400" /> API Keys Personales
                    </CardTitle>
                    <CardDescription>
                        Tus API keys se encriptan y guardan de forma segura, vinculadas únicamente a tu cuenta para uso exclusivo en la generación de tus proyectos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="openai" className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-emerald-400" /> OpenAI API Key
                        </Label>
                        <Input
                            id="openai"
                            type="password"
                            placeholder="sk-proj-..."
                            value={openAiKey}
                            onChange={(e) => setOpenAiKey(e.target.value)}
                            className="bg-white/5 border-white/10 focus-visible:ring-emerald-500 font-mono text-sm"
                        />
                        <p className="text-xs text-zinc-500">Utilizado para la detección de fuentes tipográficas y recomendaciones inteligentes.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="replicate" className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-orange-400" /> Replicate API Key (Token)
                        </Label>
                        <Input
                            id="replicate"
                            type="password"
                            placeholder="r8_..."
                            value={replicateKey}
                            onChange={(e) => setReplicateKey(e.target.value)}
                            className="bg-white/5 border-white/10 focus-visible:ring-orange-500 font-mono text-sm"
                        />
                        <p className="text-xs text-zinc-500">Utilizado para la Fábrica Creativa y generación de anuncios reales.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="gemini" className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-blue-400" /> Google Gemini API Key
                        </Label>
                        <Input
                            id="gemini"
                            type="password"
                            placeholder="AIzaSy..."
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            className="bg-white/5 border-white/10 focus-visible:ring-blue-500 font-mono text-sm"
                        />
                        <p className="text-xs text-zinc-500">Alternativa a OpenAI para detección de fuentes y sugerencias creativas.</p>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-white/5">
                        <Label className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-violet-400" /> Motor de IA Principal (Texto)
                        </Label>
                        <Select value={aiProvider} onValueChange={setAiProvider}>
                            <SelectTrigger className="w-full sm:max-w-xs bg-white/5 border-white/10 text-sm">
                                <SelectValue placeholder="Selecciona motor" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10">
                                <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                                <SelectItem value="gemini">Google Gemini</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-zinc-500">Selecciona qué motor usará la plataforma para redactar textos y generar ángulos analíticos.</p>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-white/5">
                        <Label className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-cyan-400" /> Idioma de Generación (IA)
                        </Label>
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="w-full sm:max-w-xs bg-white/5 border-white/10 text-sm">
                                <SelectValue placeholder="Selecciona un idioma" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10">
                                <SelectItem value="Español">Español</SelectItem>
                                <SelectItem value="Inglés">Inglés</SelectItem>
                                <SelectItem value="Portugués">Portugués</SelectItem>
                                <SelectItem value="Alemán">Alemán</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-zinc-500">Este es el idioma en el que redactará la Inteligencia Artificial (Textos, Ángulos, Sugerencias).</p>
                    </div>

                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-amber-500">Aviso sobre el uso</h4>
                            <p className="text-xs text-zinc-400 mt-1">
                                Si decides no usar tus propias llaves, la plataforma utilizará un cupo diario global limitado. Al configurar tus llaves, ignoras estos límites y generas a demanda.
                            </p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-white/5 border-t border-white/10 pt-6">
                    <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto ml-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium border-0">
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {isSaving ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}