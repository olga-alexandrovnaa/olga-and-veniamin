import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Invitation from './pages/Invitation';
import PapersPage from './pages/PapersPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/papers" element={<PapersPage />} />
        <Route path="/" element={<Invitation />} />
        <Route path="/:code" element={<Invitation />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
