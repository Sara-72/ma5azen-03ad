import { NgModule } from '@angular/core';
import { Routes ,RouterModule } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { Login2PageComponent } from './pages/login2-page/login2-page.component';
import { Login3PageComponent } from './pages/login3-page/login3-page.component';
import { Login4PageComponent } from './pages/login4-page/login4-page.component';
import { FeaturesComponent } from './pages/features/features.component';
import { AboutComponent } from './pages/about/about.component';

export const routes: Routes = [

  { path: '', component: HomeComponent, title: 'Home' },
  { path: 'login', component: LoginPageComponent, title: 'Login' },
  { path: 'login2', component:Login2PageComponent, title: 'Login2' },
  { path: 'login3', component: Login3PageComponent, title: 'Login3' },
  { path: 'login4', component: Login4PageComponent, title: 'Login4' },
  { path: 'features', component: FeaturesComponent, title: 'features'},
  { path: 'about', component: AboutComponent, title: 'about'}






];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
