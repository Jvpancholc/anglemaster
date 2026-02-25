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
} from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard", // Or wherever the main dashboard is
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
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white">
      <div className="px-3 py-2 flex-1">
        <Link href="/dashboard" className="flex items-center pl-3 mb-14">
          <div className="relative w-8 h-8 mr-4">
            {/* You can place a logo here */}
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center font-bold text-xl">
              A
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            AngleMaster
          </h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              href={route.href}
              key={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
