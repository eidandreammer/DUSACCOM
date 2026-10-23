export const dynamic = 'force-dynamic';
export function GET() { return Response.json({ status: 'ok', service: 'dusaccom', version: '2.0.0' }, { headers: { 'Cache-Control': 'no-store' } }); }
