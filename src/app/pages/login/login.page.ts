import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { StorageService } from 'src/app/services/storage.service';
import { Router } from '@angular/router';
interface LoginForm {
  username: FormControl<string>;
  password?: FormControl<string>;
}
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class LoginPage implements OnInit {
  login = new FormGroup<LoginForm>({
    username: new FormControl('', {nonNullable: true}),
    password: new FormControl('', {nonNullable: true}),
});

  constructor(private authenticationService:AuthenticationService,
    private storageService:StorageService,
    private router: Router,
    ) { }

  ngOnInit() {
  }
  onSubmit(){
    this.authenticationService.login(this.login.value).subscribe(data=>{
      console.log(data)
      this.authenticationService.isLogin = true;
      let token = data.headers.get('Authorization')
      this.storageService.setLlave('token',token)
      this.router.navigate(['/home/'], {})
  })
  }  
}
