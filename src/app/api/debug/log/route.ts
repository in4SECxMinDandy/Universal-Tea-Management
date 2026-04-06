import { appendFileSync } from 'fs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const logPath = 'C:\\Users\\haqua\\Documents\\GitHub\\universaltea\\debug-6649c4.log'
    appendFileSync(logPath, JSON.stringify({ ...body, ts: Date.now() }) + '\n')
    return Response.json({ ok: true })
  } catch (e: unknown) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
