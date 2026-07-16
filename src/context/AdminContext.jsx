import { createContext, useContext, useState, useCallback } from 'react';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!sessionStorage.getItem('matsso_admin_key'),
  );

  const login = useCallback((key) => {
    sessionStorage.setItem('matsso_admin_key', key);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('matsso_admin_key');
    setIsAuthenticated(false);
  }, []);

  const getKey = useCallback(
    () => sessionStorage.getItem('matsso_admin_key') || '',
    [],
  );

  return (
    <AdminContext.Provider value={{ isAuthenticated, login, logout, getKey }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
