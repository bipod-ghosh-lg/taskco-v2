import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth-slice';
import projectsReducer from './slices/projects-slice';
import tasksReducer from './slices/tasks-slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
    tasks: tasksReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
