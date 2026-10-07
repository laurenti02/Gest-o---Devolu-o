export function MarcaNTK({ subtitulo }: { subtitulo?: string }) {
  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-nautika.png" alt="Grupo Nautika" style={{ height: 40, width: "auto" }} />
      {subtitulo && (
        <div
          className="font-mono text-xs uppercase tracking-wide leading-tight"
          style={{ color: "var(--ntk-laranja-forte)" }}
        >
          {subtitulo}
        </div>
      )}
    </div>
  );
}
