import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { COLECCIONES } from '../constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [rol, setRol] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const rolSnap = await getDoc(doc(db, COLECCIONES.USUARIOS_ROLES, user.uid));
          if (rolSnap.exists()) {
            const rolUsuario = rolSnap.data().rol;
            setRol(rolUsuario);
            setUsuario(user);
          } else {
            await signOut(auth);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setUsuario(null);
        setRol(null);
      }
      setCargando(false);
    });
    return unsub;
  }, []);

  const cerrarSesion = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ usuario, rol, cargando, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};