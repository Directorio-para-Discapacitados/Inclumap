import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Inicio from "./pages/inicio/inicio";
import Login from "./pages/login/login";
import Registro from "./pages/registro/registro";
import Perfil from "./pages/perfil/perfil";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./Components/ProtectedRoute";
import ChatWidget from "./Components/ChatWidget"; 

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main>
          <Routes>
            
            <Route path="/" element={<Inicio />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/perfil" element={<Perfil />} />
                            
              <Route
                path="/guardados"
                element={
                  <div style={{ padding: '2rem' }}>
                    <h2>⭐ Mis Lugares Guardados</h2>
                    <p>Aquí se listarán los lugares que has marcado como favoritos.</p>
                  </div>
                }
              />
              <Route
                path="/ajustes"
                element={
                  <div style={{ padding: '2rem' }}>
                    <h2>⚙️ Ajustes</h2>
                    <p>Aquí podrás configurar tu cuenta.</p>
                  </div>
                }
              />
            </Route>
          </Routes>
        </main>
        <ChatWidget />
      </Router>
    </AuthProvider>
  );
}

export default App;