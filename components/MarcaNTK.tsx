export function MarcaNTK({ subtitulo }: { subtitulo?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-11 h-11 flex items-center justify-center font-display font-bold text-lg"
        style={{ background: "var(--ntk-preto)", color: "var(--ntk-amarelo)", borderRadius: 4 }}
      >
        NTK
      </div>
      <div className="leading-tight">
        <div className="font-display font-bold text-lg tracking-tight">Grupo Nautika</div>
        {subtitulo && (
          <div className="font-mono text-xs uppercase tracking-wide" style={{ color: "var(--ntk-laranja-forte)" }}>
            {subtitulo}
          </div>
        )}
      </div>
    </div>
  );
}
