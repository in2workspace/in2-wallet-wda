import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { WebsocketService } from './websocket.service';
import { AuthenticationService } from './authentication.service';
import { AlertController } from '@ionic/angular';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TranslateModule } from '@ngx-translate/core';



let mockWebSocketInstance: any;
let mockWebSocketConstructor: any;
let originalWebSocket: any;
let service: WebsocketService;

class MockOidcSecurityService {
  checkAuth() {
    return of({ userData: {}, accessToken: 'fake-token' });
  }

  getToken() {
    return 'fake-token';
  }

  logoff() {}
}

class MockAlertController {
  create() {
    return Promise.resolve({
      present: () => Promise.resolve(),
      onDidDismiss: () => Promise.resolve({ data: { values: { pin: '1234' } } }),
    });
  }
}

describe('WebsocketService', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        WebsocketService,
        AuthenticationService,
        { provide: AlertController, useClass: MockAlertController },
        { provide: OidcSecurityService, useClass: MockOidcSecurityService },
      ],
    });

    service = TestBed.inject(WebsocketService);

    mockWebSocketInstance = {
      send: jest.fn(),
      close: jest.fn(),
      readyState: 1,
      onmessage: jest.fn(),
      onclose: jest.fn(),
      onopen: jest.fn(),
    } as any;

    mockWebSocketConstructor = jest.fn(() => mockWebSocketInstance);
    mockWebSocketConstructor['OPEN'] = 1;
    window['WebSocket'] = mockWebSocketConstructor as any;

    originalWebSocket = window['WebSocket'];
    jest.spyOn(service, 'sendMessage');
  });

  afterEach(() => {
    service.closeConnection();
    window['WebSocket'] = originalWebSocket;
    jest.clearAllMocks();
  });

  it('should create and open a WebSocket connection', fakeAsync(() => {
    service.connect();
    expect(window.WebSocket).toHaveBeenCalledWith(`${environment.websocket_url}${environment.websocket_uri}`);
    expect(service.sendMessage).not.toHaveBeenCalled();
  }));

  it('should send a message when WebSocket is open', fakeAsync(() => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const token = service['authenticationService'].getToken();
    service.connect();
    
    mockWebSocketInstance.onopen('open');
    expect(service.sendMessage).toHaveBeenCalled();
    expect(service.sendMessage).toHaveBeenCalledWith(JSON.stringify({ id: token }));
    expect(logSpy).toHaveBeenCalledWith('WebSocket connection opened');
  }));

  it('should handle incoming messages', fakeAsync(() => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const createAlertSpy = jest.spyOn(service['alertController'], 'create');
    service.connect();

    const messageEvent = new MessageEvent('message', { data: JSON.stringify({ tx_code: { description: 'Test description' } }) });
    
    mockWebSocketInstance.onmessage(messageEvent);
    expect(logSpy).toHaveBeenCalledWith('Message received:', messageEvent.data);
    expect(createAlertSpy).toHaveBeenCalled();
  }));


  it('should create and display an alert on receiving a message', fakeAsync(async () => {
    const createAlertSpy = jest.spyOn(service['alertController'], 'create');
    const description = 'Test description';
    const timeout = 120;
    const messageEvent = new MessageEvent('message', {
      data: JSON.stringify({ tx_code: { description }, timeout }),
    });
  
    service.connect();
  
    mockWebSocketInstance.onmessage(messageEvent);
  
    tick();
    expect(createAlertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        header: service['translate'].instant('confirmation.pin'),
        message: `${description}<br><small class="counter">Time remaining: ${timeout} seconds</small>`,
        inputs: [
          {
            name: 'pin',
            type: 'text',
            placeholder: 'PIN',
            attributes: {
              inputmode: 'numeric',
              pattern: '[0-9]*',
            },
          },
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: expect.any(Function),
          },
          {
            text: 'Send',
            handler: expect.any(Function),
          },
        ],
      })
    );
    tick();
  }));


  

  it('should log message on WebSocket close', fakeAsync(() => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    service.connect();

    mockWebSocketInstance.onclose(new CloseEvent('close'));
    expect(logSpy).toHaveBeenCalledWith('WebSocket connection closed');
  }));

  it('should send a message', fakeAsync(() => {
    service['socket'] = mockWebSocketInstance;
    
    service.sendMessage('Test Message');

    expect(service['socket'].send).toHaveBeenCalledWith('Test Message');
    expect(service['socket'].send).toHaveBeenCalledTimes(1);

    const logErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    service['socket'] = { ...mockWebSocketInstance, readyState: 999 };

    service.sendMessage('Test Message 2');

    expect(service['socket'].send).toHaveBeenCalledTimes(1);
    expect(logErrorSpy).toHaveBeenCalledWith('WebSocket connection is not open.');

  }));

  it('should close WebSocket connection', () => {
    service.connect();

    service.closeConnection();

    expect(service['socket'].close).toHaveBeenCalledTimes(1);
  });

  it('hauria de cridar setInterval', () => {
    service['socket'] = mockWebSocketInstance;
    const alertMock = { message: '', dismiss: jest.fn() };
    const description = 'Test description';
    const initialCounter = 3;
  
    jest.useFakeTimers();
  
    const setIntervalSpy = jest.spyOn(window, 'setInterval');
  
    service['startCountdown'](alertMock, description, initialCounter);
  
    expect(setIntervalSpy).toHaveBeenCalled();
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
  
    setIntervalSpy.mockRestore();
  });
  
  it('hauria de decrementar el comptador i actualitzar el missatge d\'alerta', () => {
    service['socket'] = mockWebSocketInstance;
    const alertMock = { message: '', dismiss: jest.fn() };
    const description = 'Test description';
    const initialCounter = 3;
  

    jest.useFakeTimers();

    jest.spyOn(alertMock, 'dismiss');
    jest.spyOn(service['toastService'], 'showErrorAlert').mockReturnValue(of(null));
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
  
    service['startCountdown'](alertMock, description, initialCounter);
  
    jest.advanceTimersByTime(1000); 
    expect(alertMock.message).toContain('Time remaining: 2 seconds');
  
    jest.advanceTimersByTime(1000);
    expect(alertMock.message).toContain('Time remaining: 1 seconds');
  
    jest.advanceTimersByTime(2000); 
    expect(alertMock.dismiss).toHaveBeenCalled();
    expect(service['toastService'].showErrorAlert).toHaveBeenCalledWith('PIN expired');
    expect(clearIntervalSpy).toHaveBeenCalled();
  
    jest.clearAllTimers();
    clearIntervalSpy.mockRestore();
  });
  
  

});
