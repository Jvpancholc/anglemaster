import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AppSync } from "@/components/layout/AppSync";
import { GlobalStepper } from "@/components/global-stepper";

const DashboardLayout = ({
    children
}: {
    children: React.ReactNode;
}) => {
    return (
        <div className="h-full relative antialiased bg-background text-foreground min-h-screen">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-80 border-r border-border/40 bg-zinc-950/80 backdrop-blur-xl">
                <Sidebar />
            </div>
            <main className="md:pl-72 h-full flex flex-col">
                <AppSync />
                <Topbar />
                <GlobalStepper />
                <div className="p-8 flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
