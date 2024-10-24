import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { CameraService } from './camera.service';
import { StorageService } from './storage.service';

const mockCamera = {
  deviceId: 'existingCameraId',
  groupId: 'existingGroupId',
  kind: 'videoinput',
  label: 'Existing Camera',
  toJSON() { return {}; }
}

class MockStorageService {
  private storage = new Map<string, any>();

  async set(key: string, value: any): Promise<void> {
    this.storage.set(key, value);
  }

  async get(key: string): Promise<any> {
    return this.storage.get(key);
  }

  async remove(key: string): Promise<void> {
    this.storage.delete(key);
  }
}

describe('CameraService', () => {
  let cameraService: CameraService;
  let mockStorageService: MockStorageService;

  beforeEach(() => {
    mockStorageService = new MockStorageService();

    TestBed.configureTestingModule({
      providers: [
        CameraService,
        { provide: StorageService, useValue: mockStorageService },
      ],
    });

    cameraService = TestBed.inject(CameraService);
    mockStorageService = TestBed.inject(StorageService) as unknown as MockStorageService;
  });

  it('should create', () => {
    expect(cameraService).toBeTruthy();
  });

  it('should update camera on initialization', async () => {
    const updateSpy = jest.spyOn(cameraService, 'updateCamera');
    cameraService.updateCamera();
    expect(updateSpy).toHaveBeenCalled();
  });

  it('noCamera should remove camera from storage and update camera with mediaDeviceInfoNull', fakeAsync(()=>{
    const camSpy = jest.spyOn(mockStorageService, 'remove').mockImplementation(camera=>Promise.resolve());
    cameraService.noCamera();
    tick();
    expect(camSpy).toHaveBeenCalled();
    cameraService.camera.subscribe(cam=>{
      expect(cam).toBe(undefined);
    })
    flush();
  }));

  it('should change camera', fakeAsync(() => {
    const mockCamera: MediaDeviceInfo = {
      deviceId: 'newCameraId',
      groupId: 'newGroupId',
      kind: 'videoinput',
      label: 'New Camera',
      toJSON() { return {}; }
    };

    const storageSpy = jest.spyOn(mockStorageService, 'set');

    cameraService.changeCamera(mockCamera);
    tick();

    cameraService.navCamera$.subscribe((camera) => {
      expect(camera?.deviceId).toEqual('newCameraId');
      expect(camera?.kind).toEqual('videoinput');
    });

    flush();
    expect(storageSpy).toHaveBeenCalled();
  }));

  it('should set camera to null if not valid and warn', async () => {
    const storageSpy = jest.spyOn(mockStorageService, 'get').mockReturnValue(Promise.resolve({}));
    const isValidSpy = jest.spyOn(cameraService, 'isValidMediaDeviceInfo' as any).mockReturnValue(false);
 
    const noCameraSpy = jest.spyOn(cameraService, 'noCamera');
    const consoleSpy = jest.spyOn(console, 'warn');

    await cameraService.updateCamera();
  
    expect(storageSpy).toHaveBeenCalled();
    expect(isValidSpy).toHaveBeenCalled();
    expect(noCameraSpy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should set camera to null if not available and warn', async () => {
    jest.spyOn(mockStorageService, 'get').mockReturnValue(Promise.resolve({}));
    jest.spyOn(cameraService, 'isValidMediaDeviceInfo' as any).mockReturnValue(true);
    const isAvailableSpy = jest.spyOn(cameraService, 'isCameraAvailable').mockImplementation(()=>Promise.resolve(false));
    const noCameraSpy = jest.spyOn(cameraService, 'noCamera');
    const consoleWarnSpy = jest.spyOn(console, 'warn');
    const consoleLogSpy = jest.spyOn(console, 'log');

    await cameraService.updateCamera();
  

    expect(isAvailableSpy).toHaveBeenCalled();
    expect(noCameraSpy).toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalled();
    
  });

  it('should update camera if exists and is valid', async () => {
    jest.spyOn(mockStorageService, 'get').mockReturnValue(Promise.resolve(mockCamera));
    jest.spyOn(cameraService, 'isValidMediaDeviceInfo' as any).mockImplementation(()=>Promise.resolve(true));
    jest.spyOn(cameraService, 'isCameraAvailable').mockImplementation(()=>Promise.resolve(true));
    const noCameraSpy = jest.spyOn(cameraService, 'noCamera');

    await cameraService.updateCamera();

    cameraService.navCamera$.subscribe((camera) => {
      expect(camera?.deviceId).toEqual('existingCameraId');
      expect(camera?.label).toEqual('Existing Camera');
    });
  });


  it('isCameraAvailable should return true if camera is available', async () => {
    const mockEnumerateDevices = jest.fn(async () => {
      return new Promise<{}[]>(resolve => {
          resolve([mockCamera])
      })
    })
    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      value: {
          enumerateDevices: mockEnumerateDevices,
      },
      configurable: true
    });

    const result = await cameraService.isCameraAvailable(mockCamera as MediaDeviceInfo);
    expect(result).toBe(true);
  });

  it('isCameraAvailable should return false if camera is not available', async () => {
    const mockEnumerateDevices = jest.fn(async () => {
      return new Promise<{}[]>(resolve => {
          resolve([])
      })
    })
    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      value: {
          enumerateDevices: mockEnumerateDevices,
      },
      configurable: true
    });

    const result = await cameraService.isCameraAvailable(mockCamera as MediaDeviceInfo);
    expect(result).toBe(false);
  });

  it('should validate correctly media device info', ()=>{
    
    const validation = (cameraService as any).isValidMediaDeviceInfo(mockCamera);
    expect(validation).toBe(true);

    const invalidDevice = {
      deviceId: 1,
      groupId: 'existingGroupId',
      kind: 'videoinput',
      label: 'Existing Camera',
      toJSON() { return {}; }
    };
    const noValidation = (cameraService as any).isValidMediaDeviceInfo(invalidDevice);
    expect(noValidation).toBe(false);
  });

});