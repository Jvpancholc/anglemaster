"use client";

import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useProjectStore } from "@/lib/store";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

export function AppSync() {
    const { getToken } = useAuth();
    const { user } = useUser();
    const { activeProjectId, setActiveProject, createProject, updateSettings } = useProjectStore();
    const hasSynced = useRef(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Ejecutar solo si estamos en el cliente, hay usuario y no hemos syncronizado en esta sesión
        if (!user || hasSynced.current) return;

        const syncProject = async () => {
            hasSynced.current = true; // Prevenir ejecuciones múltiples en React Strict Mode
            try {
                const token = await getToken({ template: 'supabase' });
                if (!token) return;

                const supabaseAuth = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                    { global: { headers: { Authorization: `Bearer ${token}` } } }
                );

                // 1. Check API Keys — try with providers_keys, fall back to gemini_key only
                let apiData: any = null;
                let apiQuerySucceeded = false;

                // Try the full query first (with providers_keys column)
                const res = await supabaseAuth
                    .from('api_keys')
                    .select('gemini_key, providers_keys')
                    .eq('user_id', user.id)
                    .single();

                if (res.data) {
                    apiData = res.data;
                    apiQuerySucceeded = true;
                } else if (res.error && res.error.code !== 'PGRST116') {
                    // Query failed (maybe providers_keys column doesn't exist) — try legacy
                    const fallbackRes = await supabaseAuth
                        .from('api_keys')
                        .select('gemini_key')
                        .eq('user_id', user.id)
                        .single();

                    if (fallbackRes.data) {
                        apiData = fallbackRes.data;
                        apiQuerySucceeded = true;
                    } else if (fallbackRes.error?.code === 'PGRST116') {
                        // PGRST116 = no rows found — user has no api_keys record at all
                        apiQuerySucceeded = true; // query worked, just no data
                    }
                } else if (res.error?.code === 'PGRST116') {
                    // No rows found — user has no api_keys record at all
                    apiQuerySucceeded = true;
                }

                // Update store with whatever we found
                if (apiData?.providers_keys) {
                    updateSettings({ providersKeys: apiData.providers_keys });
                } else if (apiData?.gemini_key) {
                    updateSettings({ geminiKey: apiData.gemini_key });
                }

                // Friendly reminder if no keys configured — informational only, never blocks navigation
                const hasAnyKey =
                    (apiData?.providers_keys?.gemini?.length > 0) ||
                    apiData?.gemini_key;

                if (!hasAnyKey) {
                    toast.info("💡 Para generar creativos, configura tu clave de Google Gemini en Preferencias.", { duration: 5000 });
                }

                // 2. Buscar proyectos existentes del usuario en la base de datos
                const { data: dbProjects, error } = await supabaseAuth
                    .from('projects')
                    .select('id, name')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error("Error buscando proyectos:", error.message || error);
                    // No hacemos return aquí para que, si falla por RLS, intente el local de todos modos.
                }

                // 2. Si no hay proyectos en la base de datos o hubo error, autocrear uno de prueba (según lo pedido)
                if (!dbProjects || dbProjects.length === 0) {
                    const newProjectId = crypto.randomUUID();
                    console.log("No se encontraron proyectos en la BD, autocreando proyecto:", newProjectId);

                    const { error: insertError } = await supabaseAuth.from('projects').insert({
                        id: newProjectId,
                        user_id: user.id,
                        name: "Mi Proyecto",
                        status: "configuring"
                    });

                    if (insertError) {
                        console.error("No se pudo crear el proyecto inicial:", insertError);
                        return;
                    }

                    // Sincronizar Zustand con el nuevo proyecto
                    createProject("Mi Proyecto", newProjectId);

                    if (!activeProjectId) {
                        setActiveProject(newProjectId);
                    }
                    return;
                }

                // 4. Si hay proyectos en la BD pero no hay uno activo en Zustand, asignamos el primero
                if (!activeProjectId) {
                    console.log("Asignando proyecto activo por defecto desde la BD:", dbProjects[0].id);
                    createProject(dbProjects[0].name, dbProjects[0].id);
                    setActiveProject(dbProjects[0].id);
                }

            } catch (err) {
                console.error("Error general en AppSync:", err);
            }
        };

        syncProject();
    }, [user, activeProjectId, createProject, setActiveProject, getToken]);

    return null; // Componente invisible
}
