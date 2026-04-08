import { Request, Response, NextFunction } from "express";

let totalRequests = 0;
let totalErrors = 0;
const activeUsers = new Set<string>();

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    totalRequests++;

    //Track user if possible
    const userId = (req as any).user?.id || "anonymous";
    activeUsers.add(userId);

    res.on("finish", () => {
        const duration = Date.now() - start;
        if (res.statusCode >= 400) totalErrors ++;

        const errorRate = ((totalErrors / totalRequests)*100).toFixed(2);

        console.log(JSON.stringify({
            type: "REQUEST_METRIC",
            route: req.url,
            method: req.method,
            status: res.statusCode,
            duration_ms: duration,
            totalRequests,
            totalErrors,
            errorRate: `${errorRate}%`,
            activeUsers: activeUsers.size,
            timestamp: new Date().toISOString(),
        }));
    });
    next();
}