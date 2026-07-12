import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link to="/" className={styles.logo}>
            Ani<span className={styles.accent}>ki</span>
          </Link>
          <p className={styles.desc}>Смотри аниме онлайн бесплатно</p>
        </div>
        <div className={styles.links}>
          <Link to="/" className={styles.link}>Главная</Link>
          <Link to="/login" className={styles.link}>Войти</Link>
          <Link to="/register" className={styles.link}>Регистрация</Link>
        </div>
      </div>
      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} Aniki. Все права защищены.</span>
        <span>Видео предоставляется сервисом AniLibria</span>
      </div>
    </footer>
  );
}
