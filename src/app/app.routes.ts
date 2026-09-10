import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
    title: 'Sign in'
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Dashboard'
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/projects/project-list.component').then((m) => m.ProjectListComponent),
        title: 'Projects'
      },
      {
        path: 'tasks',
        loadComponent: () => import('./features/tasks/task-list.component').then((m) => m.TaskListComponent),
        title: 'Tasks'
      },
      {
        path: 'tasks/:id',
        loadComponent: () => import('./features/tasks/task-detail.component').then((m) => m.TaskDetailComponent),
        title: 'Task detail'
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/user-list.component').then((m) => m.UserListComponent),
        canActivate: [adminGuard],
        title: 'Users'
      },
      {
        path: 'forbidden',
        loadComponent: () => import('./shared/message-page.component').then((m) => m.ForbiddenComponent),
        title: 'Not allowed'
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./shared/message-page.component').then((m) => m.NotFoundComponent),
    title: 'Page not found'
  }
];
