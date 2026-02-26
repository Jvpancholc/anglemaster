"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Palette,
  Image as ImageIcon,
  PenTool,
  BrainCircuit,
  Target,
  Factory,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  {
    label: "Inicio",
    icon: LayoutDashboard,
    href: "/dashboard", // Main dashboard route
    color: "text-sky-500",
  },
  {
    label: "Configurar Negocio",
    icon: Store,
    href: "/configurar-negocio",
    color: "text-violet-500",
  },
  {
    label: "Identidad Visual",
    icon: Palette,
    href: "/identidad-visual",
    color: "text-pink-700",
  },
  {
    label: "Formato Creativo",
    icon: ImageIcon,
    href: "/formato-creativo",
    color: "text-orange-700",
  },
  {
    label: "Estilo Visual",
    icon: PenTool,
    href: "/estilo-visual",
    color: "text-emerald-500",
  },
  {
    label: "Análisis IA",
    icon: BrainCircuit,
    href: "/analisis-ia",
    color: "text-blue-700",
  },
  {
    label: "Ángulos",
    icon: Target,
    href: "/angulos",
    color: "text-red-500",
  },
  {
    label: "Fábrica",
    icon: Factory,
    href: "/fabrica",
    color: "text-yellow-500",
  },
  {
    label: "Preferencias",
    icon: Settings,
    href: "/preferencias",
    color: "text-zinc-400",
  },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-transparent text-foreground">
      <div className="px-3 py-2 flex-1 relative z-10">
        <Link href="/dashboard" className="flex items-center pl-3 mb-14 transition-opacity hover:opacity-80">
          <div className="relative w-8 h-8 mr-4">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-fuchsia-600 rounded-lg blur opacity-50"></div>
            <div className="relative w-8 h-8 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-xl shadow-primary/20">
              A
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
            AngleMaster
          </h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              href={route.href}
              key={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-lg transition-all duration-300",
                pathname === route.href
                  ? "text-primary bg-primary/10 shadow-[0_0_20px_rgba(124,58,237,0.15)] border border-primary/20"
                  : "text-zinc-400 hover:text-foreground hover:bg-white/5"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3 transition-colors", pathname === route.href ? "text-primary" : route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
