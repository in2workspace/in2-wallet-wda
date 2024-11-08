import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { QRCodeModule } from 'angularx-qrcode';
import { finalize } from 'rxjs';
import { BarcodeScannerComponent } from 'src/app/components/barcode-scanner/barcode-scanner.component';
import { VcViewComponent } from 'src/app/components/vc-view/vc-view.component';
import { CameraLogsService } from 'src/app/services/camera-logs.service';
import { WalletService } from 'src/app/services/wallet.service';
import { WebsocketService } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-scan',
  templateUrl: './scan.component.html',
  styleUrls: ['./scan.component.scss'],
  standalone: true,
  imports:[    
    IonicModule,
    CommonModule,
    QRCodeModule,
    BarcodeScannerComponent,
    VcViewComponent
  ]
})
export class ScanComponent {
  private cameraLogsService = inject(CameraLogsService);
  private router = inject(Router);
  private walletService = inject(WalletService);
  private websocket = inject(WebsocketService);
  
  private qrIsBeingProcessed = false;
  public from: undefined|string = undefined;
  public isAlertOpen = false;
  public scaned_cred = false;

  public qrCodeEmit(qrCode: string) {
    console.log('qr code emit. QR is already being processed? ' + this.qrIsBeingProcessed)
    if(this.qrIsBeingProcessed) return
    this.qrIsBeingProcessed = true;
    
    this.websocket.connect();

    // TODO: Instead of using a delay, we should wait for the websocket connection to be established
    this.delay(1000).then(() => {
      this.walletService.executeContent(qrCode)
      .pipe(finalize(()=>this.qrIsBeingProcessed=false))
        .subscribe({
          next: (executionResponse) => {
            // TODO: Instead of analyzing the qrCode, we should check the response and decide what object we need to show depending on the response
            if (qrCode.includes('credential_offer_uri')) {
              this.router.navigate(['tabs/credentials'], 
                {
                  queryParams:{scaned_cred:true},
                  queryParamsHandling: 'merge'
                }
              );

            } else { //login verifier
              this.router.navigate(['/tabs/vc-selector/'], {
                queryParams: {
                  executionResponse: JSON.stringify(executionResponse),
                },
              });
            }
            this.websocket.closeConnection();//todo avoid repetition; finalize maybe?
          },
          error: (httpErrorResponse) => {
            this.websocket.closeConnection();//todo avoid repetition; finalize maybe?

            const httpErr = httpErrorResponse.error;
            const error = httpErr.title + ' . ' + httpErr.message + ' . ' + httpErr.path;
            this.cameraLogsService.addCameraLog(new Error(error), 'httpError');
            console.error(httpErrorResponse);

            setTimeout(()=>{ //todo probably better handled with catchError+timer
              this.router.navigate(['/tabs/home'])
            }, 1000);
          },
        });
    });
  }

//todo refactor
  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}
