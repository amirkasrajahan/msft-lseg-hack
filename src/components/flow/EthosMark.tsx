/**
 * The Ethos logo (public/ethos-logo.png, tan pillar on transparent). Drawn as a CSS mask so one file
 * works on any background. `boxed` puts it on a navy tile for light backgrounds; the hero uses it bare.
 */
export function EthosMark({ size = 36, boxed = true }: { size?: number; boxed?: boolean }) {
  return (
    <span className={`mark${boxed ? '' : ' plain'}`} style={{ width: size, height: size }} aria-hidden="true">
      <i />
    </span>
  );
}
