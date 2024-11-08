import { CameraLogsService } from './../../services/camera-logs.service';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  ViewChild
} from '@angular/core';
import { BarcodeFormat, Exception } from '@zxing/library';
import { ZXingScannerModule, ZXingScannerComponent } from '@zxing/ngx-scanner';
import {
  BehaviorSubject,
  Observable,
  Subject,
  debounceTime,
  distinctUntilChanged,
  filter,
  of,
} from 'rxjs';
import { CameraLogType } from 'src/app/interfaces/camera-log';
import { CameraService } from 'src/app/services/camera.service';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';

// ! Since console.error is intercepted (to capture the error already caught by zxing), be careful to avoid recursion
// ! (i.e., console.error should not be called within the execution flow of another console.error)

//TODO unsubscribe
@Component({
  selector: 'app-barcode-scanner',
  templateUrl: './barcode-scanner.component.html',
  standalone: true,
  imports: [CommonModule, ZXingScannerModule, RouterModule],
})
export class BarcodeScannerComponent implements OnInit {
  @Output() public availableDevices: EventEmitter<MediaDeviceInfo[]> =
    new EventEmitter();
  @Output() public qrCode: EventEmitter<string> = new EventEmitter();
  @ViewChild('scanner') public scanner!: ZXingScannerComponent;
  public allowedFormats = [BarcodeFormat.QR_CODE];

  //is assigned CameraService.selectedDevice after scanner is autostarted
  public selectedDevice$: Observable<MediaDeviceInfo|undefined>=of(undefined);
  readonly scanFailureSubject = new Subject<Error>();
  private readonly scanFailureDebounceDelay = 3000;
  private originalConsoleError: undefined|((...data: any[]) => void);

  public scanSuccess$ = new BehaviorSubject<string>('');
  public constructor(
    private readonly cameraService: CameraService,
    private readonly cameraLogsService: CameraLogsService, 
    private readonly router: Router,
    private readonly route: ActivatedRoute) {
      // Requires debounce since this type of error is emitted constantly
      this.scanFailureSubject.pipe(
        distinctUntilChanged((
          previous, current) => 
            JSON.stringify(previous) === JSON.stringify(current)),
        debounceTime(this.scanFailureDebounceDelay)
      ).subscribe(err=>{
        this.saveErrorLog(err, 'scanFailure');
      });

      this.router.events
    .pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed()
    )
    .subscribe((event: NavigationEnd) => {
      const originRoute = this.route.snapshot.url[0].path;
      if (
        originRoute.startsWith('camera-selector') ||
        originRoute.startsWith('credentials')
         ) {
        this.scanner.reset();
      }
    });
    }
  public ngOnInit(): void {
    //todo remove here or in camera.service
    setTimeout(() => {
      this.cameraService.updateCamera();
    }, 2000);

    //Redefine console.log to capture the errors that were previously captured by zxing-scanner
     this.originalConsoleError = console.error;
 
     console.error = (message?: string, ...optionalParams: string[]) => {
      if(message==="@zxing/ngx-scanner"){
        const logMessage = formatLogMessage(message, optionalParams);
        const err = new Error(logMessage);

        if(optionalParams[0]==="Can't get user media, this is not supported."){
          alert("Error: " + optionalParams[0]);
          this.saveErrorLog(err, 'noMediaError');
        }else{
          alert("Error: There was an error when trying to connect to the camera. It might be a permission error.");
          this.saveErrorLog(err, 'undefinedError');
        }
        return;
      }

      if (this.originalConsoleError) {
        this.originalConsoleError(message, ...optionalParams);
      }
      
     };
  }

  public onAutostarted(){
    this.selectedDevice$ = this.cameraService.navCamera$;
  }

  public onCodeResult(resultString: string) {
    this.qrCode.emit(resultString);
  }

  public async onCamerasFound(devices: MediaDeviceInfo[]): Promise<void> {
     this.availableDevices.emit(devices);
  }

  public onScanError(error: Error){
    this.saveErrorLog(error, 'scanError');
  }

  public onScanFailure(error: Exception|undefined){
    const exception: Error = error ?? new Error('Undefined scan failure');
    this.scanFailureSubject.next(exception);
  }

  public saveErrorLog(error: Error|undefined, exceptionType: CameraLogType) {
    this.cameraLogsService.addCameraLog(error, exceptionType);
  }

  public ngOnDestroy(): void {
    if(this.originalConsoleError){
      console.error = this.originalConsoleError;
    }
  }
}

export function formatLogMessage(message: any, optionalParams: any[]): string {
  const optionalParam1 = optionalParams.length > 0 ? optionalParams[0] : '';
  const optionalParam2 = optionalParams.length > 1 ? optionalParams[1] : '';
  return `${String(message)}. ${String(optionalParam1)} ${String(optionalParam2)}`;
}