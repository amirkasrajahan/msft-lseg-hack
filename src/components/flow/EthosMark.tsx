/** The Ethos mark: a leaf in a circle. Colours default to the current theme. */
export function EthosMark({ size = 36, fill = 'var(--brand)', stroke = 'var(--on-brand)' }: { size?: number; fill?: string; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="18" fill={fill} />
      <path d="M11 24c0-8 5-12 14-12 0 8-4 13-12 13l-2 3" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
