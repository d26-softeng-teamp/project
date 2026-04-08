import { prisma } from "../lib/prisma";

/**
 * Logs an action (UPLOAD/DOWNLOAD/etc.) for a user and optional document.
 *
 * @param action - e.g., "UPLOAD" or "DOWNLOAD"
 * @param userId - Employee ID performing the action
 * @param documentId - optional, ContentManagement.fileID
 */
export async function logAudit(action: string, userId: string, documentId?: string) {
    try {
        //Ensure the employee exists
        const employee = await prisma.employee.findUnique({
            where: { employeeID: userId },
        });

        if (!employee) {
            throw new Error(`Employee with ID "${userId}" does not exist`);
        }

        const audit = await prisma.auditLog.create({
            data: {
                userId,
                action,
                documentId,
            },
        });

        //Log to console for real-time metrics
        console.log(JSON.stringify({
            type: "AUDIT_LOG",
            action,
            userId,
            documentId,
            employeeName: employee.employee_name,
            timestamp: audit.timestamp.toISOString(),
        }));

        return audit;
    } catch (err) {
        console.error("Failed to log audit:", err);
        throw err;
    }
}