import { Routes, Route } from "react-router";
import AuthGuard from "./components/AuthGuard";
import NoteList from "./pages/NoteList";
import NoteDetail from "./pages/NoteDetail";
import Unauthorized from "./pages/Unauthorized";

const App = () => {
  return (
    <Routes>
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route
        path="/"
        element={
          <AuthGuard>
            <NoteList />
          </AuthGuard>
        }
      />
      <Route
        path="/noteDetails/:id"
        element={
          <AuthGuard>
            <NoteDetail />
          </AuthGuard>
        }
      />
    </Routes>
  );
};

export default App;
