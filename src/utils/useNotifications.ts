// src/utils/useNotifications.ts
// Sistema completo de notificações: Web Notifications API + Service Worker

import { useEffect, useRef, useCallback, useState } from 'react';
import { TaskAPI } from './taskService';

export type NotifPermission = 'default' | 'granted' | 'denied';

export interface ScheduledNotif {
  taskId: string;
  title: string;
  body: string;
  fireAt: number; // timestamp ms
  timerId?: ReturnType<typeof setTimeout>;
}

// ── Registra o Service Worker ──────────────────────────
async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch (e) {
    console.warn('[Notifs] SW registration failed:', e);
    return null;
  }
}

// ── Solicita permissão ──────────────────────────────────
export async function requestPermission(): Promise<NotifPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result as NotifPermission;
}

// ── Dispara notificação via SW (melhor suporte mobile) ou direta ──
async function fireNotification(
  reg: ServiceWorkerRegistration | null,
  title: string,
  options: NotificationOptions & { body: string }
) {
  if (reg && reg.active) {
    reg.active.postMessage({ type: 'SHOW_NOTIFICATION', title, options });
    return;
  }
  // Fallback: Notification direta
  if (Notification.permission === 'granted') {
    new Notification(title, options);
  }
}

// ── Formata tempo restante ─────────────────────────────
function timeUntil(ms: number): string {
  const diff = ms - Date.now();
  if (diff <= 0) return 'agora';
  const m = Math.floor(diff / 60000);
  if (m < 60) return `em ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `em ${h}h`;
  return `em ${Math.floor(h / 24)} dia(s)`;
}

// ── Hook principal ─────────────────────────────────────
export function useNotifications(tasks: TaskAPI[]) {
  const [permission, setPermission] = useState<NotifPermission>(
    typeof Notification !== 'undefined'
      ? (Notification.permission as NotifPermission)
      : 'default'
  );
  const [swReg, setSwReg] = useState<ServiceWorkerRegistration | null>(null);
  const [scheduledCount, setScheduledCount] = useState(0);
  const scheduled = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Registra SW no mount
  useEffect(() => {
    registerSW().then((reg) => {
      if (reg) setSwReg(reg);
    });
  }, []);

  // Pede permissão
  const askPermission = useCallback(async () => {
    const p = await requestPermission();
    setPermission(p);
    return p;
  }, []);

  // Cancela todos os timers
  const clearAll = useCallback(() => {
    scheduled.current.forEach((id) => clearTimeout(id));
    scheduled.current.clear();
    setScheduledCount(0);
  }, []);

  // Agenda notificações para todas as tarefas pendentes com dueDate
  const scheduleAll = useCallback(
    (taskList: TaskAPI[]) => {
      if (permission !== 'granted') return;
      clearAll();

      let count = 0;
      const now = Date.now();

      taskList.forEach((task) => {
        if (task.completed || !task.dueDate) return;

        const due = new Date(task.dueDate).getTime();
        const priority = task.priority;
        const prioLabel = priority === 'high' ? '🔴 Alta' : priority === 'medium' ? '🟡 Média' : '🟢 Baixa';

        // Helper: agendar um disparo
        const schedule = (fireAt: number, msgPrefix: string) => {
          const delay = fireAt - now;
          if (delay < 0) return;

          const key = `${task._id}-${fireAt}`;
          if (scheduled.current.has(key)) return;

          const id = setTimeout(async () => {
            await fireNotification(swReg, `📋 ${task.title}`, {
              body: `${msgPrefix} • Prioridade: ${prioLabel}${task.tags?.length ? ' • #' + task.tags.slice(0, 2).join(' #') : ''}`,
              tag: key,
              requireInteraction: priority === 'high',
              data: { url: '/' },
            } as any);
            scheduled.current.delete(key);
            setScheduledCount((c) => Math.max(0, c - 1));
          }, delay);

          scheduled.current.set(key, id);
          count++;
        };

        // Notificação no momento exato
        schedule(due, `⏰ Vence agora!`);

        // 30 min antes
        schedule(due - 30 * 60 * 1000, `⚡ Vence em 30 min`);

        // 1 hora antes
        schedule(due - 60 * 60 * 1000, `⏳ Vence em 1 hora`);

        // 1 dia antes
        schedule(due - 24 * 60 * 60 * 1000, `📅 Vence amanhã`);

        // Se já venceu e não completou: notificação imediata
        if (due < now) {
          const overdueKey = `${task._id}-overdue`;
          if (!scheduled.current.has(overdueKey)) {
            // Dispara em 500ms para não travar o render
            const id = setTimeout(async () => {
              await fireNotification(swReg, `🚨 Tarefa atrasada!`, {
                body: `"${task.title}" está atrasada! • ${prioLabel}`,
                tag: overdueKey,
                requireInteraction: true,
                data: { url: '/' },
              } as any);
              scheduled.current.delete(overdueKey);
            }, 500);
            scheduled.current.set(overdueKey, id);
            count++;
          }
        }
      });

      setScheduledCount(count);
    },
    [permission, swReg, clearAll]
  );

  // Notificação de teste imediata
  const testNotification = useCallback(async () => {
    if (permission !== 'granted') {
      const p = await askPermission();
      if (p !== 'granted') return false;
    }
    await fireNotification(swReg, '✅ Doodle Tasks', {
      body: 'Notificações ativadas! Você será avisado sobre seus prazos. 🎉',
      tag: 'test-notif',
      requireInteraction: false,
      data: { url: '/' },
    } as any);
    return true;
  }, [permission, swReg, askPermission]);

  // Re-agenda quando as tasks mudam
  useEffect(() => {
    if (permission === 'granted' && tasks.length > 0) {
      scheduleAll(tasks);
    }
    return () => {
      // Não limpa ao desmontar para manter notificações agendadas
    };
  }, [tasks, permission]);

  // Limpa ao desmontar o app
  useEffect(() => {
    return () => clearAll();
  }, []);

  return {
    permission,
    scheduledCount,
    askPermission,
    testNotification,
    scheduleAll,
    clearAll,
  };
}
