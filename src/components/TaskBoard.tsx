import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Peep from 'react-peeps';
import { useProvider } from '../utils/contextProvider';
import { useAuth } from '../utils/authContext';
import { adjustPeepsViewbox } from '../utils/viewbox';
import { taskService, TaskAPI, TaskStats, RecurrenceConfig, Subtask, CreateTaskInput } from '../utils/taskService';

type Priority = 'low' | 'medium' | 'high';
type Filter = 'all' | 'active' | 'done' | 'recurring' | 'overdue' | 'pinned' | 'archived';
type ActiveTab = 'tasks' | 'stats';

const priorityConfig = {
    low: { label: 'Baixa', color: '#6BCB77', bg: '#f0fdf4' },
    medium: { label: 'Média', color: '#FFD166', bg: '#fffbeb' },
    high: { label: 'Alta', color: '#EF476F', bg: '#fff1f5' },
};

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const generateId = () => Math.random().toString(36).slice(2, 10);

// ─── Task Modal ────────────────────────────────────────────────────────────────
interface TaskModalProps {
    editTask: TaskAPI | null;
    onClose: () => void;
    onSave: (task: TaskAPI) => void;
    onCreate: (input: CreateTaskInput) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ editTask, onClose, onSave, onCreate }) => {
    const [title, setTitle] = useState(editTask?.title || '');
    const [desc, setDesc] = useState(editTask?.description || '');
    const [priority, setPriority] = useState<Priority>(editTask?.priority || 'medium');
    const [dueDate, setDueDate] = useState(editTask?.dueDate ? editTask.dueDate.split('T')[0] : '');
    const [dueTime, setDueTime] = useState(editTask?.recurrence?.timeOfDay || '');
    const [tags, setTags] = useState<string[]>(editTask?.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [notes, setNotes] = useState(editTask?.notes || '');
    const [estimatedMinutes, setEstimatedMinutes] = useState<string>(
        editTask?.estimatedMinutes ? String(editTask.estimatedMinutes) : ''
    );
    const [subtasks, setSubtasks] = useState<Subtask[]>(editTask?.subtasks || []);
    const [subtaskInput, setSubtaskInput] = useState('');
    const [pinned, setPinned] = useState(editTask?.pinned || false);
    const [isRecurring, setIsRecurring] = useState(editTask?.isRecurring || false);
    const [recurrFreq, setRecurrFreq] = useState<RecurrenceConfig['frequency']>(
        editTask?.recurrence?.frequency || 'daily'
    );
    const [recurrDays, setRecurrDays] = useState<number[]>(editTask?.recurrence?.daysOfWeek || []);
    const [recurrEnd, setRecurrEnd] = useState(editTask?.recurrence?.endDate?.split?.('T')?.[0] || '');
    const [activeFormTab, setActiveFormTab] = useState<'basic' | 'recurring' | 'subtasks' | 'notes'>('basic');
    const [saving, setSaving] = useState(false);

    const toggleRecurrDay = (day: number) => {
        setRecurrDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    };

    const addTag = () => {
        const t = tagInput.trim().toLowerCase();
        if (t && !tags.includes(t)) {
            setTags(prev => [...prev, t]);
        }
        setTagInput('');
    };

    const addSubtask = () => {
        const t = subtaskInput.trim();
        if (t) {
            setSubtasks(prev => [...prev, { id: generateId(), title: t, completed: false }]);
            setSubtaskInput('');
        }
    };

    const handleSubmit = async () => {
        if (!title.trim()) return;
        setSaving(true);

        const payload: CreateTaskInput = {
            title,
            description: desc,
            priority,
            dueDate: dueDate || null,
            tags,
            subtasks: subtasks.map(s => ({ id: s.id, title: s.title, completed: s.completed })),
            notes,
            estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : null,
            pinned,
            isRecurring,
        };

        if (isRecurring) {
            payload.recurrence = {
                frequency: recurrFreq,
                daysOfWeek: recurrFreq === 'weekly' ? recurrDays : undefined,
                timeOfDay: dueTime || null,
                endDate: recurrEnd || null,
            };
        }

        try {
            if (editTask) {
                onSave({ ...editTask, ...payload } as TaskAPI);
            } else {
                onCreate(payload);
            }
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="tb-modal-overlay" onClick={onClose}>
            <div className="tb-modal tb-modal-wide" onClick={e => e.stopPropagation()}>
                <div className="tb-modal-header">
                    <h2>{editTask ? '✏️ Editar Tarefa' : '✨ Nova Tarefa'}</h2>
                    <button className="tb-modal-close" onClick={onClose}>✕</button>
                </div>

                {/* Form tabs */}
                <div className="tb-form-tabs">
                    {(['basic', 'recurring', 'subtasks', 'notes'] as const).map(tab => (
                        <button
                            key={tab}
                            className={`tb-form-tab ${activeFormTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveFormTab(tab)}
                            type="button"
                        >
                            {tab === 'basic' && ' Básico'}
                            {tab === 'recurring' && ' Recorrência'}
                            {tab === 'subtasks' && ` Subtarefas${subtasks.length > 0 ? ` (${subtasks.length})` : ''}`}
                            {tab === 'notes' && ' Notas'}
                        </button>
                    ))}
                </div>

                <div className="tb-modal-body">
                    {/* Basic tab */}
                    {activeFormTab === 'basic' && (
                        <>
                            <label className="tb-label">
                                Título *
                                <input
                                    className="tb-input"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="O que precisa ser feito?"
                                    autoFocus
                                />
                            </label>

                            <label className="tb-label">
                                Descrição
                                <textarea className="tb-input" value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Detalhes opcionais..." />
                            </label>

                            <div className="tb-form-row">
                                <label className="tb-label">
                                    Prioridade
                                    <div className="tb-priority-picker">
                                        {(['low', 'medium', 'high'] as Priority[]).map(p => (
                                            <button
                                                key={p}
                                                className={`tb-prio-opt ${priority === p ? 'selected' : ''}`}
                                                style={{ '--p-color': priorityConfig[p].color, '--p-bg': priorityConfig[p].bg } as React.CSSProperties}
                                                onClick={() => setPriority(p)}
                                                type="button"
                                            >
                                                {priorityConfig[p].label}
                                            </button>
                                        ))}
                                    </div>
                                </label>

                                <label className="tb-label">
                                    Data / Hora limite
                                    <input className="tb-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                                    <input className="tb-input" type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} style={{ marginTop: 4 }} />
                                </label>
                            </div>

                            <div className="tb-form-row">
                                <label className="tb-label">
                                    Tempo estimado (min)
                                    <input className="tb-input" type="number" min="0" value={estimatedMinutes} onChange={e => setEstimatedMinutes(e.target.value)} placeholder="ex: 30" />
                                </label>
                                <label className="tb-label" style={{ justifyContent: 'center' }}>
                                    Fixar no topo
                                    <button
                                        type="button"
                                        className={`tb-pin-toggle ${pinned ? 'active' : ''}`}
                                        onClick={() => setPinned(p => !p)}
                                    >
                                        {pinned ? '📌 Fixada' : '📌 Fixar'}
                                    </button>
                                </label>
                            </div>

                            {/* Tags */}
                            <label className="tb-label">
                                Tags
                                <div className="tb-tag-input-row">
                                    <input
                                        className="tb-input"
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        placeholder="Adicionar tag..."
                                    />
                                    <button type="button" className="tb-tag-add-btn" onClick={addTag}>+</button>
                                </div>
                                {tags.length > 0 && (
                                    <div className="tb-tags-row">
                                        {tags.map(tag => (
                                            <span key={tag} className="tb-tag">
                                                #{tag}
                                                <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </label>
                        </>
                    )}

                    {/* Recurring tab */}
                    {activeFormTab === 'recurring' && (
                        <div className="tb-recurring-section">
                            <label className="tb-label">
                                <div className="tb-toggle-row">
                                    <span>Tarefa recorrente</span>
                                    <button
                                        type="button"
                                        className={`tb-toggle-btn ${isRecurring ? 'on' : ''}`}
                                        onClick={() => setIsRecurring(r => !r)}
                                    >
                                        {isRecurring ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                            </label>

                            {isRecurring && (
                                <>
                                    <label className="tb-label">
                                        Frequência
                                        <select className="tb-input" value={recurrFreq} onChange={e => setRecurrFreq(e.target.value as any)}>
                                            <option value="daily">Diária</option>
                                            <option value="weekly">Semanal</option>
                                            <option value="monthly">Mensal</option>
                                        </select>
                                    </label>

                                    {recurrFreq === 'weekly' && (
                                        <label className="tb-label">
                                            Dias da semana
                                            <div className="tb-days-picker">
                                                {DAY_LABELS.map((day, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        className={`tb-day-btn ${recurrDays.includes(i) ? 'selected' : ''}`}
                                                        onClick={() => toggleRecurrDay(i)}
                                                    >
                                                        {day}
                                                    </button>
                                                ))}
                                            </div>
                                        </label>
                                    )}

                                    <div className="tb-form-row">
                                        <label className="tb-label">
                                            Horário diário
                                            <input className="tb-input" type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} />
                                        </label>
                                        <label className="tb-label">
                                            Repetir até
                                            <input className="tb-input" type="date" value={recurrEnd} onChange={e => setRecurrEnd(e.target.value)} />
                                        </label>
                                    </div>

                                    <div className="tb-recurring-preview">
                                        <span>🔄 Esta tarefa se repetirá {recurrFreq === 'daily' ? 'todo dia' : recurrFreq === 'weekly' ? 'toda semana' : 'todo mês'}</span>
                                        {recurrFreq === 'weekly' && recurrDays.length > 0 && (
                                            <span> nos dias: {recurrDays.map(d => DAY_LABELS[d]).join(', ')}</span>
                                        )}
                                        {dueTime && <span> às {dueTime}</span>}
                                    </div>
                                </>
                            )}

                            {!isRecurring && (
                                <div className="tb-recurring-hint">
                                    <span>🔄</span>
                                    <p>Ative para criar tarefas que se repetem automaticamente — ex: buscar criança na escola todo dia às 13h.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Subtasks tab */}
                    {activeFormTab === 'subtasks' && (
                        <div className="tb-subtasks-section">
                            <label className="tb-label">
                                Adicionar subtarefa
                                <div className="tb-tag-input-row">
                                    <input
                                        className="tb-input"
                                        value={subtaskInput}
                                        onChange={e => setSubtaskInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                                        placeholder="Ex: Preparar material..."
                                    />
                                    <button type="button" className="tb-tag-add-btn" onClick={addSubtask}>+</button>
                                </div>
                            </label>

                            {subtasks.length > 0 ? (
                                <div className="tb-subtask-list-edit">
                                    {subtasks.map((s, i) => (
                                        <div key={s.id} className="tb-subtask-edit-item">
                                            <span className="tb-subtask-num">{i + 1}.</span>
                                            <span className="tb-subtask-edit-title">{s.title}</span>
                                            <button
                                                type="button"
                                                className="tb-icon-btn"
                                                onClick={() => setSubtasks(prev => prev.filter(x => x.id !== s.id))}
                                            >🗑️</button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="tb-recurring-hint">
                                    <span>✅</span>
                                    <p>Divida a tarefa em etapas menores para acompanhar o progresso.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notes tab */}
                    {activeFormTab === 'notes' && (
                        <label className="tb-label">
                            Notas pessoais
                            <textarea
                                className="tb-input"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={7}
                                placeholder="Anotações, links, observações..."
                            />
                        </label>
                    )}
                </div>

                <div className="tb-modal-footer">
                    <button className="tb-btn-cancel" onClick={onClose}>Cancelar</button>
                    <button className="tb-btn-save" onClick={handleSubmit} disabled={!title.trim() || saving}>
                        {saving ? '...' : editTask ? 'Salvar alterações' : 'Criar tarefa'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Stats Panel ───────────────────────────────────────────────────────────────
const StatsPanel: React.FC<{ stats: TaskStats | null; loading: boolean }> = ({ stats, loading }) => {
    if (loading) return <div className="tb-loading"><div className="tb-spinner" /><span>Carregando estatísticas...</span></div>;
    if (!stats) return null;

    const formatTime = (mins: number) => {
        if (mins < 60) return `${mins}min`;
        return `${Math.floor(mins / 60)}h ${mins % 60}min`;
    };

    return (
        <div className="tb-stats-panel">
            <h2 className="tb-stats-title"> Estatísticas</h2>

            <div className="tb-stats-grid">
                <div className="tb-stat-card tb-stat-blue">
                    <div className="tb-stat-num">{stats.total}</div>
                    <div className="tb-stat-label">Total de tarefas</div>
                </div>
                <div className="tb-stat-card tb-stat-green">
                    <div className="tb-stat-num">{stats.completed}</div>
                    <div className="tb-stat-label">Concluídas</div>
                </div>
                <div className="tb-stat-card tb-stat-yellow">
                    <div className="tb-stat-num">{stats.pending}</div>
                    <div className="tb-stat-label">Pendentes</div>
                </div>
                <div className="tb-stat-card tb-stat-red">
                    <div className="tb-stat-num">{stats.overdue}</div>
                    <div className="tb-stat-label">Atrasadas</div>
                </div>
                <div className="tb-stat-card tb-stat-purple">
                    <div className="tb-stat-num">{stats.recurring}</div>
                    <div className="tb-stat-label">Recorrentes</div>
                </div>
                <div className="tb-stat-card tb-stat-orange">
                    <div className="tb-stat-num">{formatTime(stats.totalLoggedMinutes)}</div>
                    <div className="tb-stat-label">Tempo registrado</div>
                </div>
            </div>

            {/* Completion rate */}
            <div className="tb-stats-completion">
                <div className="tb-stats-completion-header">
                    <span>Taxa de conclusão</span>
                    <strong>{stats.completionRate}%</strong>
                </div>
                <div className="tb-progress-bar" style={{ height: 14 }}>
                    <div className="tb-progress-fill" style={{ width: `${stats.completionRate}%` }} />
                </div>
            </div>

            {/* By priority */}
            <div className="tb-stats-section">
                <h3 className="tb-stats-section-title">Por prioridade</h3>
                <div className="tb-prio-bars">
                    {Object.entries(priorityConfig).map(([key, cfg]) => (
                        <div key={key} className="tb-prio-bar-row">
                            <span className="tb-prio-bar-label" style={{ color: cfg.color }}>{cfg.label}</span>
                            <div className="tb-prio-bar-bg">
                                <div
                                    className="tb-prio-bar-fill"
                                    style={{
                                        width: stats.total > 0 ? `${(stats.byPriority[key as Priority] / stats.total) * 100}%` : '0%',
                                        background: cfg.color
                                    }}
                                />
                            </div>
                            <span className="tb-prio-bar-count">{stats.byPriority[key as Priority]}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top tags */}
            {stats.topTags.length > 0 && (
                <div className="tb-stats-section">
                    <h3 className="tb-stats-section-title">Tags mais usadas</h3>
                    <div className="tb-tags-row" style={{ flexWrap: 'wrap' }}>
                        {stats.topTags.map(({ tag, count }) => (
                            <span key={tag} className="tb-tag">
                                #{tag} <strong>({count})</strong>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Main TaskBoard ───────────────────────────────────────────────────────────
export const TaskBoard: React.FC = () => {
    const { state, dispatch } = useProvider();
    const { user, logout } = useAuth();
    const { pickedAccessory, pickedBody, pickedFace, pickedFacialHair, pickedHair, strokeColor, isFrameTransparent, backgroundBasicColor } = state;

    const [tasks, setTasks] = useState<TaskAPI[]>([]);
    const [stats, setStats] = useState<TaskStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(false);
    const [filter, setFilter] = useState<Filter>('all');
    const [activeTab, setActiveTab] = useState<ActiveTab>('tasks');
    const [showModal, setShowModal] = useState(false);
    const [editTask, setEditTask] = useState<TaskAPI | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedTask, setExpandedTask] = useState<string | null>(null);
    const [logTimeTaskId, setLogTimeTaskId] = useState<string | null>(null);
    const [logMinutes, setLogMinutes] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const loadTasks = useCallback(async () => {
        try {
            setLoading(true);
            const data = await taskService.getAll({ archived: filter === 'archived' });
            setTasks(data);
            setError(null);
        } catch {
            setError('Não foi possível conectar ao servidor.');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    const loadStats = useCallback(async () => {
        try {
            setStatsLoading(true);
            const data = await taskService.getStats();
            setStats(data);
        } catch {
            // ignore
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => { loadTasks(); }, [loadTasks]);
    useEffect(() => { if (activeTab === 'stats') loadStats(); }, [activeTab, loadStats]);

    const handleCreate = async (input: CreateTaskInput) => {
        try {
            const created = await taskService.create(input);
            setTasks(prev => [created, ...prev]);
        } catch {
            setError('Erro ao criar tarefa.');
        }
    };

    const handleSaveEdit = async (updated: TaskAPI) => {
        try {
            const saved = await taskService.update(updated._id, updated);
            setTasks(prev => prev.map(t => t._id === saved._id ? saved : t));
        } catch {
            setError('Erro ao salvar tarefa.');
        }
    };

    const handleToggle = async (id: string) => {
        try {
            const updated = await taskService.toggle(id);
            setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
        } catch { setError('Erro ao atualizar tarefa.'); }
    };

    const handleDelete = async (id: string) => {
        try {
            await taskService.remove(id);
            setTasks(prev => prev.filter(t => t._id !== id));
        } catch { setError('Erro ao deletar tarefa.'); }
    };

    const handlePin = async (id: string) => {
        try {
            const updated = await taskService.pin(id);
            setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
        } catch { setError('Erro ao fixar tarefa.'); }
    };

    const handleArchive = async (id: string) => {
        try {
            const updated = await taskService.archive(id);
            setTasks(prev => prev.filter(t => t._id !== updated._id));
        } catch { setError('Erro ao arquivar tarefa.'); }
    };

    const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
        try {
            const updated = await taskService.toggleSubtask(taskId, subtaskId);
            setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
        } catch { setError('Erro ao atualizar subtarefa.'); }
    };

    const handleLogTime = async (id: string) => {
        const mins = Number(logMinutes);
        if (!mins || mins <= 0) return;
        try {
            const updated = await taskService.logTime(id, mins);
            setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
            setLogTimeTaskId(null);
            setLogMinutes('');
        } catch { setError('Erro ao registrar tempo.'); }
    };

    const isOverdue = (due: string | null) => due ? new Date(due) < new Date() : false;

    const filtered = useMemo(() => {
        let list = tasks;

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(t =>
                t.title.toLowerCase().includes(q) ||
                t.description?.toLowerCase().includes(q) ||
                t.tags?.some(tag => tag.includes(q))
            );
        }

        switch (filter) {
            case 'active': return list.filter(t => !t.completed);
            case 'done': return list.filter(t => t.completed);
            case 'recurring': return list.filter(t => t.isRecurring);
            case 'overdue': return list.filter(t => isOverdue(t.dueDate) && !t.completed);
            case 'pinned': return list.filter(t => t.pinned);
            case 'archived': return list;
            default: return list;
        }
    }, [tasks, filter, searchQuery]);

    const doneCount = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    const overdueCount = tasks.filter(t => isOverdue(t.dueDate) && !t.completed).length;

    const filterConfig: { key: Filter; label: string; count: number }[] = [
        { key: 'all', label: 'Todas', count: total },
        { key: 'active', label: 'Pendentes', count: total - doneCount },
        { key: 'done', label: 'Feitas', count: doneCount },
        { key: 'recurring', label: ' Recorrentes', count: tasks.filter(t => t.isRecurring).length },
        { key: 'overdue', label: ' Atrasadas', count: overdueCount },
        { key: 'pinned', label: ' Fixadas', count: tasks.filter(t => t.pinned).length },
        { key: 'archived', label: ' Arquivadas', count: 0 },
    ];

    return (
        <div className="tb-root">
            <aside className="tb-sidebar">
                <div className="tb-avatar-wrap">
                    <Peep
                        style={{ width: 160, height: 160 }}
                        accessory={pickedAccessory}
                        body={pickedBody}
                        face={pickedFace}
                        hair={pickedHair}
                        facialHair={pickedFacialHair}
                        strokeColor={strokeColor}
                        viewBox={adjustPeepsViewbox(pickedBody)}
                        wrapperBackground={isFrameTransparent ? undefined : (backgroundBasicColor as string)}
                    />
                </div>

                <div className="tb-user-info">
                    <span className="tb-user-name">👋 {user?.name}</span>
                    <span className="tb-user-email">{user?.email}</span>
                </div>

                <div className="tb-progress-card">
                    <div className="tb-progress-label">
                        <span>Progresso</span>
                        <strong>{progress}%</strong>
                    </div>
                    <div className="tb-progress-bar">
                        <div className="tb-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="tb-progress-sub">{doneCount} de {total} tarefas</div>
                </div>

                <div className="tb-stats">
                    {filterConfig.map(f => (
                        <button
                            key={f.key}
                            className={`tb-filter-btn ${filter === f.key ? 'active' : ''}`}
                            onClick={() => { setFilter(f.key); setActiveTab('tasks'); }}
                        >
                            {f.label}
                            <span className="tb-filter-count">{f.count}</span>
                        </button>
                    ))}
                </div>

                <button
                    className={`tb-filter-btn ${activeTab === 'stats' ? 'active' : ''}`}
                    style={{ width: '100%' }}
                    onClick={() => setActiveTab('stats')}
                >
                    Estatísticas
                </button>

                <button className="tb-back-btn" onClick={() => dispatch({ type: 'SET_CHARACTER_CREATED', payload: false })}>
                    ✏️ Editar Avatar
                </button>
                <button className="tb-logout-btn" onClick={logout}>
                    Sair da conta
                </button>
            </aside>

            <main className="tb-main">
                {activeTab === 'stats' ? (
                    <StatsPanel stats={stats} loading={statsLoading} />
                ) : (
                    <>
                        <header className="tb-header">
                            <div>
                                <h1 className="tb-title">
                                    {filter === 'all' ? 'Minhas Tarefas' :
                                        filter === 'active' ? 'Pendentes' :
                                            filter === 'done' ? 'Concluídas' :
                                                filter === 'recurring' ? ' Recorrentes' :
                                                    filter === 'overdue' ? ' Atrasadas' :
                                                        filter === 'pinned' ? ' Fixadas' : ' Arquivadas'}
                                </h1>
                                <p className="tb-subtitle">Organize seu dia com estilo ✨</p>
                            </div>
                            <button className="tb-add-btn" onClick={() => { setEditTask(null); setShowModal(true); }}>+ Nova</button>
                        </header>

                        {/* Search */}
                        <div className="tb-search-row">
                            <input
                                className="tb-search-input"
                                placeholder="🔍 Buscar tarefas, tags..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="tb-error">
                                ⚠️ {error}
                                <button onClick={() => setError(null)}>✕</button>
                            </div>
                        )}

                        {loading ? (
                            <div className="tb-loading"><div className="tb-spinner" /><span>Carregando...</span></div>
                        ) : filtered.length === 0 ? (
                            <div className="tb-empty">
                                <div className="tb-empty-icon">{filter === 'recurring' ? '🔄' : filter === 'archived' ? '📦' : '📋'}</div>
                                <p>{
                                    filter === 'done' ? 'Nenhuma tarefa concluída.' :
                                        filter === 'recurring' ? 'Nenhuma tarefa recorrente.' :
                                            filter === 'archived' ? 'Nenhuma tarefa arquivada.' :
                                                searchQuery ? 'Nenhuma tarefa encontrada.' :
                                                    'Nenhuma tarefa. Que tal criar uma?'
                                }</p>
                                {filter === 'all' && !searchQuery && (
                                    <button className="tb-add-btn small" onClick={() => setShowModal(true)}>Criar primeira tarefa</button>
                                )}
                            </div>
                        ) : (
                            <div className="tb-task-list">
                                {filtered.map(task => {
                                    const p = priorityConfig[task.priority];
                                    const overdue = isOverdue(task.dueDate) && !task.completed;
                                    const isExpanded = expandedTask === task._id;
                                    const subtasksDone = task.subtasks?.filter(s => s.completed).length || 0;
                                    const subtasksTotal = task.subtasks?.length || 0;

                                    return (
                                        <div
                                            key={task._id}
                                            className={`tb-task-card ${task.completed ? 'done' : ''} ${overdue ? 'overdue' : ''} ${task.pinned ? 'pinned' : ''}`}
                                            style={{ '--p-color': p.color, '--p-bg': p.bg } as React.CSSProperties}
                                        >
                                            <div className="tb-task-main-row">
                                                <button className={`tb-check ${task.completed ? 'checked' : ''}`} onClick={() => handleToggle(task._id)}>
                                                    {task.completed && '✓'}
                                                </button>

                                                <div className="tb-task-body" onClick={() => setExpandedTask(isExpanded ? null : task._id)}>
                                                    <div className="tb-task-top">
                                                        {task.pinned && <span className="tb-pin-badge">📌</span>}
                                                        {task.isRecurring && <span className="tb-recurring-badge">🔄</span>}
                                                        <span className="tb-task-title">{task.title}</span>
                                                        <span className="tb-priority-tag" style={{ background: p.bg, color: p.color }}>{p.label}</span>
                                                    </div>

                                                    {task.tags?.length > 0 && (
                                                        <div className="tb-task-tags">
                                                            {task.tags.map(tag => (
                                                                <span key={tag} className="tb-tag-small">#{tag}</span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="tb-task-meta">
                                                        {task.dueDate && (
                                                            <span className={`tb-due ${overdue ? 'overdue' : ''}`}>
                                                                📅 {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                                                {task.recurrence?.timeOfDay && ` às ${task.recurrence.timeOfDay}`}
                                                                {overdue && ' · Atrasada'}
                                                            </span>
                                                        )}
                                                        {subtasksTotal > 0 && (
                                                            <span className="tb-subtask-progress">
                                                                ✅ {subtasksDone}/{subtasksTotal}
                                                            </span>
                                                        )}
                                                        {task.estimatedMinutes && (
                                                            <span className="tb-time-badge">
                                                                ⏱ {task.loggedMinutes || 0}/{task.estimatedMinutes}min
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="tb-task-actions">
                                                    <button className="tb-icon-btn" title="Editar" onClick={() => { setEditTask(task); setShowModal(true); }}>✏️</button>
                                                    <button className="tb-icon-btn" title={task.pinned ? 'Desafixar' : 'Fixar'} onClick={() => handlePin(task._id)}>📌</button>
                                                    <button className="tb-icon-btn" title="Arquivar" onClick={() => handleArchive(task._id)}>📦</button>
                                                    <button className="tb-icon-btn" title="Deletar" onClick={() => handleDelete(task._id)}>🗑️</button>
                                                </div>
                                            </div>

                                            {/* Expanded section */}
                                            {isExpanded && (
                                                <div className="tb-task-expanded">
                                                    {task.description && (
                                                        <p className="tb-task-desc">{task.description}</p>
                                                    )}

                                                    {/* Subtasks */}
                                                    {task.subtasks?.length > 0 && (
                                                        <div className="tb-subtasks">
                                                            <div className="tb-subtasks-header">
                                                                Subtarefas ({subtasksDone}/{subtasksTotal})
                                                                <div className="tb-subtask-mini-bar">
                                                                    <div style={{ width: subtasksTotal > 0 ? `${(subtasksDone / subtasksTotal) * 100}%` : '0%', background: '#6BCB77', height: '100%', borderRadius: 999, transition: 'width 0.3s' }} />
                                                                </div>
                                                            </div>
                                                            {task.subtasks.map(s => (
                                                                <div key={s.id} className={`tb-subtask-item ${s.completed ? 'done' : ''}`}>
                                                                    <button
                                                                        className={`tb-subtask-check ${s.completed ? 'checked' : ''}`}
                                                                        onClick={() => handleToggleSubtask(task._id, s.id)}
                                                                    >
                                                                        {s.completed && '✓'}
                                                                    </button>
                                                                    <span>{s.title}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Notes */}
                                                    {task.notes && (
                                                        <div className="tb-task-notes">
                                                            <span className="tb-notes-label">📝 Notas:</span>
                                                            <p>{task.notes}</p>
                                                        </div>
                                                    )}

                                                    {/* Recurring info */}
                                                    {task.isRecurring && task.recurrence && (
                                                        <div className="tb-recurring-info">
                                                            <span>🔄 Recorrência: {
                                                                task.recurrence.frequency === 'daily' ? 'Diária' :
                                                                    task.recurrence.frequency === 'weekly' ? `Semanal (${(task.recurrence.daysOfWeek || []).map(d => DAY_LABELS[d]).join(', ')})` :
                                                                        'Mensal'
                                                            }</span>
                                                            {task.recurrence.timeOfDay && <span> · ⏰ {task.recurrence.timeOfDay}</span>}
                                                            {task.recurrence.completionCount !== undefined && task.recurrence.completionCount > 0 && (
                                                                <span> · Concluída {task.recurrence.completionCount}x</span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Log time */}
                                                    <div className="tb-log-time-row">
                                                        {logTimeTaskId === task._id ? (
                                                            <>
                                                                <input
                                                                    className="tb-input tb-log-time-input"
                                                                    type="number"
                                                                    min="1"
                                                                    placeholder="Minutos"
                                                                    value={logMinutes}
                                                                    onChange={e => setLogMinutes(e.target.value)}
                                                                    onKeyDown={e => e.key === 'Enter' && handleLogTime(task._id)}
                                                                    autoFocus
                                                                />
                                                                <button className="tb-btn-save" style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={() => handleLogTime(task._id)}>✓</button>
                                                                <button className="tb-btn-cancel" style={{ padding: '6px 10px', fontSize: '0.85rem' }} onClick={() => setLogTimeTaskId(null)}>✕</button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                className="tb-log-time-btn"
                                                                onClick={() => { setLogTimeTaskId(task._id); setLogMinutes(''); }}
                                                            >
                                                                ⏱ Registrar tempo {task.loggedMinutes > 0 ? `(${task.loggedMinutes}min já registrado)` : ''}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </main>

            {showModal && (
                <TaskModal
                    editTask={editTask}
                    onClose={() => setShowModal(false)}
                    onSave={handleSaveEdit}
                    onCreate={handleCreate}
                />
            )}
        </div>
    );
};