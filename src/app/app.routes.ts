import { NgModule } from '@angular/core';
import { Routes ,RouterModule } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { Login2PageComponent } from './pages/login2-page/login2-page.component';
import { Login3PageComponent } from './pages/login3-page/login3-page.component';
import { Login4PageComponent } from './pages/login4-page/login4-page.component';
import { Login5PageComponent } from './pages/login5-page/login5-page.component';
import { FeaturesComponent } from './pages/features/features.component';
import { AboutComponent } from './pages/about/about.component';
import { AdminComponent } from './pages/admin/admin.component';
import { Ameen1Component } from './pages/ameen/ameen1/ameen1.component';
import { Ameen2Component } from './pages/ameen/ameen2/ameen2.component';
import { Ameen3Component } from './pages/ameen/ameen3/ameen3.component';
import { Ameen4Component } from './pages/ameen/ameen4/ameen4.component';
import { Ameen5Component } from './pages/ameen/ameen5/ameen5.component';
import { Modeer1Component } from './pages/modeer/modeer1/modeer1.component';
import { Modeer2Component } from './pages/modeer/modeer2/modeer2.component';
import { Modeer3Component } from './pages/modeer/modeer3/modeer3.component';
import { Modeer4Component } from './pages/modeer/modeer4/modeer4.component';
import { Employee1Component } from './pages/employee/employee1/employee1.component';
import { Employee2Component } from './pages/employee/employee2/employee2.component';
import { Employee3Component } from './pages/employee/employee3/employee3.component';
import { EmployeeMa5azen1Component } from './pages/employee_ma5azen/employee-ma5azen1/employee-ma5azen1.component';
import { EmployeeMa5azen2Component } from './pages/employee_ma5azen/employee-ma5azen2/employee-ma5azen2.component';
import { EmployeeMa5azen3Component } from './pages/employee_ma5azen/employee-ma5azen3/employee-ma5azen3.component';
import { EmployeeMa5azen4Component } from './pages/employee_ma5azen/employee-ma5azen4/employee-ma5azen4.component';
import { EmployeeMa5azen5Component } from './pages/employee_ma5azen/employee-ma5azen5/employee-ma5azen5.component';
import { Elda3mComponent } from './pages/elda3m/elda3m.component';



export const routes: Routes = [

  { path: 'home', component: HomeComponent, title: 'home'},
  { path: 'login', component: LoginPageComponent, title: 'Login' },
  { path: 'login2', component:Login2PageComponent, title: 'Login2' },
  { path: 'login3', component: Login3PageComponent, title: 'Login3' },
  { path: 'login4', component: Login4PageComponent, title: 'Login4' },
  { path: 'login5', component: Login5PageComponent, title: 'Login5' },
  { path: 'features', component: FeaturesComponent, title: 'features'},
  { path: 'about', component: AboutComponent, title: 'about'},
  { path: 'admin', component: AdminComponent, title: 'admin'},
  { path: 'ameen1', component: Ameen1Component, title: 'ameen1'},
  { path: 'ameen2', component: Ameen2Component, title: 'ameen2'},
  { path: 'ameen3', component: Ameen3Component, title: 'ameen3'},
  { path: 'ameen4', component: Ameen4Component, title: 'ameen4'},
  { path: 'ameen5', component: Ameen5Component, title: 'ameen5'},
  { path: 'modeer1', component: Modeer1Component, title: 'modeer1'},
  { path: 'modeer2', component: Modeer2Component, title: 'modeer2'},
  { path: 'modeer3', component: Modeer3Component, title: 'modeer3'},
  { path: 'modeer4', component: Modeer4Component, title: 'modeer4'},
  { path: 'employee1', component: Employee1Component, title: 'employee1'},
  { path: 'employee2', component: Employee2Component, title: 'employee2'},
  { path: 'employee3', component: Employee3Component, title: 'employee3'},
  { path: 'employee_ma5azen1', component: EmployeeMa5azen1Component, title: 'employee_ma5azen1'},
  { path: 'employee_ma5azen2', component: EmployeeMa5azen2Component, title: 'employee_ma5azen2'},
  { path: 'employee_ma5azen3', component: EmployeeMa5azen3Component, title: 'employee_ma5azen3'},
  { path: 'employee_ma5azen4', component:EmployeeMa5azen4Component , title:'employee_ma5azen4'},
  { path: 'employee_ma5azen5', component:EmployeeMa5azen5Component , title:'employee_ma5azen5'},
  { path: 'elda3m' , component :Elda3mComponent , title:'elda3m'},
 












];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
