export default function AnalisisIAPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Análisis IA</h1>
                <p className="text-muted-foreground mt-2">
                    La IA examina tu producto y audiencia para encontrar los mejores enfoques de venta.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border bg-card text-card-foreground shadow h-64 flex items-center justify-center p-6 border-dashed">
                    <p className="text-muted-foreground">Resultados del Análisis</p>
                </div>
            </div>
        </div>
    );
}
