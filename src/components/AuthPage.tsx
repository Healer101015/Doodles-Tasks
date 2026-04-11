import React, { useState } from 'react';
import { useAuth } from '../utils/authContext';

type Mode = 'login' | 'register';

export const AuthPage: React.FC = () => {
    const { login, register } = useAuth();
    const [mode, setMode] = useState<Mode>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (mode === 'login') {
                await login(email, password);
            } else {
                await register(name, email, password);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro inesperado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-root">
            {/* Decorative blobs */}
            <div className="auth-blob auth-blob-1" />
            <div className="auth-blob auth-blob-2" />

            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">🎨</div>
                    <h1 className="auth-title">Peeps Tasks</h1>
                    <p className="auth-sub">
                        {mode === 'login'
                            ? 'Entre para ver suas tarefas'
                            : 'Crie sua conta e comece agora'}
                    </p>
                </div>

                {/* Tab switcher */}
                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                        onClick={() => { setMode('login'); setError(''); }}
                    >
                        Entrar
                    </button>
                    <button
                        className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                        onClick={() => { setMode('register'); setError(''); }}
                    >
                        Criar conta
                    </button>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <div className="auth-field">
                            <label className="auth-label">Seu nome</label>
                            <input
                                className="auth-input"
                                type="text"
                                placeholder="Como quer ser chamado?"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                    )}

                    <div className="auth-field">
                        <label className="auth-label">E-mail</label>
                        <input
                            className="auth-input"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoFocus={mode === 'login'}
                        />
                    </div>

                    <div className="auth-field">
                        <label className="auth-label">Senha</label>
                        <input
                            className="auth-input"
                            type="password"
                            placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="auth-error">⚠️ {error}</div>
                    )}

                    <button className="auth-submit" type="submit" disabled={loading}>
                        {loading
                            ? '...'
                            : mode === 'login' ? 'Entrar' : 'Criar conta'}
                    </button>
                </form>

                <p className="auth-switch">
                    {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}
                    {' '}
                    <button
                        className="auth-switch-btn"
                        onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                    >
                        {mode === 'login' ? 'Criar agora' : 'Entrar'}
                    </button>
                </p>
            </div>
        </div>
    );
};
