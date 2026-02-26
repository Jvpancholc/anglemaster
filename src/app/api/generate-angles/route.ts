import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Placeholder endpoint for /api/generate-angles
// Ready to be connected to OpenAI later.

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { projectId, analysis, settings, userId } = body;

        if (!analysis || !projectId) {
            return NextResponse.json({ error: "Missing product analysis or Project ID" }, { status: 400 });
        }

        const apiKey = settings?.openAiKey || process.env.OPENAI_API_KEY;
        const geminiApiKey = settings?.geminiKey || process.env.GEMINI_API_KEY;
        const provider = settings?.aiProvider || 'openai';

        // Simulated generation parameters
        const outputLanguage = settings?.language || 'Español';

        console.log(`Generating Angles via ${provider.toUpperCase()} in ${outputLanguage}...`);

        // Simulate AI generation delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // TODO: En el futuro, reemplaza esto con llamadas reales a la IA:
        // if (provider === 'gemini') {
        //  const genAI = new GoogleGenerativeAI(geminiApiKey);
        //  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        //  const result = await model.generateContent(`Product: ${analysis.product}... Generate 10 angles in ${outputLanguage}.`);
        // } else {
        //   const openai = new OpenAI({ apiKey });
        //   const completion = await openai.chat.completions.create({
        //       model: "gpt-4-turbo",
        //       messages: [
        //           { role: "system", content: `You are an expert copywriter. You MUST respond exactly in ${outputLanguage} language.` },
        //           { role: "user", content: `Product: ${analysis.product}\nAvatar: ${analysis.avatar}\n... Generate 10 angles.` }
        //       ]
        //   });
        // }
        // const angles = ...

        let mockGeneratedAngles = [];

        if (outputLanguage === "Inglés") {
            mockGeneratedAngles = [
                `The exact method to stop bleeding money with ${analysis.product || 'this product'}.`,
                `How to reclaim 10 hours a week applying the ${analysis.product || 'our solution'} system.`,
                `The secret your competition doesn't want you to know about client retention.`,
                `Why 90% of entrepreneurs fail in the first 5 months and how to avoid it.`,
                `From zero to expert: we transform the learning curve into a straight line to conversion.`,
                `Why the traditional method is making you lose money without realizing it.`,
                `Discover how to triple your leads without increasing your ad budget.`,
                `How a newbie made a 5-figure income using exactly this promise: "${analysis.promise || 'our guarantee'}".`,
                `The golden rule of copywriting that no one tells you, and it's included right here.`,
                `Cut the nonsense and apply our Unique Mechanism: ${analysis.ums || 'disruptive tech'}.`
            ];
        } else {
            mockGeneratedAngles = [
                `El método exacto para dejar de perder dinero con ${analysis.product || 'este producto'}.`,
                `Cómo recuperar 10 horas semanales aplicando el sistema de ${analysis.product || 'nuestra solución'}.`,
                `El secreto que tu competencia no quiere que sepas sobre retención de clientes.`,
                `Por qué el 90% de los emprendedores fallan en los primeros 5 meses y cómo evitarlo.`,
                `De cero a experto: transformamos la curva de aprendizaje en una línea recta de conversión.`,
                `Por qué el método tradicional te está haciendo perder dinero sin darte cuenta.`,
                `Descubre cómo triplicar tus leads sin aumentar el presupuesto en anuncios.`,
                `Cómo un novato facturó 5 cifras usando exactamente esta promesa: "${analysis.promise || 'nuestra garantía'}".`,
                `La regla de oro del copywriting que nadie te cuenta, y que viene incluida en esto.`,
                `Corta las tonterías y aplica nuestro Mecanismo Único: ${analysis.ums || 'tecnología disruptiva'}.`
            ];
        }

        // Limpiamos cualquier prefijo tipo 【Texto】: u [Texto]: que la IA pudiera generar en el futuro
        const cleanedAngles = mockGeneratedAngles.map(angle => {
            return angle.replace(/^【.*?】\s*:\s*/, '').replace(/^\[.*?\]\s*:\s*/, '').trim();
        });

        return NextResponse.json({
            success: true,
            angles: cleanedAngles
        });

    } catch (error: any) {
        console.error("Error generating angles:", error);
        return NextResponse.json({ error: error.message || "Failed to generate angles" }, { status: 500 });
    }
}
