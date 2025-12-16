import type { JSX } from 'react';
import {BrowserRouter, Routes,Route,Navigate} from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { useAuthStore } from './store/useAuthStore';
const PrivateRoute = ({children}:{children: JSX.Element}) => {
  const token = useAuthStore((state) => state.token);
  return token?children : <Navigate to="/login" />;
};

function App() {
  return (
   <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
      path="/dashboard"
      element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      }/>
      <Route path='*' element={<Navigate to ="/login" />} />
    </Routes>
   </BrowserRouter>
  );
};

export default App;
