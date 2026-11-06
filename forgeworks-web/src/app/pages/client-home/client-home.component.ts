import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-home.component.html',
  styleUrls: ['./client-home.component.scss']
})
export class ClientHomeComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  userProfile = this.authService.getUserProfile();

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

