"use client";

import { usePathname } from "next/navigation";
import { Check, Dot } from "lucide-react";
import Link from "next/link";

const STEPS = [
    { id: "/configurar-negocio", label: "Extracción", stepIndex: 1 },
    { id: "/identidad-visual", label: "Identidad", stepIndex: 2 },
    { id: "/formato-creativo", label: "Formato", stepIndex: 3 },
    { id: "/estilo-visual", label: "Estilo Visual", stepIndex: 4 },
    { id: "/similitud-ia", label: "Similitud IA", stepIndex: 5 },
    { id: "/analisis-ia", label: "Análisis IA", stepIndex: 6 },
    { id: "/angulos", label: "Ángulos", stepIndex: 7 },
    { id: "/fabrica", label: "Fábrica", stepIndex: 8 },
];

export function GlobalStepper() {
    const pathname = usePathname();

    // Encontrar el paso actual basándose en la ruta
    const currentStepIndex = STEPS.findIndex(s => pathname === s.id);

    // Si no estamos en ninguna de las rutas del flujo, no mostrar el stepper
    if (currentStepIndex === -1) return null;

    return (
        <div className="w-full bg-zinc-950/80 backdrop-blur-md border-b border-white/5 py-4 hidden md:block">
            <div className="max-w-6xl mx-auto px-6">
                <div className="flex items-center justify-between relative">
                    {/* Barra de fondo para la línea */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-white/5 z-0" />

                    {/* Barra de progreso */}
                    <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-emerald-500 to-indigo-500 z-0 transition-all duration-500"
                        style={{
                            width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%`
                        }}
                    />

                    {STEPS.map((step, index) => {
                        const isCompleted = index < currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        const isPending = index > currentStepIndex;

                        return (
                            <Link href={step.id} key={step.id} className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer focus:outline-none">
                                <div
                                    className={`
                                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                                        ${isCompleted ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:bg-emerald-400' : ''}
                                        ${isCurrent ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-110 ring-4 ring-indigo-500/20' : ''}
                                        ${isPending ? 'bg-zinc-800 text-zinc-500 border border-white/10 group-hover:bg-zinc-700' : ''}
                                    `}
                                >
                                    {isCompleted ? <Check className="w-4 h-4" /> : step.stepIndex}
                                </div>
                                <span
                                    className={`
                                        text-[10px] uppercase font-bold tracking-wider transition-colors duration-300 absolute -bottom-6 whitespace-nowrap
                                        ${isCurrent ? 'text-indigo-400' : ''}
                                        ${isCompleted ? 'text-emerald-400 group-hover:text-emerald-300' : ''}
                                        ${isPending ? 'text-zinc-600 group-hover:text-zinc-400' : ''}
                                    `}
                                >
                                    {step.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

