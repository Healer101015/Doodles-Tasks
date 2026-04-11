const API_BASE = 'http://localhost:5000/api';

export interface TaskAPI {
    _id: string;
    title: string;
    description: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    dueDate: string | null;
    createdAt: string;
}

const getToken = () => localStorage.getItem('peeps_token') || '';

const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
});

export const taskService = {
    async getAll(): Promise<TaskAPI[]> {
        const res = await fetch(`${API_BASE}/tasks`, { headers: headers() });
        if (!res.ok) throw new Error('Erro ao buscar tarefas');
        return res.json();
    },

    async create(data: {
        title: string;
        description?: string;
        priority?: 'low' | 'medium' | 'high';
        dueDate?: string | null;
    }): Promise<TaskAPI> {
        const res = await fetch(`${API_BASE}/tasks`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Erro ao criar tarefa');
        return res.json();
    },

    async toggle(id: string): Promise<TaskAPI> {
        const res = await fetch(`${API_BASE}/tasks/${id}/toggle`, {
            method: 'PATCH',
            headers: headers(),
        });
        if (!res.ok) throw new Error('Erro ao atualizar tarefa');
        return res.json();
    },

    async update(id: string, data: Partial<TaskAPI>): Promise<TaskAPI> {
        const res = await fetch(`${API_BASE}/tasks/${id}`, {
            method: 'PUT',
            headers: headers(),
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Erro ao atualizar tarefa');
        return res.json();
    },

    async remove(id: string): Promise<void> {
        const res = await fetch(`${API_BASE}/tasks/${id}`, {
            method: 'DELETE',
            headers: headers(),
        });
        if (!res.ok) throw new Error('Erro ao deletar tarefa');
    },
};