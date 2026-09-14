import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="message-page">
      <h2>You do not have access to this page</h2>
      <p>This section is for administrators only.</p>
      <a class="btn" routerLink="/dashboard">Back to dashboard</a>
    </div>
  `,
  styleUrl: './message-page.component.css'
})
export class ForbiddenComponent {}

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="message-page">
      <h2>Page not found</h2>
      <p>The address you opened does not exist.</p>
      <a class="btn" routerLink="/dashboard">Back to dashboard</a>
    </div>
  `,
  styleUrl: './message-page.component.css'
})
export class NotFoundComponent {}
