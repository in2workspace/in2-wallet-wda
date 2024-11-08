import { Component, DestroyRef, inject, OnInit, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { StorageService } from 'src/app/services/storage.service';
import { QRCodeModule } from 'angularx-qrcode';
import { WalletService } from 'src/app/services/wallet.service';
import { VcViewComponent } from '../../components/vc-view/vc-view.component';
import { TranslateModule } from '@ngx-translate/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { WebsocketService } from 'src/app/services/websocket.service';
import { DataService } from 'src/app/services/data.service';
import { VerifiableCredential } from 'src/app/interfaces/verifiable-credential';
import { catchError, EMPTY, map, Observable, of, Subject, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

//TODO unsubscribe

@Component({
  selector: 'app-credentials',
  templateUrl: './credentials.page.html',
  styleUrls: ['./credentials.page.scss'],
  standalone: true,
  providers: [StorageService],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    QRCodeModule,
    VcViewComponent,
    TranslateModule,
    RouterLink
  ],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class CredentialsPage implements OnInit {
  private destroyRef = inject(DestroyRef);
  private dataService = inject(DataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private walletService = inject(WalletService);
  private websocket = inject(WebsocketService);

  //Reducer actions for reactive state
  //todo can just be a signal, and credList$ computed, while loadedCredential is the only action that updates
  public loadedCredentialsSubj = new Subject<VerifiableCredential[]>();
  public loadedCredentials$ = this.loadedCredentialsSubj.asObservable();

  //Reactive state
  credList$: Signal<VerifiableCredential[]> = toSignal(this.loadedCredentials$, 
    {initialValue:[]}
  );

  //Non-reactive state //todo make signals?
  public showOfferSuccessPopup: boolean = false;
  public ebsiFlag: boolean = false;
  public did: undefined|string = undefined;
  public from: undefined|string = undefined; //todo consider to remove
  public credentialOfferUri: undefined|string = undefined;

  //Other fields
  private TIME_IN_MS: number = 3000;
  public credOfferEndpoint: string = window.location.origin + '/tabs/credentials';


  public constructor(){
    this.route.queryParams
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((params) => {
      this.from = params['from']; //todo consider to remove
      this.credentialOfferUri = params['credentialOfferUri'];
    });

    //todo consider moving to settings
    this.dataService.listenDid()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((data: any) => {
      if (data !== undefined) {
        this.ebsiFlag = true;
        this.did = data;
      }
    });

  }

  public ngOnInit() {
    this.loadCredentials()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(()=>{
      if(this.route.snapshot.queryParams['scaned_cred']){
        this.openOfferSuccessPopup();
      }
    });

    // TODO: Find a better way to handle this
    if (this.credentialOfferUri !== undefined) {
      this.generateCred();
    }
  }

  public loadCredentials(): Observable<VerifiableCredential[]> {
    return this.walletService.getAllVCs()
    // return timer(3000) //todo remove: mock
    .pipe(
      // map(()=>mockVCList), //todo remove: mock
      map(vcs=>vcs.reverse()),
      tap(vcs=>{
        this.loadedCredentialsSubj.next(vcs)
      }
      ),
    catchError((err:HttpErrorResponse)=>{
      if(err.status===404){
        return of([]);
      }else{
        console.log('Since there was an error loading credentials, the stream is cut.')
        return EMPTY;
      }
    }))
  }

  public openOfferSuccessPopup(){
    console.log('open popup')
    this.showOfferSuccessPopup = true;
    setTimeout(() => {
      this.showOfferSuccessPopup = false;
    }, this.TIME_IN_MS);
  }

  //todo: currently when you only have one VC and is deleted it doesn't disappear, 
  //todo probably because the 404 error is not managed correctly
  public vcDelete(cred: VerifiableCredential) {
    this.walletService.deleteVC(cred.id)
    .pipe(
      //todo is it really necessary to re-fetch VCs? if response is valid, no need to
      switchMap(()=>this.loadCredentials()),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe(() => {
      console.log('Cred list updated after deleting credential: ' + cred);
    });
  }

  public generateCred() {
    this.websocket.connect();

// TODO: Instead of using a delay, we should wait for the websocket connection to be established
    this.delay(1000).then(() => {
      if(!this.credentialOfferUri) return
      this.walletService.requestCredential(this.credentialOfferUri).
      pipe(
        //todo is it really necessary to re-fetch VCs? maybe just add new one?
        switchMap(this.loadCredentials),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.websocket.closeConnection() //todo use finalize or other
          //todo feedback for success?
        },
        error: (err) => {
          this.websocket.closeConnection(); //todo use finalize or other
          console.error(err);
        }
      });
      //todo consider adding some logic to reset from and credentialOfferUri
    });
  }

  public navigateWithParamsTo(uri:string){
    this.router.navigate(
      [uri], 
      {
        queryParams:{scaned_cred:'true'}, 
        queryParamsHandling: 'preserve'
      });
  }

  public handleButtonKeydown(event: KeyboardEvent, action: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      if (action === 'scan') {
        this.navigateWithParamsTo('tabs/credentials/scanner');
      }
      event.preventDefault();
    }
  }

  //todo avoid, look for an alternative
  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

   // TODO: This should be moved to the settings page because this is something recreated to ebsi and this option is enabled in the settings page
   public async copyToClipboard(textToCopy: string) {
    let text = '';

    if (textToCopy === 'did-text') {
      //todo use angular view models
      const didTextElement = document.getElementById('did-text');

      if (didTextElement) {
        text = didTextElement.innerText.trim();
        const prefix = 'DID: ';
        if (text.startsWith(prefix)) {
          text = text.substring(prefix.length);
        }
      } else {
        console.error('Element with id "did-text" not found.');
        return;
      }
    } else if (textToCopy === 'endpoint-text') {
      text = this.credOfferEndpoint || '';
    } else {
      console.error('Invalid text to copy:', textToCopy);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Error when trying to copy the text to clipboard:', error);
    }
  }

}
