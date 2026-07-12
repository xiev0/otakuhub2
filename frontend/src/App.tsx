import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAppDispatch } from './store/hooks';
import { fetchProfile } from './store/authSlice';
import Layout from './components/layout/Layout';
import Home from './pages/Home/Home';
import AnimeDetail from './pages/AnimeDetail/AnimeDetail';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Profile from './pages/Profile/Profile';

export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      dispatch(fetchProfile());
    }
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="anime/:id" element={<AnimeDetail />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:userId" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
