import {createRoot} from 'react-dom/client';
import '@fortawesome/fontawesome-free/css/all.min.css';
import App from './ui/App';
import './styles.css';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
