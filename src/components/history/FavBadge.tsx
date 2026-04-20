import { useState } from 'react'
import { useChromeApi } from '@/components/ChromeProvider'
import { cn } from '@/lib/utils'

export interface FavBadgeProps {
  host: string
  letter: string
  color: string
  pageUrl: string
  size?: 14 | 16
  className?: string
}

export function FavBadge({ host, letter, color, pageUrl, size = 16, className }: FavBadgeProps) {
  const { runtime } = useChromeApi()
  const extId = runtime.getExtensionId()
  const [failed, setFailed] = useState(false)
  const src =
    extId && !failed
      ? `chrome-extension://${extId}/_favicon/?pageUrl=${encodeURIComponent(pageUrl)}&size=${size}`
      : null

  return (
    <span
      aria-label={host}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: color,
        color: 'oklch(0.2 0.02 260)',
      }}
    >
      {src ? (
        <img
          src={src}
          role="img"
          aria-label={host}
          width={size}
          height={size}
          className="rounded"
          onError={() => setFailed(true)}
        />
      ) : (
        letter
      )}
      {src && (
        <span aria-hidden="true" style={{ display: 'none' }}>
          {letter}
        </span>
      )}
    </span>
  )
}
