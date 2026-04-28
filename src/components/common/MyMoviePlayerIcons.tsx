type IconSizeProps = {
  size?: number
}

/** 재생 중 — 일시정지(두 막대) */
export function PauseBarsIcon({ size = 22 }: IconSizeProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="5" y="4" width="5" height="16" rx="1" />
      <rect x="14" y="4" width="5" height="16" rx="1" />
    </svg>
  )
}
