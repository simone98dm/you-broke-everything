import React from 'react';

interface XpWindowProps {
  titleId: string;
  title: string;
  icon?: React.ReactNode;
  titleExtra?: React.ReactNode;
  statusBar?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** A mid-2000s desktop window: blue title bar (the section heading), beige body, optional status bar */
export function XpWindow({ titleId, title, icon, titleExtra, statusBar, className = '', children }: XpWindowProps) {
  return (
    <section aria-labelledby={titleId} className={`xp-window flex flex-col min-w-0 ${className}`}>
      <div className="xp-titlebar">
        {icon && <span aria-hidden="true" className="shrink-0 flex">{icon}</span>}
        <h2 id={titleId} className="text-[14px] font-bold truncate">{title}</h2>
        {titleExtra && <div className="ml-auto shrink-0 flex items-center">{titleExtra}</div>}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
      {statusBar && <div className="xp-statusbar">{statusBar}</div>}
    </section>
  );
}
