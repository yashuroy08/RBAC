import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook to automatically perform an action after a period of inactivity.
 * @param {Function} onTimeout - The function to call when the timeout is reached.
 * @param {number} timeoutMs - The timeout duration in milliseconds (default: 30 minutes).
 */
export const useInactivityTimeout = (onTimeout, timeoutMs = 30 * 60 * 1000) => {
    const timerRef = useRef(null);

    const resetTimer = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(onTimeout, timeoutMs);
    }, [onTimeout, timeoutMs]);

    useEffect(() => {
        // List of events that reset the inactivity timer
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click'
        ];

        // Only start the monitor if we have a function to call
        if (onTimeout) {
            resetTimer(); // Initialize timer

            const handleUserActivity = () => resetTimer();

            events.forEach(event => {
                window.addEventListener(event, handleUserActivity);
            });

            return () => {
                if (timerRef.current) clearTimeout(timerRef.current);
                events.forEach(event => {
                    window.removeEventListener(event, handleUserActivity);
                });
            };
        }
    }, [onTimeout, resetTimer]);
};
