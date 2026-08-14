const GRADIENTS = [
  'linear-gradient(150deg,#7C5CFF,#4A32B8)',
  'linear-gradient(150deg,#0085FF,#0050A8)',
  'linear-gradient(150deg,#16B27A,#0B7A4E)',
  'linear-gradient(150deg,#F2A33C,#C16A0B)',
  'linear-gradient(150deg,#F2576B,#B02342)',
  'linear-gradient(150deg,#3A3F52,#0B0E1F)'
]

function hash(s: string): number {
  let h = 0

  for (let i = 0; i < s.length; i += 1)
    h = (h * 31 + s.charCodeAt(i)) % 1_000_000_007

  return h
}

export function coverGradient(title: string): string {
  return GRADIENTS[Math.abs(hash(title)) % GRADIENTS.length]
}

export function BookCover({
  title,
  className = 'cover'
}: {
  title: string
  className?: string
}) {
  const abbrev = title
    .split(/\s+/)
    .slice(0, 4)
    .map((w) => w.toUpperCase())
    .join(' ')

  return (
    <div className={className} style={{ background: coverGradient(title) }}>
      <span>{abbrev}</span>
    </div>
  )
}
