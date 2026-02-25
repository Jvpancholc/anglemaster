import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Project {
    id: string;
    name: string;
    config: {
        businessName: string;
        shopifyUrl: string;
        niche: string;
        cta: string;
        description: string;
    };
    identity: {
        primaryColor: string;
        secondaryColor: string;
        typography: string;
        logoUrl?: string;
    };
    creativeFormats: string[];
    visualStyle: string | null;
    analysis: {
        product: string;
        avatar: string;
        mup: string;
        ums: string;
        promise: string;
    };
    angles: { id: string; text: string; selected: boolean }[];
    createdAt: string;
    updatedAt: string;
}

interface ProjectState {
    projects: Project[];
    activeProjectId: string | null;
    setActiveProject: (id: string) => void;
    clearActiveProject: () => void;
    createProject: (baseName?: string) => string;
    updateProject: (id: string, data: Partial<Project>) => void;
}

const emptyProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'name'> = {
    config: {
        businessName: '',
        shopifyUrl: '',
        niche: '',
        cta: '',
        description: '',
    },
    identity: {
        primaryColor: '#6366f1',
        secondaryColor: '#a855f7',
        typography: 'Inter',
    },
    creativeFormats: [],
    visualStyle: null,
    analysis: {
        product: '',
        avatar: '',
        mup: '',
        ums: '',
        promise: '',
    },
    angles: [],
};

export const useProjectStore = create<ProjectState>()(
    persist(
        (set) => ({
            projects: [],
            activeProjectId: null,
            setActiveProject: (id) => set({ activeProjectId: id }),
            clearActiveProject: () => set({ activeProjectId: null }),
            createProject: (baseName) => {
                const id = crypto.randomUUID();
                const newProject: Project = {
                    id,
                    name: baseName || 'Mi Nuevo Proyecto',
                    ...emptyProject,
                    config: {
                        ...emptyProject.config,
                        businessName: baseName || 'Mi Nuevo Proyecto',
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                set((state) => ({
                    projects: [newProject, ...state.projects],
                    activeProjectId: id,
                }));
                return id;
            },
            updateProject: (id, data) => set((state) => ({
                projects: state.projects.map((p) =>
                    p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
                )
            })),
        }),
        {
            name: 'anglemaster-state',
            partialize: (state) => ({ projects: state.projects, activeProjectId: state.activeProjectId }),
        }
    )
);
