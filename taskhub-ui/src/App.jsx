import { useState, useEffect } from 'react'
import { getTasks, createTask } from './api.js'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState('');

  // Sayfa yüklendiğinde bir kez çalışır
  useEffect(() => {
    fetchData(); 
  }, []); // [] demek: "Sadece sayfa ilk açıldığında çalış" demek

  // API'den verileri çeken fonksiyon
  const fetchData = async () => {
    try {
      const response = await getTasks(); // api.js'deki fonksiyonu çağırır
      setTasks(response.data); // Gelen veriyi 'tasks' değişkenine aktarır (Ekran otomatik yenilenir!)
    } catch (error) {
      console.error("Veri çekilirken hata oluştu:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    try {
      await createTask({ title: newTitle, completed: false });
      setNewTitle('');
      fetchData(); // Listeyi yenile
    } catch (error) {
      console.error("Görev eklenirken hata oluştu:", error);
    }
  };

  return (
    <div className="App">
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Task Hub</h1>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Yeni görev ekle..."
        />
        <button type="submit">Ekle</button>
      </form>

      <div className="tasks">
        <h2>Görevler ({tasks.length})</h2>
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              <span>{task.title}</span>
              <span>{task.completed ? '✓' : '○'}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
