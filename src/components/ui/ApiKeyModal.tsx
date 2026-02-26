"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, Copy, Eye, EyeOff, Loader2, Check } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useProjectStore } from "@/lib/store";
import Link from "next/link";

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function ApiKeyModal({ isOpen, onClose, onSuccess }: ApiKeyModalProps) {
    const { settings, updateSettings } = useProjectStore();
    const { userId } = useAuth();

    const [geminiKey, setGeminiKey] = useState(settings?.geminiKey || "");
    const [isSaving, setIsSaving] = useState(false);
    const [showKey, setShowKey] = useState(false);

    if (!isOpen) return null;

    const isApiKeyMissing = !geminiKey || geminiKey.trim() === "";

    const handleSaveAPI = async () => {
        if (!userId) return;
        setIsSaving(true);
        const toastId = toast.loading("Validando y guardando clave API...");

        try {
            // Validar primero
            const valRes = await fetch("/api/validate-gemini-key", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ geminiKey })
            });
            const valData = await valRes.json();
            if (!valRes.ok) throw new Error(valData.error || "Clave API inválida");

            // Si es válida, guardar en DB
            updateSettings({ geminiKey });

            const res = await fetch("/api/save-api-key", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ geminiKey })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "No se pudo guardar la clave");

            toast.success("Clave API validada y guardada", { id: toastId });
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Error al validar la clave", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 p-4">
            <div className="bg-[#111116] border border-white/5 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden">

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors z-10"
                >
                    <X className="w-4 h-4 text-zinc-400" />
                </button>

                <div className="p-8 sm:p-10">
                    <h3 className="text-2xl font-bold text-white mb-2">Conexión Google API</h3>
                    <p className="text-sm text-zinc-400 mb-6">Gestiona tu clave de Google AI Studio (Gemini). Debe estar activa y con saldo.</p>

                    {isApiKeyMissing ? (
                        <div className="mb-6 bg-[#3b0a11] border border-red-900/40 rounded-2xl p-4 flex gap-4 items-center">
                            <div className="w-8 h-8 rounded-full bg-red-900/50 flex items-center justify-center shrink-0">
                                <X className="w-4 h-4 text-red-500" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-red-400">API Faltante o Inválida</h4>
                                <p className="text-xs text-red-500/80 mt-1">Debes configurar una API key abajo.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-6 bg-[#042414] border border-emerald-900/40 rounded-2xl p-4 flex gap-4 items-center">
                            <div className="w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center shrink-0">
                                <Check className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-emerald-400">API Conectada y Funcional</h4>
                                <p className="text-xs text-emerald-500/80 mt-1">El motor de inteligencia artificial está listo.</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">CLAVE DE API DE GEMINI</label>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <input
                                    type={showKey ? "text" : "password"}
                                    value={geminiKey}
                                    onChange={(e) => setGeminiKey(e.target.value)}
                                    placeholder="••••••••••••••••••••••••••••"
                                    className="w-full bg-[#08080A] border border-white/5 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-white rounded-xl h-12 pl-4 pr-20 text-sm transition-all outline-none"
                                />
                                <div className="absolute right-3 top-0 h-12 flex items-center gap-2">
                                    <button onClick={() => setShowKey(!showKey)} className="text-zinc-500 hover:text-white transition-colors" tabIndex={-1}>
                                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => { navigator.clipboard.writeText(geminiKey); toast.success("Copiado al portapapeles"); }} className="text-zinc-500 hover:text-white transition-colors" tabIndex={-1}>
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={handleSaveAPI}
                                disabled={isSaving || !geminiKey.trim()}
                                className={`${isApiKeyMissing ? "bg-[#4F46E5] hover:bg-[#4338ca]" : "bg-white/5 hover:bg-white/10 border border-white/10"} text-white rounded-xl h-12 px-6 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0`}
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (isApiKeyMissing ? "Guardar y Validar" : "Revalidar")}
                            </button>
                        </div>
                        <div className="pt-2">
                            <Link href="https://aistudio.google.com/app/api-keys" target="_blank" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                                Obtener una clave API gratuita de Google ↗
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
