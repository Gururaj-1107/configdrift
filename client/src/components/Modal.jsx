import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

/**
 * Modal — accessible, animated modal with:
 *  - Backdrop fade + panel slide-up animations
 *  - ESC key to close
 *  - Backdrop click to close
 *  - Auto-focus first focusable element on open
 *  - Focus trap within modal
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - title: string
 *  - children: ReactNode
 *  - size: 'sm' | 'md' | 'lg' (default 'md')
 *  - hideCloseButton: boolean
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  hideCloseButton = false,
}) {
  const panelRef = useRef(null);
  const previousFocus = useRef(null);

  const SIZES = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
  };

  // Focus trap & ESC handler
  useEffect(() => {
    if (!isOpen) return;

    // Save current focus target
    previousFocus.current = document.activeElement;

    // Auto-focus first focusable element
    const timer = setTimeout(() => {
      if (panelRef.current) {
        const focusable = panelRef.current.querySelectorAll(
          'input, textarea, select, button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    }, 60); // slight delay for animation

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll(
            'input, textarea, select, button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus when modal closes
      if (previousFocus.current) {
        previousFocus.current.focus();
      }
    };
  }, [isOpen, onClose]);

  // Prevent scroll on body while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm animate-backdrop-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`
          relative w-full ${SIZES[size] ?? SIZES.md}
          bg-slate-900 border border-slate-800/80
          rounded-xl shadow-2xl
          animate-modal-in
        `}
      >
        {/* Header */}
        {(title || !hideCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            {title && (
              <h2
                id="modal-title"
                className="text-sm font-semibold text-slate-100 tracking-tight"
              >
                {title}
              </h2>
            )}
            {!hideCloseButton && (
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="ml-auto p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div>{children}</div>
      </div>
    </div>
  );
}
