import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../services/api';
import styles from './Auth.module.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setError('Пароли не совпадают');
    if (!token) return setError('Неверная ссылка — токен отсутствует');
    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword(token, password);
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Ошибка сброса пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link to="/" className={styles.logo}>Otaku<span>Hub</span></Link>
        <h1 className={styles.heading}>Новый пароль</h1>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Новый пароль</label>
            <div className={styles.pwdWrap}>
              <input
                type={showPwd ? 'text' : 'password'}
                className={styles.input}
                placeholder="Минимум 8 символов"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPwd(v => !v)}>
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Повторите пароль</label>
            <input
              type={showPwd ? 'text' : 'password'}
              className={styles.input}
              placeholder="Повторите пароль"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={styles.submit} disabled={loading || !token}>
            {loading ? 'Сохраняем...' : 'Сохранить пароль'}
          </button>
        </form>

        <p className={styles.switchLink}><Link to="/login">← Назад ко входу</Link></p>
      </div>
    </div>
  );
}
