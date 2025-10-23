// Imports
import '../styles/00-main.css';
import '../components/BaseModal';
import { initializeWindowControls } from '../core/WindowControls';

// Initialize window controls
initializeWindowControls();

// Choose project and navigate
const projectSelect = document.getElementById('project-select') as HTMLSelectElement;
const openProjectButton = document.getElementById('open-project-btn') as HTMLButtonElement;

openProjectButton.addEventListener('click', () => {
  const selectedProject = projectSelect.value;
    
  // Map of project routes
  const projectRoutes: { [key: string]: string } = {
    'start-page': './start-page.html',
    'project1': './project-1.html',
  };

  window.location.href = projectRoutes[selectedProject];
});
