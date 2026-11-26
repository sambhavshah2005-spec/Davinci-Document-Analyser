"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Navigation from "./Navigation";
import Branding from "./Branding";
import styles from "../app/page.module.css";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [showTools, setShowTools] = useState(true);
  const [showBranding, setShowBranding] = useState(true);
  const pathname = usePathname();

  const getCurrentMode = (): "ask" | "research" | "workflows" | "analyzer" => {
    if (pathname.includes('/research')) return 'research';
    if (pathname.includes('/workflows')) return 'workflows';
    if (pathname.includes('/analyzer')) return 'analyzer';
    return 'ask';
  };

  return (
    <div className={styles.page} style={{ padding: 0, gap: 0 }}>
      <div className={styles.container}>
        <Navigation 
          currentMode={getCurrentMode()}
          showTools={showTools}
          onToggleTools={() => setShowTools(!showTools)}
        />
        {!showTools && (
          <button onClick={() => setShowTools(true)} className={`${styles.openButton} ${styles.left}`}>
            &gt;
          </button>
        )}
        {children}
        <Branding 
          showBranding={showBranding}
          onToggleBranding={() => setShowBranding(!showBranding)}
        />
        {!showBranding && (
          <button onClick={() => setShowBranding(true)} className={`${styles.openButton} ${styles.right}`}>
            &lt;
          </button>
        )}
      </div>
    </div>
  );
} 