interface IconProps {
  color?: string
  size?: number
}

export function LockIcon({ color = "currentColor", size = 12 }: Readonly<IconProps>) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2.5" y="6" width="9" height="6.5" rx="1.5" stroke={color} strokeWidth="1.5" />
      <path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

export function WalkIcon({ color = "currentColor", size = 13 }: Readonly<IconProps>) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="8" cy="2.5" r="1.5" fill={color} />
      <path d="M6.5 5.5L5 9l2 1.5L6 13.5M6.5 5.5l2.5 1 1.5 2M5 9L3 10.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ArrowIcon({ color = "currentColor", size = 18 }: Readonly<IconProps>) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 9h10M10 5l4 4-4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChevronIcon({ color = "currentColor", size = 18, back = false }: Readonly<IconProps & { back?: boolean }>) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d={back ? "M11 4L6 9l5 5" : "M7 4l5 5-5 5"} stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CloseIcon({ color = "currentColor", size = 16 }: Readonly<IconProps>) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function ShieldIcon({ color = "currentColor", size = 18 }: Readonly<IconProps>) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 1.8l6 2.4v4.3c0 3.6-2.5 6.4-6 7.7-3.5-1.3-6-4.1-6-7.7V4.2l6-2.4z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

export function CheckDot({ ok, size = 20 }: Readonly<{ ok: boolean; size?: number }>) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill={ok ? "#3FB67A" : "#E5484D"} />
      <path d={ok ? "M6 10.2l2.6 2.6L14 7.5" : "M7 7l6 6M13 7l-6 6"} stroke="#0B0C0A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
