type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
    userId?: string;
    provider?: string;
    endpoint?: string;
    [key: string]: any;
}

function structuredLog(level: LogLevel, message: string, context?: LogContext) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...context
    };

    switch (level) {
        case "error":
            console.error(JSON.stringify(entry));
            break;
        case "warn":
            console.warn(JSON.stringify(entry));
            break;
        case "debug":
            if (process.env.NODE_ENV === "development") {
                console.debug(JSON.stringify(entry));
            }
            break;
        default:
            console.log(JSON.stringify(entry));
    }
}

export const logger = {
    info: (message: string, context?: LogContext) => structuredLog("info", message, context),
    warn: (message: string, context?: LogContext) => structuredLog("warn", message, context),
    error: (message: string, context?: LogContext) => structuredLog("error", message, context),
    debug: (message: string, context?: LogContext) => structuredLog("debug", message, context),
};
