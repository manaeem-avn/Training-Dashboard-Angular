import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  auth = inject(AuthService);
  menuOpen = signal(false);

  items: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Projects', route: '/projects' },
    { label: 'Tasks', route: '/tasks' },
    { label: 'Users', route: '/users', adminOnly: true }
  ];

  get visibleItems(): NavItem[] {
    return this.items.filter((item) => !item.adminOnly || this.auth.isAdmin());
  }

  initials(): string {
    const name = this.auth.user()?.fullName ?? '';
    return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
