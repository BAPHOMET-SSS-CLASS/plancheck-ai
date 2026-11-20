import type { BlueprintDocument } from '../types/inspection';

export type ActiveTab = 'workspace' | 'rules' | 'history';

interface TopBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  document: BlueprintDocument | null;
  isInspecting: boolean;
  onTriggerInspect: () => void;
  onTriggerUpload: () => void;
}

export function TopBar({
  activeTab,
  onSelectTab,
  document,
  isInspecting,
  onTriggerInspect,
  onTriggerUpload,
}: TopBarProps) {
  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'workspace', label: 'ห้องตรวจแบบ' },
    { id: 'rules', label: 'เกณฑ์มาตรฐาน' },
    { id: 'history', label: 'ประวัติการตรวจ' },
  ];

  return (
    <header className="no-print sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-8">
      <a
        href="#workspace"
        onClick={(e) => {
          e.preventDefault();
          onSelectTab('workspace');
        }}
        className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
      >
        PlanCheck
      </a>

      <nav className="flex items-center gap-7" aria-label="เมนูหลัก">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm ${
                isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {item.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700"
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center shrink-0">
        {document ? (
          <button
            type="button"
            disabled={isInspecting}
            onClick={() => {
              if (activeTab !== 'workspace') {
                onSelectTab('workspace');
              }
              onTriggerInspect();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            {isInspecting ? 'กำลังตรวจแบบ...' : 'เริ่มตรวจแบบแปลน'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (activeTab !== 'workspace') {
                onSelectTab('workspace');
              }
              onTriggerUpload();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            อัปโหลดแบบแปลน
          </button>
        )}
      </div>
    </header>
  );
}
