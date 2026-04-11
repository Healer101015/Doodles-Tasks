import React, { useState, useEffect, useCallback } from 'react';
import Peep from 'react-peeps';
import { useProvider } from '../utils/contextProvider';
import { useAuth } from '../utils/authContext';
import { adjustPeepsViewbox } from '../utils/viewbox';
import { taskService, TaskAPI } from '../utils/taskService';

type Priority = 'low' | 'medium' | 'high';
type Filter = 'all' | 'active' | 'done';

const priorityConfig = {
    low: { label: 'Baixa', color: '#6BCB77', bg: '#f0fdf4' },
    medium: { label: 'Média', color: '#FFD166', bg: '#fffbeb' },
    high: { label: 'Alta', color: '#EF476F', bg: '#fff1f5' },
};

export const TaskBoard: React.FC = () => {
    const { state, dispatch } = useProvider();
    const { user, logout } = useAuth();
    const {
        pickedAccessory, pickedBody, pickedFace, pickedFacialHair,
        pickedHair, strokeColor, isFrameTransparent, backgroundBasicColor,
    } = state;

    const [tasks, setTasks] = useState<TaskAPI[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>('all');
    const [showModal, setShowModal] = useState(false);
    const [editTask, setEditTask] = useState<TaskAPI | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formPriority, setFormPriority] = useState<Priority>('medium');
    const [formDue, setFormDue] = useState('');

    const loadTasks = useCallback(async () => {
        try {
            setLoading(true);
            const data = await taskService.getAll();
            setTasks(data);
            setError(null);
        } catch {
            setError('Não foi possível conectar ao servidor.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadTasks(); }, [loadTasks]);

    const openCreateModal = () => {
        setEditTask(null);
        setFormTitle(''); setFormDesc(''); setFormPriority('medium'); setFormDue('');
        setShowModal(true);
    };

    const openEditModal = (task: TaskAPI) => {
        setEditTask(task);
        setFormTitle(task.title); setFormDesc(task.description);
        setFormPriority(task.priority);
        setFormDue(task.dueDate ? task.dueDate.split('T')[0] : '');
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!formTitle.trim()) return;
        try {
            if (editTask) {
                const updated = await taskService.update(editTask._id, {
                    title: formTitle, description: formDesc, priority: formPriority,
                    dueDate: formDue || null,
                });
                setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
            } else {
                const created = await taskService.create({
                    title: formTitle, description: formDesc, priority: formPriority,
                    dueDate: formDue || null,
                });
                setTasks(prev => [created, ...prev]);
            }
            setShowModal(false);
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

    const filtered = tasks.filter(t => {
        if (filter === 'active') return !t.completed;
        if (filter === 'done') return t.completed;
        return true;
    });

    const doneCount = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    const isOverdue = (due: string | null) => due ? new Date(due) < new Date() : false;

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

                {/* User info */}
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
                    {(['all', 'active', 'done'] as Filter[]).map(f => (
                        <button key={f} className={`tb-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                            {f === 'all' ? 'Todas' : f === 'active' ? 'Pendentes' : 'Concluídas'}
                            <span className="tb-filter-count">
                                {f === 'all' ? total : f === 'active' ? total - doneCount : doneCount}
                            </span>
                        </button>
                    ))}
                </div>

                <button className="tb-back-btn" onClick={() => dispatch({ type: 'SET_CHARACTER_CREATED', payload: false })}>
                    ✏️ Editar Avatar
                </button>
                <button className="tb-logout-btn" onClick={logout}>
                    Sair da conta
                </button>
            </aside>

            <main className="tb-main">
                <header className="tb-header">
                    <div>
                        <h1 className="tb-title">Minhas Tarefas</h1>
                        <p className="tb-subtitle">Organize seu dia com estilo ✨</p>
                    </div>
                    <button className="tb-add-btn" onClick={openCreateModal}>+ Nova Tarefa</button>
                </header>

                {error && (
                    <div className="tb-error">
                        ⚠️ {error}
                        <button onClick={() => setError(null)}>✕</button>
                    </div>
                )}

                {loading ? (
                    <div className="tb-loading">
                        <div className="tb-spinner" />
                        <span>Carregando tarefas...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="tb-empty">
                        <div className="tb-empty-icon">📋</div>
                        <p>{filter === 'done' ? 'Nenhuma tarefa concluída ainda.' : 'Nenhuma tarefa aqui. Que tal criar uma?'}</p>
                        {filter !== 'done' && <button className="tb-add-btn small" onClick={openCreateModal}>Criar primeira tarefa</button>}
                    </div>
                ) : (
                    <div className="tb-task-list">
                        {filtered.map(task => {
                            const p = priorityConfig[task.priority];
                            const overdue = isOverdue(task.dueDate) && !task.completed;
                            return (
                                <div
                                    key={task._id}
                                    className={`tb-task-card ${task.completed ? 'done' : ''} ${overdue ? 'overdue' : ''}`}
                                    style={{ '--p-color': p.color, '--p-bg': p.bg } as React.CSSProperties}
                                >
                                    <button className={`tb-check ${task.completed ? 'checked' : ''}`} onClick={() => handleToggle(task._id)}>
                                        {task.completed && '✓'}
                                    </button>
                                    <div className="tb-task-body">
                                        <div className="tb-task-top">
                                            <span className="tb-task-title">{task.title}</span>
                                            <span className="tb-priority-tag" style={{ background: p.bg, color: p.color }}>{p.label}</span>
                                        </div>
                                        {task.description && <p className="tb-task-desc">{task.description}</p>}
                                        <div className="tb-task-meta">
                                            {task.dueDate && (
                                                <span className={`tb-due ${overdue ? 'overdue' : ''}`}>
                                                    📅 {new Date(task.dueDate).toLocaleDateString('pt-BR')}{overdue && ' · Atrasada'}
                                                </span>
                                            )}
                                            <span className="tb-created">{new Date(task.createdAt).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                    <div className="tb-task-actions">
                                        <button className="tb-icon-btn" onClick={() => openEditModal(task)}>✏️</button>
                                        <button className="tb-icon-btn" onClick={() => handleDelete(task._id)}>🗑️</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {showModal && (
                <div className="tb-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="tb-modal" onClick={e => e.stopPropagation()}>
                        <div className="tb-modal-header">
                            <h2>{editTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
                            <button className="tb-modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="tb-modal-body">
                            <label className="tb-label">
                                Título *
                                <input className="tb-input" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="O que precisa ser feito?" autoFocus />
                            </label>
                            <label className="tb-label">
                                Descrição
                                <textarea className="tb-input" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Detalhes opcionais..." rows={3} />
                            </label>
                            <div className="tb-form-row">
                                <label className="tb-label">
                                    Prioridade
                                    <div className="tb-priority-picker">
                                        {(['low', 'medium', 'high'] as Priority[]).map(p => (
                                            <button
                                                key={p}
                                                className={`tb-prio-opt ${formPriority === p ? 'selected' : ''}`}
                                                style={{ '--p-color': priorityConfig[p].color, '--p-bg': priorityConfig[p].bg } as React.CSSProperties}
                                                onClick={() => setFormPriority(p)}
                                                type="button"
                                            >
                                                {priorityConfig[p].label}
                                            </button>
                                        ))}
                                    </div>
                                </label>
                                <label className="tb-label">
                                    Data limite
                                    <input className="tb-input" type="date" value={formDue} onChange={e => setFormDue(e.target.value)} />
                                </label>
                            </div>
                        </div>
                        <div className="tb-modal-footer">
                            <button className="tb-btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="tb-btn-save" onClick={handleSubmit} disabled={!formTitle.trim()}>
                                {editTask ? 'Salvar alterações' : 'Criar tarefa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};