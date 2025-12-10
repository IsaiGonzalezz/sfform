import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth'; 

const PrivateRoute = () => {
    // 1. Obtener el usuario del estado global
    const { user, loading } = useAuth(); 

    // Si el contexto aún está cargando la info de localStorage
    if (loading) {
        return <p>Verificando sesión...</p>;
    }
    
    // 2. Si hay un usuario (está logueado), permite el acceso al hijo (<Outlet />)
    // 3. Si no hay usuario, redirige a /login
    return user ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;