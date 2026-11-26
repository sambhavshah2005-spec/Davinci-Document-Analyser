"use client";
import Link from "next/link";
import styles from "../app/page.module.css";

interface NavigationProps {
  currentMode: "ask" | "research" | "workflows" | "analyzer";
  showTools: boolean;
  onToggleTools: () => void;
}

export default function Navigation({ currentMode, showTools, onToggleTools }: NavigationProps) {
  return (
    <div className={`${styles.toolsSection} ${!showTools ? styles.hidden : ''}`}>
      <button onClick={onToggleTools} className={styles.closeButton}>
        &lt;
      </button>
      <div className={styles.toolsContent}>
        <h2 className={styles.toolsTitle}>Tools</h2>
        <div className={styles.toolsList}>
          <Link href="/ask" className={`${styles.toolButton} ${currentMode === 'ask' ? styles.active : ''}`}>
            <span className={styles.toolIcon}>🔍</span>
            Ask
          </Link>
          <Link href="/research" className={`${styles.toolButton} ${currentMode === 'research' ? styles.active : ''}`}>
            <span className={styles.toolIcon}>🔬</span>
            Research
          </Link>
          <Link href="/workflows" className={`${styles.toolButton} ${currentMode === 'workflows' ? styles.active : ''}`}>
            <span className={styles.toolIcon}>⚙️</span>
            Workflows
          </Link>
          <Link href="/analyzer" className={`${styles.toolButton} ${currentMode === 'analyzer' ? styles.active : ''}`}>
            <span className={styles.toolIcon}>📄</span>
            Analyzer
          </Link>
        </div>
      </div>
    </div>
  );
} 