type ApiKeysTabProps = {
  colors: Record<string, any>;
};

export function ApiKeysTab({ colors }: ApiKeysTabProps) {
  return (
    <>
      <div>
        <h2 className="text-xl font-semibold mb-1" style={{ color: colors.text.primary }}>
          API Keys
        </h2>
        <p className="text-sm" style={{ color: colors.text.muted }}>
          Manage integration keys and developer access.
        </p>
      </div>

      <div className="p-5 rounded-xl border" style={{ backgroundColor: colors.bg.elevated, borderColor: colors.border.faint }}>
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          API key management is coming soon.
        </p>
      </div>
    </>
  );
}
