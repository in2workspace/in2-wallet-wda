import { flush, TestBed } from '@angular/core/testing';
import { ToastServiceHandler } from './toast.service';
import { ToastController } from '@ionic/angular';
import { TranslateService, TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateFakeLoader } from '@ngx-translate/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
const TIME_IN_MS = 5000;

jest.useFakeTimers();

describe('ToastServiceHandler', () => {
  let service: ToastServiceHandler;
  let translateService: {get:jest.Mock};
  let translateSpy: jest.SpyInstance;
  let toastCtrl: {create:jest.Mock};
  let alert: {present:jest.Mock, dismiss:jest.Mock}

  beforeEach(() => {
    translateService = {
      get: jest.fn().mockImplementation((str:string)=>of(str))
    };

    toastCtrl = {
      create: jest.fn().mockResolvedValue({
        present: jest.fn().mockImplementation(()=>Promise.resolve()),
        dismiss: jest.fn().mockImplementation(()=>Promise.resolve(true)),
      }),
    } as any;

    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        }),
      ],
      providers: [
        { provide: TranslateService, useValue:translateService },
        { provide: ToastController, useValue: toastCtrl },
        ToastServiceHandler
      ],
    });
    service = TestBed.inject(ToastServiceHandler);
    translateSpy = jest.spyOn(translateService, 'get');
  });


  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should format message correctly and translate it', fakeAsync(() => {
    service.showErrorAlert('Any undefined test message');
    tick();
    expect(translateSpy).toHaveBeenCalledWith('errors.default');

    service.showErrorAlert("The received QR content cannot be processed");
    tick();
    expect(translateSpy).toHaveBeenCalledWith('errors.invalid-qr');

    service.showErrorAlert("Error while fetching credentialOffer from the issuer");
    tick();
    expect(translateSpy).toHaveBeenCalledWith("errors.expired-credentialOffer");
    
    service.showErrorAlert("Error while deserializing CredentialOffer");
    tick();
    expect(translateSpy).toHaveBeenCalledWith("errors.invalid-credentialOffer");
    
    service.showErrorAlert("Error while processing Credential Issuer Metadata from the Issuer");
    tick();
    expect(translateSpy).toHaveBeenCalledWith("errors.invalid-issuerMetadata");
    
    service.showErrorAlert("Error while fetching  Credential from Issuer");
    tick();
    expect(translateSpy).toHaveBeenCalledWith("errors.cannot-get-VC");

    service.showErrorAlert("Error processing Verifiable Credential");
    tick();
    expect(translateSpy).toHaveBeenCalledWith("errors.cannot-save-VC");

    service.showErrorAlert("Incorrect PIN");
    tick();
    expect(translateSpy).toHaveBeenCalledWith("errors.incorrect-pin");

    service.showErrorAlert("Unsigned");
    tick();
    expect(translateSpy).toHaveBeenCalledWith("errors.unsigned");
    
    service.showErrorAlert("ErrorUnsigned");
    tick();
    expect(translateSpy).toHaveBeenCalledWith("errors.Errunsigned");
  }));
 
  it('should create alert for an error message 1', async () => {
    const toastCtrlSpy = jest.spyOn(toastCtrl, 'create');
    const errorMessage = "The received QR content cannot be processed";

    service.showErrorAlert(errorMessage).subscribe(()=>{});
  
    expect(translateSpy).toHaveBeenCalledWith('errors.invalid-qr');
    expect(toastCtrlSpy).toHaveBeenCalled();
    expect(toastCtrlSpy).toHaveBeenCalledWith(expect.objectContaining(
      {
        [errorMessage]:'errors.invalid-qr'
      }
    ));
    const toast = await toastCtrlSpy.mock.results[0].value;

    expect(toast.present).toHaveBeenCalled();
    setTimeout(() => {
      expect(toast.dismiss).toHaveBeenCalled()
    }, TIME_IN_MS);

  });
 
  it('should create alert for an error message 2', async () => {
    const errorMessage = "Error while fetching credentialOffer from the issuer";
    const toastCtrlSpy = jest.spyOn(toastCtrl, 'create');

    service.showErrorAlert(errorMessage).subscribe(()=>{});
  
    expect(translateSpy).toHaveBeenCalledWith('errors.expired-credentialOffer');
    expect(toastCtrl.create).toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(expect.objectContaining(
      {
        [errorMessage]:"errors.expired-credentialOffer"
      }
    ));
    const toast = await toastCtrlSpy.mock.results[0].value;

    expect(toast.present).toHaveBeenCalled();
    setTimeout(() => {
      expect(toast.dismiss).toHaveBeenCalled()
    }, TIME_IN_MS);
  });

  it('should create alert for an error message 3', async () => {
    const errorMessage = "Error while deserializing CredentialOffer";
    const toastCtrlSpy = jest.spyOn(toastCtrl, 'create');

    service.showErrorAlert(errorMessage).subscribe(()=>{});
  
    expect(translateSpy).toHaveBeenCalledWith('errors.invalid-credentialOffer');
    expect(toastCtrl.create).toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(expect.objectContaining(
      {
        [errorMessage]:"errors.invalid-credentialOffer"
      }
    ));

    const toast = await toastCtrlSpy.mock.results[0].value;

    expect(toast.present).toHaveBeenCalled();
    setTimeout(() => {
      expect(toast.dismiss).toHaveBeenCalled()
    }, TIME_IN_MS);
  });

  it('should create alert for an error message 4', async () => {
    const errorMessage = "Error while processing Credential Issuer Metadata from the Issuer";
    const toastCtrlSpy = jest.spyOn(toastCtrl, 'create');

    service.showErrorAlert(errorMessage).subscribe(()=>{});
    
    expect(translateSpy).toHaveBeenCalledWith('errors.invalid-issuerMetadata');
    expect(toastCtrl.create).toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(expect.objectContaining(
      {
        [errorMessage]: "errors.invalid-issuerMetadata"
      }
    ));
    
    const toast = await toastCtrlSpy.mock.results[0].value;

    expect(toast.present).toHaveBeenCalled();
    setTimeout(() => {
      expect(toast.dismiss).toHaveBeenCalled()
    }, TIME_IN_MS);
  });
  
  it('should create alert for an error message 5', async () => {
    const errorMessage = "Error while fetching  Credential from Issuer";
    const toastCtrlSpy = jest.spyOn(toastCtrl, 'create');

    service.showErrorAlert(errorMessage).subscribe(()=>{});
    
    expect(translateSpy).toHaveBeenCalledWith('errors.cannot-get-VC');
    expect(toastCtrl.create).toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(expect.objectContaining(
      {
        [errorMessage]: "errors.cannot-get-VC"
      }
    ));
    
    const toast = await toastCtrlSpy.mock.results[0].value;

    expect(toast.present).toHaveBeenCalled();
    setTimeout(() => {
      expect(toast.dismiss).toHaveBeenCalled()
    }, TIME_IN_MS);
  });
  
  it('should create alert for an error message 6', async () => {
    const errorMessage = "Error processing Verifiable Credential";
    const toastCtrlSpy = jest.spyOn(toastCtrl, 'create');

    service.showErrorAlert(errorMessage).subscribe(()=>{});
    
    expect(translateSpy).toHaveBeenCalledWith('errors.cannot-save-VC');
    expect(toastCtrl.create).toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(expect.objectContaining(
      {
        [errorMessage]: "errors.cannot-save-VC"
      }
    ));
    const toast = await toastCtrlSpy.mock.results[0].value;

    expect(toast.present).toHaveBeenCalled();
    setTimeout(() => {
      expect(toast.dismiss).toHaveBeenCalled()
    }, TIME_IN_MS);
  });
  
  it('should create alert for an error message 7', async () => {
    const errorMessage = "Incorrect PIN";
    const toastCtrlSpy = jest.spyOn(toastCtrl, 'create');

    service.showErrorAlert(errorMessage).subscribe(()=>{});
    
    expect(translateSpy).toHaveBeenCalledWith('errors.incorrect-pin');
    expect(toastCtrl.create).toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(expect.objectContaining(
      {
        [errorMessage]: "errors.incorrect-pin"
      }
    ));
   
    const toast = await toastCtrlSpy.mock.results[0].value;

    expect(toast.present).toHaveBeenCalled();
    setTimeout(() => {
      expect(toast.dismiss).toHaveBeenCalled()
    }, TIME_IN_MS);
  });
  
  it('should create alert for an error message 8', async () => {
    const errorMessage = "Unsigned";
    const toastCtrlSpy = jest.spyOn(toastCtrl, 'create');

    service.showErrorAlert(errorMessage).subscribe(()=>{});
    
    expect(translateSpy).toHaveBeenCalledWith('errors.unsigned');
    expect(toastCtrl.create).toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(expect.objectContaining(
      {
        [errorMessage]: "errors.unsigned"
      }
    ));
    
    const toast = await toastCtrlSpy.mock.results[0].value;

    expect(toast.present).toHaveBeenCalled();
    setTimeout(() => {
      expect(toast.dismiss).toHaveBeenCalled()
    }, TIME_IN_MS);
  });
  
  it('should create alert for an error message 9', async () => {
    const errorMessage = "ErrorUnsigned";
    const toastCtrlSpy = jest.spyOn(toastCtrl, 'create');

    service.showErrorAlert(errorMessage).subscribe(()=>{});
    
    expect(translateSpy).toHaveBeenCalledWith('errors.Errunsigned');
    expect(toastCtrl.create).toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalledWith(expect.objectContaining(
      {
        [errorMessage]: "errors.Errunsigned"
      }
    ));
    
    const toast = await toastCtrlSpy.mock.results[0].value;

    expect(toast.present).toHaveBeenCalled();
    setTimeout(() => {
      expect(toast.dismiss).toHaveBeenCalled()
    }, TIME_IN_MS);
  });
  
});
