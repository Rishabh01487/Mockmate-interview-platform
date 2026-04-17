import React, { useEffect, useRef, useCallback } from 'react';

/**
 * ProctoringMonitor
 *
 * Detects:
 *  - Tab visibility change (document visibilitychange)
 *  - Window blur (user clicks away)
 *  - Right-click (context menu)
 *
 * Props:
 *   enabled          — boolean
 *   tabSwitchLimit   — number of violations before auto-suspend (default 1)
 *   onViolation(type, count) — called on every violation
 *   onSuspend()      — called when limit is reached
 *   isSuspended      — boolean; when true shows suspension overlay
 *   onReviveRequest() — called when candidate requests revival
 *   sessionId        — used in the revival message
 */
const ProctoringMonitor = ({
  enabled = true,
  tabSwitchLimit = 1,
  onViolation,
  onSuspend,
  isSuspended,
  onReviveRequest,
  sessionId = '',
}) => {
  const violationCountRef = useRef(0);
  const suspendedRef = useRef(false);

  const triggerViolation = useCallback((type) => {
    if (!enabled || suspendedRef.current) return;
    violationCountRef.current += 1;
    const count = violationCountRef.current;
    onViolation && onViolation(type, count);

    if (count >= tabSwitchLimit) {
      suspendedRef.current = true;
      onSuspend && onSuspend();
    }
  }, [enabled, tabSwitchLimit, onViolation, onSuspend]);

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) triggerViolation('tab_switch');
    };
    const handleBlur = () => {
      // Small delay to avoid false positives on click within page
      setTimeout(() => {
        if (document.hidden) return; // already caught by visibilitychange
        triggerViolation('window_blur');
      }, 200);
    };
    const handleContextMenu = (e) => {
      e.preventDefault();
      triggerViolation('right_click');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [triggerViolation, enabled]);

  // Sync external isSuspended prop
  useEffect(() => {
    suspendedRef.current = isSuspended;
  }, [isSuspended]);

  if (!isSuspended) return null;

  // ── Suspension Overlay ───────────────────────────────────────
  return (
    <div className="proctor-overlay" role="alertdialog" aria-modal="true" aria-label="Interview suspended">
      <div className="proctor-card">
        <div className="proctor-icon" aria-hidden="true">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        <h2 className="proctor-title">Interview Suspended</h2>
        <p className="proctor-desc">
          You switched tabs or left the interview window. This session has been
          <strong> automatically paused</strong> and the interviewer has been notified.
        </p>

        {sessionId && (
          <div className="proctor-session-id">
            <span className="proctor-session-label">Session ID</span>
            <code className="proctor-session-code">{sessionId}</code>
            <p className="proctor-session-hint">
              Provide this ID to your interviewer to request session revival.
            </p>
          </div>
        )}

        <div className="proctor-actions">
          <button
            id="request-revival-btn"
            className="ip-btn-primary"
            onClick={onReviveRequest}
          >
            Request Revival from Interviewer
          </button>
        </div>

        <p className="proctor-footer-note">
          Your session can only be resumed after the interviewer approves your request.
        </p>
      </div>
    </div>
  );
};

export default ProctoringMonitor;
