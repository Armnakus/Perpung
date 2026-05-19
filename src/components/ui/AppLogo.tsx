import clsx from 'clsx'

type AppLogoProps = {
  className?: string
  variant?: 'full' | 'mark'
  title?: string
}

export function AppLogo({ className, title = 'per.pung', variant = 'full' }: AppLogoProps) {
  if (variant === 'mark') {
    return (
      <svg
        aria-label={title}
        className={clsx('text-cocoa-600', className)}
        role="img"
        viewBox="0 0 190 145"
        xmlns="http://www.w3.org/2000/svg"
      >
        <LogoMark />
      </svg>
    )
  }

  return (
    <svg
      aria-label={title}
      className={clsx('text-cocoa-600', className)}
      role="img"
      viewBox="0 0 560 300"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(186 16) scale(1.08)">
        <LogoMark />
      </g>
      <text
        fill="currentColor"
        fontFamily='"Mali", "Comic Sans MS", "Segoe Print", cursive'
        fontSize="102"
        fontWeight="700"
        letterSpacing="-1"
        x="42"
        y="215"
      >
        per.pung
      </text>
      <path
        d="M150 254C220 231 323 227 423 234"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="10"
      />
      <circle cx="462" cy="241" fill="currentColor" r="10" />
    </svg>
  )
}

function LogoMark() {
  return (
    <>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="7.5">
        <path d="M46 83c-12-1-22-10-22-22 0-12 11-21 24-20 5-14 20-23 35-19 5-11 18-16 30-9 7-6 19-5 26 3 10-1 21 7 22 18 16 2 27 16 24 32-2 12-11 22-23 25 0 12-12 22-25 19-10 10-27 10-38 2-14 8-33 5-42-6-14 5-28-4-28-18 0-2 0-4 1-6Z" />
        <path d="M88 41 123 19l39 26" />
        <rect height="33" rx="6" transform="rotate(-38 77 58)" width="41" x="56" y="41" />
        <rect height="33" rx="6" transform="rotate(-38 122 37)" width="41" x="101" y="20" />
        <rect height="34" rx="6" transform="rotate(-38 137 67)" width="42" x="116" y="50" />
        <path d="M91 85c10-8 25-13 39-12" />
        <path d="M102 86h36" />
        <path d="M12 38 30 49" />
        <path d="M31 16 43 34" />
        <path d="M62 3 67 25" />
      </g>
    </>
  )
}
