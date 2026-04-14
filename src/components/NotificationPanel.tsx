// src/components/NotificationPanel.tsx
// Painel de configuração e status de notificações para Doodle Tasks

import React, { useState, useEffect } from 'react';
import { useNotifications } from '../utils/useNotifications';
import { TaskAPI } from '../utils/taskService';

interface NotificationPanelProps {
  tasks: TaskAPI[];
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ tasks }) => {
  const { permission, scheduledCount, askPermission, testNotification, clearAll } = useNotifications(tasks);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleEnable = async () => {
    const p = await askPermission();
    if (p === 'granted') showToast('✅ Notificações ativadas!');
    else if (p === 'denied') showToast('❌ Permissão negada. Verifique as configurações do browser.');
  };

  const handleTest = async () => {
    setTesting(true);
    const ok = await testNotification();
    setTesting(false);
    showToast(ok ? '🔔 Notificação de teste enviada!' : '❌ Ative as notificações primeiro.');
  };

  const handleClear = () => {
    clearAll();
    showToast('🗑️ Notificações agendadas canceladas.');
  };

  const statusColor = permission === 'granted' ? '#6BCB77' : permission === 'denied' ? '#EF476F' : '#FFD166';
  const statusLabel = permission === 'granted' ? 'Ativas' : permission === 'denied' ? 'Bloqueadas' : 'Não configuradas';
  const statusIcon = permission === 'granted' ? '🔔' : permission === 'denied' ? '🔕' : '🔕';

  // Tarefas com prazo nas próximas 24h
  const upcoming = tasks.filter((t) => {
    if (t.completed || !t.dueDate) return false;
    const diff = new Date(t.dueDate).getTime() - Date.now();
    return diff > 0 && diff < 24 * 60 * 60 * 1000;
  });

  const overdue = tasks.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate).getTime() < Date.now());

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={styles.toast}>
          {toast}
        </div>
      )}

      <div style={styles.panel}>
        {/* Header clicável */}
        <div style={styles.header} onClick={() => setExpanded((e) => !e)}>
          <div style={styles.headerLeft}>
            <span style={styles.bellIcon}>{statusIcon}</span>
            <div>
              <div style={styles.headerTitle}>Notificações</div>
              <div style={{ ...styles.statusBadge, background: statusColor + '22', color: statusColor, border: `1.5px solid ${statusColor}` }}>
                {statusLabel}
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#aaa', marginLeft: 'auto' }}>
            {expanded ? '▲' : '▼'}
          </span>
        </div>

        {/* Body expansível */}
        {expanded && (
          <div style={styles.body}>
            {/* Status cards */}
            <div style={styles.statsRow}>
              <div style={styles.statCard}>
                <span style={styles.statNum}>{scheduledCount}</span>
                <span style={styles.statLabel}>Agendadas</span>
              </div>
              <div style={{ ...styles.statCard, borderTop: '3px solid #EF476F' }}>
                <span style={styles.statNum}>{overdue.length}</span>
                <span style={styles.statLabel}>Atrasadas</span>
              </div>
              <div style={{ ...styles.statCard, borderTop: '3px solid #FFD166' }}>
                <span style={styles.statNum}>{upcoming.length}</span>
                <span style={styles.statLabel}>Próx. 24h</span>
              </div>
            </div>

            {/* Info sobre como funciona */}
            {permission !== 'granted' && (
              <div style={styles.infoBox}>
                <span style={{ fontSize: '1.2rem' }}>💡</span>
                <div>
                  <strong>Como funciona?</strong>
                  <p style={styles.infoText}>
                    Receba alertas reais no celular e computador quando tarefas estiverem prestes a vencer —
                    mesmo com o app em segundo plano.
                  </p>
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div style={styles.actions}>
              {permission !== 'granted' ? (
                <button style={styles.btnPrimary} onClick={handleEnable}>
                  🔔 Ativar notificações
                </button>
              ) : (
                <>
                  <button
                    style={{ ...styles.btnSecondary, opacity: testing ? 0.6 : 1 }}
                    onClick={handleTest}
                    disabled={testing}
                  >
                    {testing ? '...' : '🧪 Testar'}
                  </button>
                  <button style={{ ...styles.btnSecondary, color: '#EF476F', borderColor: '#EF476F' }} onClick={handleClear}>
                    🗑️ Cancelar todas
                  </button>
                </>
              )}
            </div>

            {/* Tarefas atrasadas */}
            {overdue.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>🚨 Atrasadas</div>
                {overdue.slice(0, 3).map((t) => (
                  <div key={t._id} style={styles.taskRow}>
                    <span style={styles.taskDot('#EF476F')} />
                    <span style={styles.taskTitle}>{t.title}</span>
                  </div>
                ))}
                {overdue.length > 3 && (
                  <div style={styles.moreLabel}>+{overdue.length - 3} mais</div>
                )}
              </div>
            )}

            {/* Próximas nas 24h */}
            {upcoming.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>⏳ Próximas 24h</div>
                {upcoming.slice(0, 3).map((t) => {
                  const diff = new Date(t.dueDate!).getTime() - Date.now();
                  const h = Math.floor(diff / 3600000);
                  const m = Math.floor((diff % 3600000) / 60000);
                  const label = h > 0 ? `${h}h ${m}m` : `${m}min`;
                  return (
                    <div key={t._id} style={styles.taskRow}>
                      <span style={styles.taskDot('#FFD166')} />
                      <span style={styles.taskTitle}>{t.title}</span>
                      <span style={styles.taskTime}>{label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Permissão negada: instrução */}
            {permission === 'denied' && (
              <div style={styles.deniedBox}>
                <strong>Como desbloquear:</strong>
                <ol style={styles.deniedList}>
                  <li>Clique no 🔒 na barra de endereço</li>
                  <li>Permissões do site → Notificações</li>
                  <li>Altere para <em>Permitir</em></li>
                  <li>Recarregue a página</li>
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// ── Estilos inline ─────────────────────────────────────
const styles: Record<string, any> = {
  toast: {
    position: 'fixed',
    bottom: '1.5rem',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#1a1a1a',
    color: '#FFD55A',
    padding: '10px 22px',
    borderRadius: '999px',
    fontFamily: '"Itim", cursive',
    fontSize: '0.9rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    zIndex: 9999,
    animation: 'popIn 0.2s cubic-bezier(.34,1.56,.64,1)',
    whiteSpace: 'nowrap',
  },
  panel: {
    width: '100%',
    background: '#FFFDF7',
    border: '2.5px solid #1a1a1a',
    borderRadius: '12px',
    boxShadow: '2px 2px 0 #1a1a1a',
    overflow: 'hidden',
    fontFamily: '"Itim", cursive',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    cursor: 'pointer',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  bellIcon: {
    fontSize: '1.4rem',
  },
  headerTitle: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: '#1a1a1a',
    lineHeight: 1.2,
  },
  statusBadge: {
    display: 'inline-block',
    fontSize: '0.65rem',
    fontWeight: 'bold',
    padding: '1px 8px',
    borderRadius: '999px',
    marginTop: '2px',
  },
  body: {
    padding: '0 12px 14px',
    borderTop: '1.5px solid #f0f0f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    paddingTop: '10px',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
  },
  statCard: {
    background: 'white',
    border: '2px solid #1a1a1a',
    borderTop: '3px solid #6BCB77',
    borderRadius: '8px',
    padding: '8px 6px',
    textAlign: 'center',
    boxShadow: '2px 2px 0 #1a1a1a',
  },
  statNum: {
    display: 'block',
    fontFamily: '"Gochi Hand", cursive',
    fontSize: '1.5rem',
    color: '#1a1a1a',
    lineHeight: 1,
  },
  statLabel: {
    display: 'block',
    fontSize: '0.6rem',
    color: '#888',
    marginTop: '2px',
  },
  infoBox: {
    display: 'flex',
    gap: '10px',
    background: '#f0f4ff',
    border: '1.5px solid #c7d2fe',
    borderRadius: '8px',
    padding: '10px 12px',
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: '0.78rem',
    color: '#4f46e5',
    margin: '3px 0 0',
    lineHeight: 1.4,
  },
  actions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    flex: 1,
    padding: '9px 14px',
    background: '#1a1a1a',
    color: '#FFD55A',
    border: '2.5px solid #1a1a1a',
    borderRadius: '9px',
    fontFamily: '"Itim", cursive',
    fontSize: '0.82rem',
    cursor: 'pointer',
    boxShadow: '2px 2px 0 #FFD55A, 2px 2px 0 2px #1a1a1a',
    transition: 'all 0.15s',
  },
  btnSecondary: {
    flex: 1,
    padding: '8px 12px',
    background: 'white',
    color: '#1a1a1a',
    border: '2.5px solid #1a1a1a',
    borderRadius: '9px',
    fontFamily: '"Itim", cursive',
    fontSize: '0.8rem',
    cursor: 'pointer',
    boxShadow: '2px 2px 0 #1a1a1a',
    transition: 'all 0.15s',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  sectionTitle: {
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: '#555',
    marginBottom: '4px',
  },
  taskRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 6px',
    background: 'white',
    borderRadius: '6px',
    border: '1px solid #f0f0f0',
  },
  taskDot: (color: string) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
  }),
  taskTitle: {
    flex: 1,
    fontSize: '0.78rem',
    color: '#333',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  taskTime: {
    fontSize: '0.7rem',
    color: '#888',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  moreLabel: {
    fontSize: '0.72rem',
    color: '#aaa',
    textAlign: 'center' as const,
    paddingTop: '2px',
  },
  deniedBox: {
    background: '#fff1f5',
    border: '1.5px solid #EF476F',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '0.78rem',
    color: '#c0334d',
  },
  deniedList: {
    paddingLeft: '16px',
    margin: '6px 0 0',
    lineHeight: 1.8,
  },
};
