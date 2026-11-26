"use client";
import styles from "../app/page.module.css";

interface BrandingProps {
  showBranding: boolean;
  onToggleBranding: () => void;
}

export default function Branding({ showBranding, onToggleBranding }: BrandingProps) {
  return (
    <div className={`${styles.brandingSection} ${!showBranding ? styles.hidden : ''}`}>
      <button onClick={onToggleBranding} className={styles.closeButton}>
        &gt;
      </button>
      <div className={styles.brandingContent}>
        <div className={styles.logoContainer}>
          <div className={styles.logo}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M16 32C16 23.1634 23.1634 16 32 16C40.8366 16 48 23.1634 48 32C48 40.8366 40.8366 48 32 48" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M32 48L40 40L32 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className={styles.brandName}>Davinci</h1>
          <p className={styles.brandTagline}>Your AI Knowledge Assistant</p>
        </div>
        <div className={styles.brandingFeatures}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🧠</div>
            <div className={styles.featureText}>
              <h3>Smart Search</h3>
              <p>Find answers in your documents instantly</p>
            </div>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>📚</div>
            <div className={styles.featureText}>
              <h3>Knowledge Base</h3>
              <p>Upload and organize your documents</p>
            </div>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>💬</div>
            <div className={styles.featureText}>
              <h3>Natural Chat</h3>
              <p>Ask questions in plain language</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 