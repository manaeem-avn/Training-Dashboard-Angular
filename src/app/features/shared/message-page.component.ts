import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink, ButtonModule],
  template: `
    <div class="message-page">
      <i class="pi pi-lock"></i>
      <h2>You do not have access to this page</h2>
      <p>This section is for administrators only.</p>
      <p-button label="Back to dashboard" routerLink="/dashboard" />
    </div>
  `,
  styleUrl: './message-page.component.css'
})
export class ForbiddenComponent {}

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, ButtonModule],
  template: `
    <div class="message-page">
      <i class="pi pi-compass"></i>
      <h2>Page not found</h2>
      <p>The address you opened does not exist.</p>
      <p-button label="Back to dashboard" routerLink="/dashboard" />
    </div>
  `,
  styleUrl: './message-page.component.css'
})
export class NotFoundComponent {}
