import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ScanComponent } from './scan.component';
import { of, Subject } from 'rxjs';
import { WebsocketService } from 'src/app/services/websocket.service';
import { WalletService } from 'src/app/services/wallet.service';
import { Router } from '@angular/router';
import { CameraLogsService } from 'src/app/services/camera-logs.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { QRCodeModule } from 'angularx-qrcode';

describe('ScanComponent', () => {
  let component: ScanComponent;
  let fixture: ComponentFixture<ScanComponent>;
  let mockCameraLogsService: {addCameraLog:any};
  let mockRouter : {navigate: any, events: any};
  let walletServiceSpy: jest.Mocked<WalletService>;
  let websocketServiceSpy: jest.Mocked<WebsocketService>;

  beforeEach(waitForAsync(() => {
    mockCameraLogsService = {
      addCameraLog: jest.fn()
    } as any;

    mockRouter = {
       events: new Subject<any>(),
      navigate: jest.fn()
    }

    walletServiceSpy = {
      getAllVCs: jest.fn().mockReturnValue(of([])),
      requestCredential: jest.fn().mockReturnValue(of({} as any)),
      deleteVC: jest.fn(),
      executeContent: jest.fn().mockReturnValue(of({} as any))
    } as unknown as jest.Mocked<WalletService>;

    websocketServiceSpy = {
      connect: jest.fn(),
      closeConnection: jest.fn()
    } as unknown as jest.Mocked<WebsocketService>;

    TestBed.configureTestingModule({
      schemas:[NO_ERRORS_SCHEMA],
      imports: [ScanComponent, IonicModule, QRCodeModule],
      providers: [
        { provide: Router, useValue: mockRouter},
        { provide: WalletService, useValue: walletServiceSpy},
        { provide: WebsocketService, useValue: websocketServiceSpy},
        { provide: CameraLogsService, useValue: mockCameraLogsService},
        Storage
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ScanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });


   // it('should not untoggle scan if the destination starts with /tabs/credentials', () => {
  //   const mockNavigationEndEvent = new NavigationEnd(42, '/tabs/credentials', '/tabs/credentials/some-subroute');
  //   walletServiceSpy.getAllVCs.mockReturnValue(of([]));
  //   const detectChangesSpy = jest.spyOn(component['cdr'], 'detectChanges');

  //   jest.spyOn(mockRouter.events, 'pipe').mockReturnValue(of(mockNavigationEndEvent));

  //   expect(untoggleScanSpy).not.toHaveBeenCalled();
  //   expect(detectChangesSpy).not.toHaveBeenCalled();
  // });

  
  // it('qrCodeEmit should process QR code after websocket connection', () => {
  //   jest.spyOn(mockRouter, 'navigate');
  //   const testQrCode = "someTestQrCode";

  //   component.qrCodeEmit(testQrCode);

  //   setTimeout(()=>{
  //     expect(walletServiceSpy.executeContent).toHaveBeenCalledWith(testQrCode);
  //     expect(websocketServiceSpy.connect).toHaveBeenCalled();
  //     expect(mockRouter.navigate).toHaveBeenCalledWith(['/tabs/vc-selector/'], { queryParams: { executionResponse: JSON.stringify({}) } });
  //   }, 1000);
  // });


  // it('should log error to cameraLogsService when executeContent fails', () => {
  //   const mockErrorResponse = {
  //     error: {
  //       title: 'Test Error Title',
  //       message: 'Test Error Message',
  //       path: '/test/error/path'
  //     }
  //   };
  //   const errorMessage = `${mockErrorResponse.error.title} . ${mockErrorResponse.error.message} . ${mockErrorResponse.error.path}`;

  //   jest.spyOn(walletServiceSpy, 'executeContent').mockReturnValueOnce(throwError(() => mockErrorResponse));

  //   const addCameraLogSpy = jest.spyOn((component as any).cameraLogsService, 'addCameraLog');

  //   component.qrCodeEmit('someQrCode');
  //   setTimeout(()=>{
  //     expect(addCameraLogSpy).toHaveBeenCalledWith(new Error(errorMessage), 'httpError');
  //   }, 1000);
  // });
});
