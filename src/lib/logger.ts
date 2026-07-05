export function logError(req: Request, route: string, errorType: string, details?: any) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    requestId,
    route,
    errorType,
    details: process.env.NODE_ENV === 'development' ? details : undefined,
  }));
}
