// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

canActivate(): boolean {
  const role = localStorage.getItem('role');

  // لو الدور موجود، نسمح بالدخول
  if (role) return true;

  // لو مفيش دور مخزن → رجوع لل login
  this.router.navigate(['/login']);
  return false;
}


}
