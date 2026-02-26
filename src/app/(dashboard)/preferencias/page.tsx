"use client";

import { useState, useEffect } from "react";
import { useProjectStore } from "@/lib/store";
import { toast } from "sonner";
import { Key, Save, AlertTriangle, Cpu, Loader2, Globe, User, X, Copy, Eye, EyeOff, Check } from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ApiConfigTab } from "./components/ApiConfigTab";

type Tab = "perfil" | "idioma" | "api";

export default function PreferenciasPage() {
    const { settings, updateSettings } = useProjectStore();
    const { getToken, userId } = useAuth();
    const { user, isLoaded } = useUser();

    const [activeTab, setActiveTab] = useState<Tab>("api");
    const [geminiKey, setGeminiKey] = useState("");
    const [language, setLanguage] = useState("ES");
    const [fullName, setFullName] = useState("");
    const [mounted, setMounted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (settings) {
            setGeminiKey(settings.geminiKey || "");
            // Mapear idiomas si venía de antes (ej: "Español" a "ES")
            let langCode = settings.language || "ES";
            if (langCode === "Español") langCode = "ES";
            if (langCode === "Inglés") langCode = "EN";
            if (langCode === "Portugués") langCode = "PT";
            setLanguage(langCode);
        }
        if (isLoaded && user) {
            setFullName(user.fullName || "");
        }
    }, [settings, isLoaded, user]);

    const handleSaveAPI = async () => {
        if (!userId) return;
        setIsSaving(true);
        const toastId = toast.loading("Validando y guardando clave API...");

        try {
            // Validar la key de Gemini primero
            const valRes = await fetch("/api/validate-gemini-key", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ geminiKey })
            });
            const valData = await valRes.json();

            if (!valRes.ok) {
                throw new Error(valData.error || "Clave API inválida");
            }

            // Si es válida, actualizar el estado global
            updateSettings({ geminiKey, language });

            // Guardar en la base de datos backend (saltando RLS)
            const res = await fetch("/api/save-api-key", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ geminiKey })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "No se pudo guardar la clave");

            toast.success("Clave API validada y guardada", { id: toastId });
        } catch (error: any) {
            toast.error(error.message || "Error al validar la clave", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSaving(true);
        const toastId = toast.loading("Actualizando perfil...");
        try {
            let firstName = fullName;
            let lastName = "";
            const parts = fullName.split(" ");
            if (parts.length > 1) {
                firstName = parts[0];
                lastName = parts.slice(1).join(" ");
            }
            await user.update({ firstName, lastName });
            toast.success("Perfil actualizado correctamente", { id: toastId });
        } catch (e: any) {
            toast.error(e.errors?.[0]?.message || "No se pudo actualizar el perfil", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const onChangeLanguage = (code: string) => {
        setLanguage(code);
        updateSettings({ language: code });
        localStorage.setItem("global_ui_lang", code);
        toast.success("Idioma actualizado. Recarga para ver los cambios.");
    };

    if (!mounted) return null;

    const isApiKeyMissing = !geminiKey || geminiKey.trim() === "";

    return (
        <div className="flex justify-center items-start min-h-[calc(100vh-80px)] p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-full max-w-5xl bg-[#0B0A0F] border border-white/5 rounded-3xl flex flex-col md:flex-row shadow-2xl overflow-hidden min-h-[500px]">

                {/* SIDEBAR */}
                <div className="w-full md:w-72 bg-[#0B0A0F] border-r border-white/5 p-6 flex flex-col shrink-0">
                    <h2 className="text-xl font-bold text-white mb-8 mt-2 px-2">Preferencias</h2>

                    <nav className="flex flex-col gap-1">
                        <button
                            onClick={() => setActiveTab("perfil")}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === "perfil" ? "bg-white/5 text-fuchsia-400" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"}`}
                        >
                            <User className="w-4 h-4" /> Perfil Personal
                        </button>
                        <button
                            onClick={() => setActiveTab("idioma")}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === "idioma" ? "bg-white/5 text-fuchsia-400" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"}`}
                        >
                            <Globe className="w-4 h-4" /> Idioma de la App
                        </button>
                        <button
                            onClick={() => setActiveTab("api")}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === "api" ? "bg-white/5 text-fuchsia-400" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"}`}
                        >
                            <Key className="w-4 h-4" /> Configuración API
                        </button>
                    </nav>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 p-6 md:p-10 bg-[#0B0A0F]">

                    {/* PROFILE TAB */}
                    {activeTab === "perfil" && (
                        <div className="max-w-xl animate-in fade-in duration-300">
                            <h3 className="text-2xl font-bold text-white mb-2">Perfil Personal</h3>
                            <p className="text-sm text-zinc-400 mb-8">Actualiza tu foto y nombre para personalizar tu experiencia.</p>

                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 shrink-0 bg-zinc-900">
                                    {user?.imageUrl ? (
                                        <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-10 h-10 m-auto mt-4 text-zinc-500" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white">Foto de Perfil</h4>
                                    <p className="text-xs text-zinc-500 mt-1">Gesti&oacute;nala desde tu cuenta proveedora.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nombre Completo</label>
                                    <Input
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="bg-[#050505] border-white/5 focus-visible:ring-fuchsia-500 text-white rounded-xl h-12"
                                    />
                                </div>

                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                    className="mt-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl px-6 h-11"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    Guardar Cambios
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* LANGUAGE TAB */}
                    {activeTab === "idioma" && (
                        <div className="max-w-xl animate-in fade-in duration-300">
                            <h3 className="text-2xl font-bold text-white mb-2">Preferencias de Idioma</h3>
                            <p className="text-sm text-zinc-400 mb-8">Selecciona el idioma principal de la aplicación. Esto afectará la interfaz global.</p>

                            <div className="flex flex-col gap-3">
                                {[
                                    { code: "ES", label: "Español" },
                                    { code: "EN", label: "English" },
                                    { code: "PT", label: "Português" }
                                ].map((lang) => {
                                    const isActive = language === lang.code;
                                    return (
                                        <button
                                            key={lang.code}
                                            onClick={() => onChangeLanguage(lang.code)}
                                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isActive ? 'bg-white/5 border-white/20' : 'bg-transparent border-white/5 hover:border-white/10'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className={`font-mono font-bold ${isActive ? 'text-white' : 'text-zinc-500'}`}>{lang.code}</span>
                                                <span className={`font-medium ${isActive ? 'text-white' : 'text-zinc-400'}`}>{lang.label}</span>
                                            </div>
                                            {isActive && (
                                                <div className="w-6 h-6 rounded-full bg-fuchsia-500 flex items-center justify-center">
                                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* API CONFIG TAB */}
                    {activeTab === "api" && (
                        <ApiConfigTab />
                    )}

                </div>
            </div>
        </div>
    );
}