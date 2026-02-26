"use client";

import Link from "next/link";
import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { ArrowRight, Video, Plus, Target, Factory, Rocket, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

export default function DashboardIndexPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { projects, setActiveProject, createProject, deleteProject } = useProjectStore();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [creativesCount, setCreativesCount] = useState(0);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Fetch total creatives count
    const fetchStats = async () => {
      if (!user) return;
      try {
        const token = await getToken({ template: 'supabase' });
        if (!token) return;
        const supabaseAuth = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { global: { headers: { Authorization: `Bearer ${token}` } } }
        );
        const { count, error } = await supabaseAuth
          .from('creatives')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (!error && count !== null) {
          setCreativesCount(count);
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };

    fetchStats();
  }, [user, getToken]);

  const handleCreateProject = async () => {
    try {
      if (!user) {
        toast.error("Debes iniciar sesión para crear un proyecto");
        return;
      }

      const token = await getToken({ template: 'supabase' });
      if (!token) {
        toast.error("Error de autenticación: No se pudo verificar tu sesión.");
        return;
      }

      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );

      // Generar el ID localmente para sincronizar estado BD y Memoria
      const newProjectId = crypto.randomUUID();

      // Insertar primero en Supabase para validar RLS y FK constraints
      const { error } = await supabaseAuth.from('projects').insert({
        id: newProjectId,
        user_id: user.id,
        name: "Mi Primer Negocio"
      });

      if (error) {
        console.error("Error creating project in DB:", error);
        toast.error(`Error de base de datos al crear el proyecto: ${error.message}`);
        return; // Detenemos la creación local si la BD falla
      }

      // Si fue exitoso, sincronizamos el store local usando exactamente el mismo ID
      const id = createProject("Mi Primer Negocio", newProjectId);
      router.push("/configurar-negocio");
    } catch (error: any) {
      console.error(error);
      toast.error("Ocurrió un error inesperado al crear el proyecto");
    }
  };

  const handleSelectProject = (projectId: string, href: string) => {
    setActiveProject(projectId);
    router.push(href);
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation(); // Evitar navegar al proyecto al hacer clic en borrar

    if (!confirm("¿Estás seguro de que deseas eliminar este proyecto y todos sus datos?")) {
      return;
    }

    setIsDeleting(projectId);
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        toast.error("Error de autenticación.");
        setIsDeleting(null);
        return;
      }

      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );

      // Borrar de Supabase
      const { error } = await supabaseAuth.from('projects').delete().eq('id', projectId);

      if (error) {
        console.error("Error borrando proyecto:", error);
        toast.error("No se pudo borrar de la base de datos.");
      } else {
        // Borrar del Store Zustand
        deleteProject(projectId);
        toast.success("Proyecto eliminado correctamente.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error inesperado al intentar borrar el proyecto.");
    } finally {
      setIsDeleting(null);
    }
  };

  const firstName = user?.firstName || "Francisco";

  if (!mounted) return null; // Prevenir hidratación incorrecta de zustand (localStorage)

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center p-6 rounded-2xl bg-zinc-950/40 border border-white/5 backdrop-blur-sm">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Sistema Operativo
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Hola, {firstName} <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mb-6">
            Tu suite creativa está lista. Genera conceptos, ángulos y creativos de alta conversión en segundos.
          </p>
          <Button onClick={handleCreateProject} className="rounded-full px-6 py-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] border-0">
            <Plus className="w-5 h-5 mr-2" /> Nuevo Proyecto
          </Button>
        </div>

        <div className="flex flex-col gap-4 w-full lg:w-auto">
          <div className="flex gap-4">
            <Link href="#mis-proyectos" className="w-full lg:w-48 block">
              <Card className="bg-zinc-950/60 border-white/10 h-full shadow-lg hover:border-indigo-500/50 transition-colors">
                <CardContent className="p-4 flex flex-col justify-between h-full min-h-[100px]">
                  <Factory className="w-5 h-5 text-indigo-400 mb-2 opacity-70" />
                  <div>
                    <p className="text-2xl font-bold">{projects.length}</p>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mt-1">Proyectos Activos</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/fabrica" className="w-full lg:w-48 block">
              <Card className="bg-zinc-950/60 border-white/10 h-full shadow-lg hover:border-fuchsia-500/50 transition-colors">
                <CardContent className="p-4 flex flex-col justify-between h-full min-h-[100px]">
                  <Target className="w-5 h-5 text-fuchsia-400 mb-2 opacity-70" />
                  <div>
                    <p className="text-2xl font-bold">{creativesCount}</p>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mt-1">Creativos Generados</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
          <Link href="/fabrica" className="block">
            <Card className="bg-zinc-950/60 border-white/10 w-full shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-30 group-hover:opacity-100 transition-opacity">
                <Rocket className="w-4 h-4 text-emerald-400" />
              </div>
              <CardContent className="p-4 flex flex-col justify-center min-h-[80px]">
                <p className="text-2xl font-bold text-emerald-400">0</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mt-1">Aprobados para Publicar</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Coming Soon Teaser */}
      <Card className="bg-gradient-to-r from-indigo-950/50 to-purple-950/50 border-indigo-500/20 backdrop-blur-md shadow-xl overflow-hidden relative">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <CardContent className="p-6 flex items-center justify-between relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
              <Video className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-indigo-100">Próximamente: Creación de Videos</h3>
              <p className="text-indigo-300 text-sm mt-1">Pronto vas a poder generar videos para tus ads directamente desde la app.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <span className="text-violet-500">⚡</span> Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div onClick={handleCreateProject} className="block focus:outline-none cursor-pointer">
            <Card className="bg-zinc-950/40 border-white/5 hover:border-violet-500/30 hover:bg-zinc-900/60 transition-all duration-300 group h-full shadow-lg hover:shadow-[0_0_20px_rgba(124,58,237,0.15)]">
              <CardContent className="p-5 flex items-start gap-4 h-full">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/20 group-hover:bg-violet-500/20 transition-colors">
                  <Plus className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex flex-col justify-center h-full">
                  <h4 className="font-semibold text-zinc-200">Nuevo Proyecto</h4>
                  <p className="text-xs text-zinc-500 mt-1">Inicia una nueva campaña desde cero</p>
                </div>
              </CardContent>
            </Card>
          </div>
          <Link href="/angulos" className="block focus:outline-none">
            <Card className="bg-zinc-950/40 border-white/5 hover:border-sky-500/30 hover:bg-zinc-900/60 transition-all duration-300 group h-full shadow-lg hover:shadow-[0_0_20px_rgba(14,165,233,0.15)]">
              <CardContent className="p-5 flex items-start gap-4 h-full">
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0 border border-sky-500/20 group-hover:bg-sky-500/20 transition-colors">
                  <Target className="w-5 h-5 text-sky-400" />
                </div>
                <div className="flex flex-col justify-center h-full">
                  <h4 className="font-semibold text-zinc-200">Generar Ángulos</h4>
                  <p className="text-xs text-zinc-500 mt-1">Explora nuevas ideas de marketing</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/fabrica" className="block focus:outline-none">
            <Card className="bg-zinc-950/40 border-white/5 hover:border-fuchsia-500/30 hover:bg-zinc-900/60 transition-all duration-300 group h-full shadow-lg hover:shadow-[0_0_20px_rgba(217,70,239,0.15)]">
              <CardContent className="p-5 flex items-start gap-4 h-full">
                <div className="w-10 h-10 rounded-lg bg-fuchsia-500/10 flex items-center justify-center shrink-0 border border-fuchsia-500/20 group-hover:bg-fuchsia-500/20 transition-colors">
                  <Factory className="w-5 h-5 text-fuchsia-400" />
                </div>
                <div className="flex flex-col justify-center h-full">
                  <h4 className="font-semibold text-zinc-200">Fábrica Creativa</h4>
                  <p className="text-xs text-zinc-500 mt-1">Ver todos tus creativos guardados</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* My Projects */}
      <div id="mis-proyectos" className="scroll-mt-8">
        <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <span className="text-emerald-500">📁</span> Mis Proyectos
        </h2>

        {projects.length === 0 ? (
          <Card className="bg-zinc-950/40 border-white/5 border-dashed relative overflow-hidden">
            <div className="absolute top-4 left-4">
              <div className="px-2 py-1 bg-white/10 rounded-md text-[10px] font-bold tracking-widest text-zinc-400 border border-white/5">
                ONBOARDING
              </div>
            </div>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <h3 className="text-4xl font-extrabold text-zinc-800 tracking-tighter mb-6 relative select-none">
                ANGLEMASTER
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent"></div>
              </h3>
              <h4 className="text-xl font-bold text-zinc-200 mb-2">Comienza tu viaje creativo</h4>
              <p className="text-zinc-500 max-w-sm mb-6">No tienes proyectos activos aún. Configura tu primer negocio para que la IA empiece a trabajar.</p>
              <Button onClick={handleCreateProject} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700">
                Crear mi primer proyecto <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div key={project.id} onClick={() => handleSelectProject(project.id, "/configurar-negocio")} className="block focus:outline-none cursor-pointer">
                <Card className="bg-zinc-950/40 border-white/10 hover:border-emerald-500/40 hover:bg-zinc-900/80 transition-all duration-300 group h-full shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg group-hover:text-emerald-400 transition-colors line-clamp-1 pr-8">{project.config.businessName || project.name || 'Sin Título'}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteProject(e, project.id)}
                      disabled={isDeleting === project.id}
                      className="absolute top-3 right-3 h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <CardDescription className="line-clamp-2 text-zinc-500 mt-2">
                      {project.config.description || 'Sin descripción del producto...'}
                    </CardDescription>
                  </CardContent>
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
