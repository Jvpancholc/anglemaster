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
        productPhotos?: string[];
    };
    identity: {
        primaryColor: string;
        secondaryColor: string;
        typography: string;
        logoUrl?: string;
        slogan?: string;
        includeSlogan?: boolean;
        logoVariations?: { full?: string; icon?: string; text?: string };
        logoGenerated?: boolean;
        brandDescription?: string;
        styleReferences?: string[];
        faceImages?: string[];
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

export interface ProviderKeysConfig {
    gemini?: string[];
}

export interface ProjectSettings {
    geminiKey?: string | null;
    providersKeys?: ProviderKeysConfig;
    language?: string;
}

interface ProjectState {
    projects: Project[];
    activeProjectId: string | null;
    settings: ProjectSettings;
    setActiveProject: (id: string) => void;
    clearActiveProject: () => void;
    createProject: (baseName?: string, presetId?: string) => string;
    updateProject: (id: string, data: Partial<Project>) => void;
    deleteProject: (id: string) => void;
    updateSettings: (settings: Partial<ProjectSettings>) => void;
}

const emptyProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'name'> = {
    config: {
        businessName: '',
        shopifyUrl: '',
        niche: '',
        cta: '',
        description: '',
        productPhotos: [],
    },
    identity: {
        primaryColor: '#6366f1',
        secondaryColor: '#a855f7',
        typography: 'auto',
        slogan: '',
        includeSlogan: false,
        logoVariations: {},
        logoGenerated: false,
        brandDescription: '',
        styleReferences: [],
        faceImages: [],
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

const defaultSettings: ProjectSettings = {
    geminiKey: '',
    providersKeys: {
        gemini: [],
    },
    language: 'ES'
};

export const useProjectStore = create<ProjectState>()(
    persist(
        (set) => ({
            projects: [],
            activeProjectId: null,
            settings: defaultSettings,
            setActiveProject: (id) => set({ activeProjectId: id }),
            clearActiveProject: () => set({ activeProjectId: null }),
            createProject: (baseName, presetId) => {
                const id = presetId || crypto.randomUUID();
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
            deleteProject: (id) => set((state) => ({
                projects: state.projects.filter(p => p.id !== id),
                activeProjectId: state.activeProjectId === id ? null : state.activeProjectId
            })),
            updateSettings: (newSettings) => set((state) => ({
                settings: { ...state.settings, ...newSettings }
            })),
        }),
        {
            name: 'anglemaster-state',
            version: 1, // Add version for future migrations
            partialize: (state) => ({
                projects: state.projects || [],
                activeProjectId: state.activeProjectId,
                settings: state.settings || defaultSettings,
            }),
            // Ensure projects is always an array even if corrupted in storage
            onRehydrateStorage: () => (state) => {
                if (state) {
                    if (!Array.isArray(state.projects)) {
                        state.projects = [];
                    }
                    if (!state.settings) {
                        state.settings = defaultSettings;
                    }
                }
            }
        }
    )
);
