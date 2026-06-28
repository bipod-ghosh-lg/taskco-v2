import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SerializedProject } from '@/store/types';

interface ProjectsState {
  items: SerializedProject[];
  loading: boolean;
}

const initialState: ProjectsState = { items: [], loading: false };

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects(state, action: PayloadAction<SerializedProject[]>) {
      state.items = action.payload;
    },
    addProject(state, action: PayloadAction<SerializedProject>) {
      state.items.unshift(action.payload);
    },
    removeProject(state, action: PayloadAction<string>) {
      state.items = state.items.filter(p => p.id !== action.payload);
    },
    updateProjectItem(state, action: PayloadAction<SerializedProject>) {
      const idx = state.items.findIndex(p => p.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
  },
});

export const { setProjects, addProject, removeProject, updateProjectItem } = projectsSlice.actions;
export default projectsSlice.reducer;
