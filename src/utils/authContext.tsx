import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    avatarConfig: Record<string, unknown>;
}

interface AuthContextProps {
    user: AuthUser | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

const API = 'http://localhost:5000/api';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Restaura sessão do localStorage ao iniciar
    useEffect(() => {
        const storedToken = localStorage.getItem('peeps_token');
        const storedUser = localStorage.getItem('peeps_user');
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const persist = (token: string, user: AuthUser) => {
        localStorage.setItem('peeps_token', token);
        localStorage.setItem('peeps_user', JSON.stringify(user));
        setToken(token);
        setUser(user);
    };

    const login = async (email: string, password: string) => {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao fazer login');
        persist(data.token, data.user);
    };

    const register = async (name: string, email: string, password: string) => {
        const res = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao criar conta');
        persist(data.token, data.user);
    };

    const logout = () => {
        localStorage.removeItem('peeps_token');
        localStorage.removeItem('peeps_user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);