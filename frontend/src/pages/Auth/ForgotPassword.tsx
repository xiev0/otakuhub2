import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import styles from './Auth.module.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const r = await authApi.forgotPassword(email);
      setSuccess(r.message);
    } catch (err: any) {
      setError(err.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link to="/" className={styles.logo}>Otaku<span>Hub</span></Link>
        <h1 className={styles.heading}>Восстановление пароля</h1>
        <p className={styles.subtext}>Введите email от вашего аккаунта, и мы отправим ссылку для сброса пароля.</p>

        {success ? (
          <div className={styles.successMsg}>{success}</div>
        ) : (
          <>
            {error && <div className={styles.error}>{error}</div>}
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input type="email" className={styles.input} placeholder="your@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className={styles.submit} disabled={loading}>
                {loading ? 'Отправляем...' : 'Отправить письмо'}
              </button>
            </form>
          </>
        )}

        <p className={styles.switchLink}><Link to="/login">← Назад ко входу</Link></p>
      </div>
    </div>
  );
}
