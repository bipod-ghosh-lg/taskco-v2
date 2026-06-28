import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SerializedTask } from '@/store/types';

interface TaskFilters {
  status: string | null;
  priority: string | null;
}

interface TasksState {
  items: SerializedTask[];
  filters: TaskFilters;
  loading: boolean;
}

const initialState: TasksState = {
  items: [],
  filters: { status: null, priority: null },
  loading: false,
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks(state, action: PayloadAction<SerializedTask[]>) {
      state.items = action.payload;
    },
    setFilter(state, action: PayloadAction<Partial<TaskFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) {
      state.filters = { status: null, priority: null };
    },
    addTask(state, action: PayloadAction<SerializedTask>) {
      state.items.unshift(action.payload);
    },
    updateTaskItem(state, action: PayloadAction<SerializedTask>) {
      const idx = state.items.findIndex(t => t.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
    removeTask(state, action: PayloadAction<string>) {
      state.items = state.items.filter(t => t.id !== action.payload);
    },
  },
});

export const { setTasks, setFilter, clearFilters, addTask, updateTaskItem, removeTask } = tasksSlice.actions;
export default tasksSlice.reducer;
