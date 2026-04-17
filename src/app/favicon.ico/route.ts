const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="18" fill="#C8A96E" />
  <text
    x="32"
    y="38"
    text-anchor="middle"
    font-family="Georgia, serif"
    font-size="28"
    font-weight="700"
    fill="#FFFFFF"
  >
    U
  </text>
</svg>
`.trim()

export async function GET() {
  return new Response(faviconSvg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  })
}
