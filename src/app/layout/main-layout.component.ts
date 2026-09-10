import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AuthService } from '../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ButtonModule, MenuModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  auth = inject(AuthService);
  collapsed = signal(false);
  mobileOpen = signal(false);

  items: NavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-chart-pie', route: '/dashboard' },
    { label: 'Projects', icon: 'pi pi-briefcase', route: '/projects' },
    { label: 'Tasks', icon: 'pi pi-check-square', route: '/tasks' },
    { label: 'Users', icon: 'pi pi-users', route: '/users', adminOnly: true }
  ];

  get visibleItems(): NavItem[] {
    return this.items.filter((item) => !item.adminOnly || this.auth.isAdmin());
  }

  initials(): string {
    const name = this.auth.user()?.fullName ?? '';
    return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  }

  toggle(): void {
    if (window.innerWidth < 992) {
      this.mobileOpen.update((open) => !open);
    } else {
      this.collapsed.update((value) => !value);
    }
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }
}
