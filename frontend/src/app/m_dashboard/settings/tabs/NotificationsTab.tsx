import { Check, Save } from 'lucide-react';

type NotificationsTabProps = {
  colors: Record<string, any>;
  theme: string;
  emailNotifications: boolean;
  orderNotifications: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
  setEmailNotifications: (value: boolean) => void;
  setOrderNotifications: (value: boolean) => void;
  setMarketingEmails: (value: boolean) => void;
  setSecurityAlerts: (value: boolean) => void;
  saveSuccess: boolean;
  onSave: () => void;
};

export function NotificationsTab({
  colors,
  theme,
  emailNotifications,
  orderNotifications,
  marketingEmails,
  securityAlerts,
  setEmailNotifications,
  setOrderNotifications,
  setMarketingEmails,
  setSecurityAlerts,
  saveSuccess,
  onSave,
}: NotificationsTabProps) {
  const isDark = theme === 'dark';
  const switchBg = (active: boolean) =>
    active ? '#8B5CF6' : 'rgba(148,163,184,0.5)';

  return (
    <>
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-1 h-6 rounded-full ${theme === 'dark' ? 'bg-violet-500' : 'bg-violet-600'}`} />
          <h2 className="text-2xl font-black uppercase tracking-tight" style={{ color: colors.text.primary }}>
            Notification Preferences
          </h2>
        </div>
        <p className="text-sm font-medium opacity-60 leading-relaxed max-w-md" style={{ color: colors.text.secondary }}>
          Choose how you want to be notified about activity
        </p>
      </div>

      <div className="space-y-4">
        {[
          {
            title: 'Email Notifications',
            desc: 'Receive email updates about your account',
            value: emailNotifications,
            setValue: setEmailNotifications,
            bordered: true,
          },
          {
            title: 'Order Updates',
            desc: 'Get notified when orders are placed or updated',
            value: orderNotifications,
            setValue: setOrderNotifications,
            bordered: true,
          },
          {
            title: 'Marketing Emails',
            desc: 'Receive tips, promotions, and updates',
            value: marketingEmails,
            setValue: setMarketingEmails,
            bordered: true,
          },
          {
            title: 'Security Alerts',
            desc: 'Important notifications about your account security',
            value: securityAlerts,
            setValue: setSecurityAlerts,
            bordered: false,
          },
        ].map((item) => (
          <div
            key={item.title}
            className={`flex items-start justify-between py-3 ${item.bordered ? 'border-b' : ''}`}
            style={{ borderColor: colors.border.faint }}
          >
            <div className="flex-1">
              <h3 className="font-medium mb-1" style={{ color: colors.text.primary }}>
                {item.title}
              </h3>
              <p className="text-sm" style={{ color: colors.text.muted }}>
                {item.desc}
              </p>
            </div>
            <button
              onClick={() => item.setValue(!item.value)}
              className="relative w-12 h-6 rounded-full transition-all duration-300"
              style={{
                backgroundColor: switchBg(item.value),
                boxShadow: item.value
                  ? isDark
                    ? '0 0 0 1px rgba(139, 92, 246, 0.28), 0 0 18px rgba(139, 92, 246, 0.35)'
                    : '0 0 0 1px rgba(139, 92, 246, 0.25), 0 0 16px rgba(139, 92, 246, 0.28)'
                  : 'none',
              }}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${item.value ? 'translate-x-6' : ''}`}
                style={{
                  boxShadow: item.value
                    ? isDark
                      ? '0 0 12px rgba(139, 92, 246, 0.45)'
                      : '0 0 12px rgba(139, 92, 246, 0.35)'
                    : 'none',
                }}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-10 border-t" style={{ borderColor: colors.border.faint }}>
        <button
          onClick={onSave}
          className={`relative group flex items-center gap-3 px-10 py-4 rounded-full cursor-pointer transition-all duration-300 ease-out active:scale-95 disabled:opacity-50 hover:-translate-y-1 hover:brightness-110 ${
            isDark ? 'hover:shadow-[0_12px_28px_rgba(255,206,0,0.55)]' : 'hover:shadow-[0_12px_28px_rgba(217,70,239,0.5)]'
          }`}
          style={
            isDark
              ? {
                  background: '#FFCC00',
                  color: '#120533',
                  boxShadow: '0 8px 24px rgba(255, 206, 0, 0.42)',
                }
              : {
                  background: 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)',
                  boxShadow: '0 8px 24px rgba(217,70,239,0.4)',
                }
          }
        >
          <div className="relative z-10 flex items-center gap-3">
            {saveSuccess ? <Check className={`w-4 h-4 ${isDark ? 'text-[#120533]' : 'text-white'}`} /> : <Save className={`w-4 h-4 ${isDark ? 'text-[#120533]' : 'text-white'}`} />}
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-[#120533]' : 'text-white'}`}>
              {saveSuccess ? 'Saved!' : 'Save Preferences'}
            </span>
          </div>
        </button>
      </div>
    </>
  );
}
