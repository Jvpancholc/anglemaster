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

                // 1. Check API Keys first (Crucial for bypass/blocking)
                const { data: apiData, error: apiError } = await supabaseAuth
                    .from('api_keys')
                    .select('gemini_key, providers_keys')
                    .eq('user_id', user.id)
                    .single();

                if (apiError && apiError.code !== 'PGRST116') {
                    // console.error("Error buscando API keys:", apiError);
                }

                if (apiData?.providers_keys) {
                    updateSettings({ providersKeys: apiData.providers_keys });
                } else if (apiData?.gemini_key) {
                    // Legacy migration fallback
                    updateSettings({ geminiKey: apiData.gemini_key });
                }

                const hasAnyKey =
                    (apiData?.providers_keys?.gemini?.length > 0) ||
                    (apiData?.providers_keys?.groq?.length > 0) ||
                    (apiData?.providers_keys?.replicate?.length > 0) ||
                    (apiData?.providers_keys?.huggingface?.length > 0) ||
                    apiData?.gemini_key;

                // BYOK Optional: We no longer force the user to setup a key here
                // They can use global keys up to the daily_generations limit

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
