import { createRoot } from 'react-dom/client';
import '../styles/theme.css';
import { ShareViewer } from './ShareViewer';

createRoot(document.getElementById('root')!).render(<ShareViewer />);
