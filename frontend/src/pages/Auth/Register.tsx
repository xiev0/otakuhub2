import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { setAuthTokens, setUser } from '../../store/authSlice';
import { authApi } from '../../services/api';
import styles from './Auth.module.css';

export default function Register() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setError('Пароли не совпадают');
    setLoading(true);
    setError('');
    try {
      const resp = await authApi.register(username, email, password);
      dispatch(setAuthTokens(resp.tokens));
      dispatch(setUser(resp.user));
      navigate('/profile');
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link to="/" className={styles.logo}>Otaku<span>Hub</span></Link>
        <h1 className={styles.heading}>Создать аккаунт</h1>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Имя пользователя</label>
            <input type="text" className={styles.input} placeholder="Ваш никнейм"
              value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input type="email" className={styles.input} placeholder="your@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Пароль</label>
            <div className={styles.pwdWrap}>
              <input type={showPwd ? 'text' : 'password'} className={styles.input}
                placeholder="Минимум 8 символов"
                value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPwd(v => !v)}>
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Повторите пароль</label>
            <input type={showPwd ? 'text' : 'password'} className={styles.input}
              placeholder="Повторите пароль"
              value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </div>

          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? 'Регистрируем...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className={styles.switchLink}>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}
