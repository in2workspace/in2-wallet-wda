import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule,TranslateService } from '@ngx-translate/core';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { PopoverController } from '@ionic/angular';
import {LogoutPage } from '../logout/logout.page';
import {ActivatedRoute, Router,RouterModule} from '@angular/router';

@Component({
  selector: 'app-language-selector',
  templateUrl: './language-selector.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule,TranslateModule]
})
export class LanguageSelectorPage implements OnInit {
  public translate= inject(TranslateService);
  selected : string = '';
  userName: string = '';

  languageList = [
    // todo: add more EU official languages, such as French, German, and Italian.
    {
      name: "English",
      url: "assets/flags/uk.png",
      code: "en"
    },
    {
      name: "Castellano",
      url: "assets/flags/es.png",
      code: "es"
    },
    {
      name: "Català",
      url: "assets/flags/ca.png",
      code: "ca"
    }
  ]
  constructor(
    private router: Router,
    private authenticationService: AuthenticationService,
    private route: ActivatedRoute,
    private popoverController: PopoverController,
    ) { }

  ngOnInit() {
    this.selected = this.translate.currentLang;
    this.userName = this.authenticationService.getName();
  }
  languageChange(code:string){
    this.selected = code;
    this.translate.use(code);
  }

  logout(){
    this.authenticationService.logout().subscribe(()=>{
      this.router.navigate(['/login'], {})

    });
  }

  async openPopover(ev: any) {
    const popover = await this.popoverController.create({
      component: LogoutPage, 
      event: ev,
      translucent: true,
      cssClass: 'custom-popover'
    });
  
    await popover.present();
  }

}
