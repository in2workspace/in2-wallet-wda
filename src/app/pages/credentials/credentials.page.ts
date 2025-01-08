import { ChangeDetectorRef, Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule } from '@ionic/angular';
import { StorageService } from 'src/app/services/storage.service';
import { BarcodeScannerComponent } from 'src/app/components/barcode-scanner/barcode-scanner.component';
import { QRCodeModule } from 'angularx-qrcode';
import { WalletService } from 'src/app/services/wallet.service';
import { VcViewComponent } from '../../components/vc-view/vc-view.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { WebsocketService } from 'src/app/services/websocket.service';
import { DataService } from 'src/app/services/data.service';
import { VerifiableCredential } from 'src/app/interfaces/verifiable-credential';
import { CameraLogsService } from 'src/app/services/camera-logs.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

const TIME_IN_MS = 3000;

//TODO don't show creds while scanning, separate scan in another component

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
    BarcodeScannerComponent,
  ],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class CredentialsPage implements OnInit {
  @Input() public availableDevices: MediaDeviceInfo[] = [];
  public alertButtons = ['OK'];
  public userName = '';
  public credList: Array<VerifiableCredential> = [];
  public size = 300;
  public credDataList: unknown[] = [];
  public currentDevice: unknown;
  public isAlertOpen = false;
  public toggleScan = false;
  public credOfferEndpoint = '';
  public from = '';
  public scaned_cred = false;
  public show_qr = false;
  public credentialOfferUri = '';
  public ebsiFlag = false;
  public did = '';

  private walletService = inject(WalletService);
  private router = inject(Router);
  private websocket = inject(WebsocketService);
  private dataService = inject(DataService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  public constructor(
    private alertController: AlertController,
    public translate: TranslateService,
    private cameraLogsService: CameraLogsService,
    private cdr: ChangeDetectorRef)
    {
    this.credOfferEndpoint = window.location.origin + '/tabs/home';
    this.route.queryParams.subscribe((params) => {
      this.toggleScan = params['toggleScan'];
      this.from = params['from'];
      this.show_qr = params['show_qr'];
      this.credentialOfferUri = params['credentialOfferUri'];
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.dataService.listenDid().subscribe((data: any) => {
      if (data != '') {
        this.ebsiFlag = true;
        this.did = data;
      }
    });

    this.router.events
    .pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed()
    )
    .subscribe((event: NavigationEnd) => {
      if (this.route.snapshot.routeConfig?.path==='credentials' && !event.urlAfterRedirects.startsWith('/tabs/credentials')) {
        this.untoggleScan();
        this.cdr.detectChanges();
      }
    });

  }

  public ngOnInit() {
    this.scaned_cred = false;
    this.refresh();
    // TODO: Find a better way to handle this
    if (this.credentialOfferUri !== undefined) {
      this.generateCred();
    }
  }
  public scan() {
    this.toggleScan = true;
    this.show_qr = true;
    this.ebsiFlag = false;
  }

  // TODO: This should be moved to the settings page because this is something recreated to ebsi and this option is enabled in the settings page
  public async copyToClipboard(textToCopy: string) {
    let text = '';

    if (textToCopy === 'did-text') {
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
      console.error('Error al copiar texto al portapapeles:', error);
    }
  }

  public refresh() {
    this.walletService
      .getAllVCs()
      .subscribe({
        next: (credentialListResponse: VerifiableCredential[]) => {
          this.credList = [...credentialListResponse.slice().reverse()];
          this.cdr.detectChanges(); // Ensure Angular updates the view
        },
        // TODO: migrate to unified errorHandler interceptor
        error: (error) => {
          if (error.status === 404) {
            this.credList = []; // Set the list to empty if no credentials are found
            this.cdr.detectChanges(); // Ensure view updates with empty list
          } else {
            console.error("Error fetching credentials:", error);
          }
        }
      });
  }

  public vcDelete(cred: VerifiableCredential) {
    this.walletService.deleteVC(cred.id).subscribe(() => {
      this.refresh();
    });
  }

  public qrCodeEmit(qrCode: string) {
    console.log('qr code emit')
    this.toggleScan = false;
    this.websocket.connect();

    // TODO: Instead of using a delay, we should wait for the websocket connection to be established
    this.delay(1000).then(() => {
      //todo don't accept qrs that are not to login or get VC
      this.walletService.executeContent(qrCode)
      .pipe(
        takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (executionResponse) => {
            // TODO: Instead of analyzing the qrCode, we should check the response and decide what object we need to show depending on the response
            if (qrCode.includes('credential_offer_uri')) {
              this.from = 'credential';
              this.okMessage();
              this.successRefresh();
            } else {
              // login from verifier
              this.show_qr = false;
              this.from = '';
              this.router.navigate(['/tabs/vc-selector/'], {
                queryParams: {
                  executionResponse: JSON.stringify(executionResponse),
                },
              });
            }
            this.websocket.closeConnection();
          },
          error: (httpErrorResponse) => {
            this.websocket.closeConnection();

            const httpErr = httpErrorResponse?.error;
            const message = httpErr?.message || httpErrorResponse?.message || 'No error message';
            const title = httpErr?.title || httpErrorResponse?.title || '(No title)';
            const path = httpErr?.path || httpErrorResponse?.path || '(No path)';

            const error = title + ' . ' + message + ' . ' + path;
            this.cameraLogsService.addCameraLog(new Error(error), 'httpError');

            console.error(httpErrorResponse);
            setTimeout(()=>{
              this.router.navigate(['/tabs/home'])
            }, 1000);

          },
        });
    });
  }

  public generateCred() {
    this.websocket.connect();

    // Esperar un segundo antes de continuar
    this.delay(1000).then(() => {
      this.walletService.requestOpenidCredentialOffer(this.credentialOfferUri).subscribe({
        next: () => {
          this.okMessage();
          this.successRefresh();
          this.websocket.closeConnection();
        },
        error: (err) => {
          console.error(err);
          this.websocket.closeConnection();
        },
      });
    });
  }


  public untoggleScan() {
    this.toggleScan = false;
  }
  public handleButtonKeydown(event: KeyboardEvent, action: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      if (action === 'scan') {
        this.scan();
      } else if (action === 'getCredential') {
        this.credentialClick();
      }
      event.preventDefault();
    }
  }
  public async credentialClick() {
    const alert = await this.alertController.create({
      header: this.translate.instant('credentials.confirmation'),
      message: this.translate.instant('confirmationMessage.confirmation'),
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('User canceled');
          },
        },
        {
          text: 'Accept',
          handler: () => {
            console.log('User accepted');
            setTimeout(() => {
              this.isAlertOpen = false;
              this.toggleScan = false;
              this.router.navigate(['/tabs/credentials/']);
            }, TIME_IN_MS);
            this.isAlertOpen = true;
            this.show_qr = true;
            this.scaned_cred = false;
            this.from = '';
          },
        },
      ],
    });

    await alert.present();

  }
  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async okMessage() {
    const alert = await this.alertController.create({
      message: `
        <div style="display: flex; align-items: center; gap: 50px;">
          <ion-icon name="checkmark-circle-outline" ></ion-icon>
          <span>${this.translate.instant('home.ok-msg')}</span>
        </div>
      `,
      cssClass: 'custom-alert-ok',
    });

    await alert.present();

    setTimeout(async () => {
      await alert.dismiss();
      this.refresh();
    }, 2000);
  }

  private successRefresh(): void {
    setTimeout(() => {
      this.isAlertOpen = false;
      this.scaned_cred = false;
    }, TIME_IN_MS);
    this.refresh();
  }

}
