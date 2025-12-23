// src/context/AuthProvider.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { AuthContext } from './AuthContext';

// --- CONFIGURACIÓN DE LA API ---
const BASE_URL = `${import.meta.env.VITE_API_URL}`; 

//instancia de Axios
const axiosInstance = axios.create({
    baseURL : BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// --- 2. EL PROVEEDOR ---
export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();

    // CAMBIO 1: Usamos sessionStorage en lugar de localStorage
    const [authTokens, setAuthTokens] = useState(() => 
        sessionStorage.getItem('authTokens') 
            ? JSON.parse(sessionStorage.getItem('authTokens')) 
            : null
    );
    
    const [user, setUser] = useState(() => 
        authTokens 
            ? jwtDecode(authTokens.access) 
            : null
    );
    
    const [loading, setLoading] = useState(true);

    // ---------------------- FUNCIÓN DE LOGIN ----------------------

    const loginUser = useCallback(async (credentials) => {
        try {
            const response = await axios.post(`${BASE_URL}/token/`, credentials);

            if (response.status === 200) {
                const data = response.data;
                
                setAuthTokens(data);
                setUser(jwtDecode(data.access));
                
                // CAMBIO 2: Guardamos en sessionStorage
                sessionStorage.setItem('authTokens', JSON.stringify(data));
                
                navigate('/dashboard'); 
                return { success: true };
            }
        } catch (error) {
            if (error.response && error.response.status === 400) {
                throw new Error("Credenciales inválidas. Verifica tu correo y contraseña.");
            }
            throw new Error("Error de conexión o servidor no disponible.");
        }
    }, [navigate]); 

    
    // ---------------------- FUNCIÓN DE LOGOUT ----------------------
    const logoutUser = useCallback(() => {
        setAuthTokens(null);
        setUser(null);
        // CAMBIO 3: Limpiamos sessionStorage
        sessionStorage.removeItem('authTokens');
        navigate('/'); 
    }, [navigate]);

    //FUNCION DE REFRESCO DE TOKEN ----------------------------------
    const updateToken = useCallback(async () =>{
        // CAMBIO 4: Leemos de sessionStorage
        const tokens = JSON.parse(sessionStorage.getItem('authTokens'));
        if (!tokens || !tokens.refresh){
            logoutUser();
            return null;
        }
        try{
            const response = await axios.post(`${BASE_URL}/token/refresh/`,{
                refresh : tokens.refresh
            });
            if (response.status === 200) {
                const data = response.data;
                setAuthTokens(data);
                setUser(jwtDecode(data.access));
                // CAMBIO 5: Actualizamos sessionStorage
                sessionStorage.setItem('authTokens', JSON.stringify(data));
                return data.access;
            }
        } catch(error){
            console.log('Error al refrescar token: -> ' + error)
            logoutUser();
        }
    }, [logoutUser]);



    // ---------------------- VALOR DEL CONTEXTO ----------------------
    const contextData = {
        user,
        authTokens,
        loginUser, 
        logoutUser,
        setUser,
        setAuthTokens,
        axiosInstance,
    };

    // Finalizar el estado de carga inicial 
    useEffect(() => {
        if (loading) {
            setLoading(false);
        }
    }, [loading]);


    //INTERCEPTOR TOKEN REFRESH --------------------------------------------------

    useEffect(() => {
        // Ejecutamos solo si hay tokens para proteger
        if (!authTokens) return;

        // 3a. Interceptor de Request: Adjunta el Access Token
        const requestInterceptor = axiosInstance.interceptors.request.use(async req => {
            // CAMBIO 6: Leemos de sessionStorage
            const tokens = JSON.parse(sessionStorage.getItem('authTokens'));
            
            if (tokens) {
                req.headers.Authorization = `Bearer ${tokens.access}`;
            }
            return req;
        });

        // 3b. Interceptor de Response: Maneja el error 401
        const responseInterceptor = axiosInstance.interceptors.response.use(
            response => response, 
            async error => {
                const originalRequest = error.config;
                
                // Si el error NO es 401 O ya marcamos la petición como reintento
                // O si la petición fallida es la de refresco, no hacemos nada.
                if (error.response.status !== 401 || originalRequest._retry || error.config.url.includes('/token/refresh/')) {
                    return Promise.reject(error);
                }
                
                // Marcar y proceder al refresco
                originalRequest._retry = true; 
                
                const newAccessToken = await updateToken(); 
                
                if (newAccessToken) {
                    // Reemplazar el token y reintentar la petición original
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return axiosInstance(originalRequest); 
                }
                
                // Si el refresco falla (token refresh expirado), cerramos sesión.
                return Promise.reject(error);
            }
        );
        
        // Función de limpieza para desmontar los interceptores
        return () => {
            axiosInstance.interceptors.request.eject(requestInterceptor);
            axiosInstance.interceptors.response.eject(responseInterceptor);
        };

    }, [authTokens, updateToken]);


    return (
        <AuthContext.Provider value={contextData}>
            {loading ? <p>Cargando aplicación...</p> : children}
        </AuthContext.Provider>
    );
};