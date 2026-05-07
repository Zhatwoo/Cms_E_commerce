import { Moon, Sun } from 'lucide-react';

type AppearanceTabProps = {
  colors: Record<string, any>;
  theme: string;
  toggleTheme: () => void;
};

export function AppearanceTab({ colors, theme, toggleTheme }: AppearanceTabProps) {
  return (
    <>
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-1 h-6 rounded-full ${theme === 'dark' ? 'bg-violet-500' : 'bg-violet-600'}`} />
          <h2 className="text-2xl font-black uppercase tracking-tight" style={{ color: colors.text.primary }}>
            Appearance
          </h2>
        </div>
        <p className="text-sm font-medium opacity-60 leading-relaxed max-w-md" style={{ color: colors.text.secondary }}>
          Customize how your dashboard looks
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-3" style={{ color: colors.text.primary }}>
            Theme
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => theme === 'dark' && toggleTheme()}
              className={`p-4 rounded-lg border-2 transition-all ${theme === 'light' ? 'border-violet-500' : 'border-transparent'}`}
              style={{
                backgroundColor: colors.bg.elevated,
                borderColor: theme === 'light' ? '#B13BFF' : colors.border.faint,
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Sun className="w-5 h-5 text-yellow-500" />
                <span className="font-medium" style={{ color: colors.text.primary }}>
                  Light
                </span>
              </div>
              <div className="h-16 rounded bg-white border" style={{ borderColor: colors.border.faint }}>
                <div className="h-1/3 bg-gray-100 border-b" style={{ borderColor: colors.border.faint }} />
              </div>
            </button>

            <button
              onClick={() => theme === 'light' && toggleTheme()}
              className={`p-4 rounded-lg border-2 transition-all ${theme === 'dark' ? 'border-violet-500' : 'border-transparent'}`}
              style={{
                backgroundColor: colors.bg.elevated,
                borderColor: theme === 'dark' ? '#B13BFF' : colors.border.faint,
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Moon className="w-5 h-5 text-blue-500" />
                <span className="font-medium" style={{ color: colors.text.primary }}>
                  Dark
                </span>
              </div>
              <div className="h-16 rounded bg-gray-900 border border-gray-800">
                <div className="h-1/3 bg-gray-800 border-b border-gray-700" />
              </div>
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-3" style={{ color: colors.text.primary }}>
            Accent Color
          </h3>
          <div className="flex gap-3">
            {['#B13BFF', '#B36760', '#FFCC00', '#22C55E', '#38BDF8', '#F97316'].map((color) => (
              <button
                key={color}
                className="w-12 h-12 rounded-lg border-2 hover:scale-110 transition-transform"
                style={{
                  backgroundColor: color,
                  borderColor: color === '#B13BFF' ? colors.text.primary : 'transparent',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
