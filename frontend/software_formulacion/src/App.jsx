import './App.css';
import MainLayout from './layouts/MainLayout';
import UserPage from './pages/UserPage';
import LoginPage from './pages/LoginPage';
import { Routes, Route } from 'react-router-dom';
import EstacionesPage from './pages/EstacionesPage';
import DashboardPage from './pages/DashboardPage'
import OperadoresPage from './pages/OperadoresPage';
import EmpresaPage from './pages/EmpresaPage';
import IngredientesPage from './pages/IngredientesPage';
import FormulasPage from './pages/FormulasPages';
import ProduccionPage from './pages/ProducciónPage';

function App() {
  return (
    <Routes> {/* El contenedor principal de rutas */}

      {/* Ruta para el Login: SIN MainLayout (Perfecto) */}
      <Route path="/" element={<LoginPage />} />

      {/* Rutas para el resto de la aplicación: CON MainLayout */}
      <Route path="/*" element={
        <MainLayout>
          <Routes> {/* Rutas anidadas dentro del Layout */}
            
            {/* CORRECCIÓN: Quita la '/' inicial de todas estas rutas */}
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="usuarios" element={<UserPage/>} />
            <Route path="estaciones" element={<EstacionesPage />} />
            <Route path="operadores" element={<OperadoresPage />} />
            <Route path="empresa" element={<EmpresaPage />} />
            <Route path="ingredientes" element={<IngredientesPage />} />
            <Route path="formulas" element={<FormulasPage />} />
            <Route path='produccion' element={<ProduccionPage/>} />

            <Route path="*" element={<div>Página no encontrada</div>} />
          </Routes>
        </MainLayout>
      } />

    </Routes>
  );
}

export default App
