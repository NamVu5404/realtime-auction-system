import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <App />
)

// Hide initial preloader
const preloader = document.getElementById('initial-preloader');
if (preloader) {
  preloader.classList.add('fade-out');
  setTimeout(() => {
    preloader.style.display = 'none';
  }, 500);
}
