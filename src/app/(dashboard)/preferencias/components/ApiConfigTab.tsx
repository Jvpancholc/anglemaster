"use client";

import { useState } from "react";
import { useProjectStore } from "@/lib/store";
import { toast } from "sonner";
import { Loader2, Trash2, Plus, Info, ExternalLink, Activity } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function ApiConfigTab() {
    const { settings, updateSettings } = useProjectStore();
    const [providersKeys, setProvidersKeys] = useState(settings?.providersKeys || { gemini: [], groq: [], replicate: [], huggingface: [] });
    const [newKeys, setNewKeys] = useState<{ [key: string]: string }>({ gemini: "", groq: "", replicate: "", huggingface: "" });
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const { t } = useTranslation();

    const providers = [
        {
            id: "gemini",
            name: "Google Gemini",
            desc: t.apiConfig.geminiDesc,
            link: "https://aistudio.google.com/app/apikey"
        },
        {
            id: "groq",
            name: "Groq",
            desc: t.apiConfig.groqDesc,
            link: "https://console.groq.com/keys"
        },
        {
            id: "replicate",
            name: "Replicate",
            desc: t.apiConfig.replicateDesc,
            link: "https://replicate.com/account/api-tokens"
        },
        {
            id: "huggingface",
            name: "Hugging Face",
            desc: t.apiConfig.hfDesc,
            link: "https://huggingface.co/settings/tokens"
        }
    ];

    const handleAddKey = (providerId: string) => {
        const keyVal = newKeys[providerId]?.trim();
        if (!keyVal) return;

        const currentKeys = providersKeys[providerId as keyof typeof providersKeys] || [];
        if (currentKeys.includes(keyVal)) {
            toast.error(t.apiConfig.claveAgregada);
            return;
        }

        const newMap = {
            ...providersKeys,
            [providerId]: [...currentKeys, keyVal]
        };

        setProvidersKeys(newMap);
        setNewKeys({ ...newKeys, [providerId]: "" });
    };

    const handleRemoveKey = (providerId: string, idx: number) => {
        const currentKeys = [...(providersKeys[providerId as keyof typeof providersKeys] || [])];
        currentKeys.splice(idx, 1);

        const newMap = {
            ...providersKeys,
            [providerId]: currentKeys
        };
        setProvidersKeys(newMap);
    };

    const handleSaveAPI = async () => {
        setIsSaving(true);
        const toastId = toast.loading(t.apiConfig.guardando);

        try {
            updateSettings({ providersKeys });

            const res = await fetch("/api/save-api-key", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ providersKeys })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || t.apiConfig.errGuardar);

            toast.success(t.apiConfig.guardadoExito, { id: toastId });
        } catch (error: any) {
            toast.error(error.message || t.apiConfig.errGuardar, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestKeys = async () => {
        // En un futuro, puede llamar a un endpoint para probar validez de cada LLM.
        setIsTesting(true);
        const toastId = toast.loading(t.apiConfig.probando);
        try {
            // Simulando ping a rotador
            await fetch("/api/test-providers", { method: "POST", body: JSON.stringify({ providersKeys }) }).catch(() => null);
            await new Promise(r => setTimeout(r, 1500));
            toast.success(t.apiConfig.pruebaExito, { id: toastId });
        } catch (e) {
            toast.error(t.apiConfig.pruebaError, { id: toastId });
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="max-w-2xl animate-in fade-in duration-300">
            <h3 className="text-2xl font-bold text-white mb-2">{t.apiConfig.title}</h3>
            <p className="text-sm text-zinc-400 mb-6">
                {t.apiConfig.desc}
            </p>

            <div className="flex gap-4 mb-6">
                <button
                    onClick={handleSaveAPI}
                    disabled={isSaving}
                    className="bg-[#4F46E5] hover:bg-[#4338ca] text-white rounded-xl h-11 px-6 font-semibold text-sm transition-all disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t.apiConfig.btnGuardar}
                </button>
                <button
                    onClick={handleTestKeys}
                    disabled={isTesting}
                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl h-11 px-6 font-semibold text-sm transition-all flexitems-center gap-2"
                >
                    {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4 inline mr-2" />}
                    {t.apiConfig.btnProbar}
                </button>
            </div>

            <div className="space-y-6">
                {providers.map(provider => {
                    const keys = providersKeys[provider.id as keyof typeof providersKeys] || [];
                    const inputValue = newKeys[provider.id] || "";

                    return (
                        <div key={provider.id} className="bg-[#08080A] border border-white/5 rounded-2xl p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                        {provider.name}
                                    </h4>
                                    <p className="text-xs text-zinc-500 mt-1 max-w-[80%]">{provider.desc}</p>
                                </div>
                                <a href={provider.link} target="_blank" rel="noreferrer" className="shrink-0 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                                    {t.apiConfig.obtenerClave} <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>

                            <div className="space-y-2 mb-4">
                                {keys.length === 0 && (
                                    <div className="text-xs text-zinc-600 italic">{t.apiConfig.sinClaves}</div>
                                )}
                                {keys.map((k, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white/5 rounded-lg p-2 px-3">
                                        <span className="text-sm font-mono text-zinc-300">
                                            {k.substring(0, 4)}••••••••••••{k.substring(k.length - 4)}
                                        </span>
                                        <button onClick={() => handleRemoveKey(provider.id, idx)} className="text-red-400 hover:text-red-300 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={inputValue}
                                    onChange={(e) => setNewKeys({ ...newKeys, [provider.id]: e.target.value })}
                                    placeholder="sk-..."
                                    className="flex-1 bg-black/40 border border-white/10 focus:border-indigo-500/50 text-white rounded-lg h-10 px-3 text-sm transition-all focus:outline-none placeholder:text-zinc-700"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddKey(provider.id)}
                                />
                                <button
                                    onClick={() => handleAddKey(provider.id)}
                                    disabled={!inputValue.trim()}
                                    className="bg-white/10 hover:bg-white/20 text-white rounded-lg px-4 font-semibold text-sm transition-all disabled:opacity-50"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
