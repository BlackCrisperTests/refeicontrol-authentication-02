
import { useState, useEffect } from 'react';

interface AdminSession {
  id: string;
  username: string;
  name: string;
  loginTime: number;
}

export const useAdminSession = () => {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);

  useEffect(() => {
    const sessionData = localStorage.getItem('admin_session');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        setAdminSession(session);
      } catch (error) {
        console.error('Error parsing admin session:', error);
        setAdminSession(null);
      }
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('admin_session');
    setAdminSession(null);
  };

  return { adminSession, logout };
};
