import { create } from 'zustand';
import { authAPI, projectsAPI } from '../services/api';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  
  login: async (credentials) => {
    const response = await authAPI.login(credentials);
    const { user, token } = response.data.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    set({ user, token, isAuthenticated: true });
    return response.data;
  },
  
  register: async (data) => {
    const response = await authAPI.register(data);
    const { user, token } = response.data.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    set({ user, token, isAuthenticated: true });
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  updateUser: (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    set({ user: userData });
  }
}));

export const useProjectStore = create((set) => ({
  projects: [],
  currentProject: null,
  stats: null,
  
  fetchProjects: async () => {
    const response = await projectsAPI.getAll();
    set({ projects: response.data.data });
    return response.data;
  },
  
  setCurrentProject: (project) => {
    set({ currentProject: project });
  },
  
  createProject: async (data) => {
    const response = await projectsAPI.create(data);
    set((state) => ({ 
      projects: [...state.projects, response.data.data] 
    }));
    return response.data;
  },
  
  updateProject: async (id, data) => {
    const response = await projectsAPI.update(id, data);
    set((state) => ({
      projects: state.projects.map(p => 
        p._id === id ? response.data.data : p
      ),
      currentProject: state.currentProject?._id === id 
        ? response.data.data 
        : state.currentProject
    }));
    return response.data;
  },
  
  deleteProject: async (id) => {
    await projectsAPI.delete(id);
    set((state) => ({
      projects: state.projects.filter(p => p._id !== id),
      currentProject: state.currentProject?._id === id 
        ? null 
        : state.currentProject
    }));
  },
  
  fetchStats: async () => {
    const response = await projectsAPI.getStats();
    set({ stats: response.data.data });
    return response.data;
  }
}));
