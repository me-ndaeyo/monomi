export default function TabIcon({ name, color }: Readonly<{ name: string; color: string }>) {
  const common = { width: 20, height: 20, viewBox: "0 0 22 22", fill: "none", "aria-hidden": true }
  if (name === "Jobs")
    return (
      <svg {...common}>
        <path d="M11 19.5s6.5-5.6 6.5-10.6a6.5 6.5 0 00-13 0c0 5 6.5 10.6 6.5 10.6z" stroke={color} strokeWidth="1.9" />
        <circle cx="11" cy="9" r="2.3" fill={color} />
      </svg>
    )
  if (name === "Active")
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="8" stroke={color} strokeWidth="1.7" />
        <path d="M11 6.5V11l3 2" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    )
  if (name === "Wallet")
    return (
      <svg {...common}>
        <rect x="3" y="5.5" width="16" height="12" rx="2.5" stroke={color} strokeWidth="1.7" />
        <path d="M14 11.5h2.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    )
  return (
    <svg {...common}>
      <circle cx="11" cy="8" r="3.5" stroke={color} strokeWidth="1.7" />
      <path d="M4.5 18.5c1.2-3 3.7-4.5 6.5-4.5s5.3 1.5 6.5 4.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}
