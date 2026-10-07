import { useEffect, useRef, type ReactNode } from 'react';

export default function Modal({ children, title, onClose, busy = false }: {
    children: ReactNode; title: string; onClose: () => void; busy?: boolean;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    const opener = useRef<HTMLElement | null>(null);
    useEffect(() => {
        const dialog = ref.current;
        opener.current ??= document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const previousOverflow = document.body.style.overflow;
        dialog?.showModal();
        dialog?.querySelector<HTMLInputElement>('input')?.focus();
        document.body.style.overflow = 'hidden';
        return () => {
            dialog?.close(); document.body.style.overflow = previousOverflow;
            if (opener.current?.isConnected) opener.current.focus();
        };
    }, []);
    return <dialog ref={ref} className="modal-card" aria-label={title}
        onKeyDown={event => {
            if (event.key !== 'Tab') return;
            const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
                'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]',
            )).filter(element => element.getClientRects().length > 0);
            const first = items[0]; const last = items.at(-1);
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}
        onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
        {children}
    </dialog>;
}
