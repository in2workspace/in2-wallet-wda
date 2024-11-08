import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, shareReplay } from 'rxjs';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class CameraService {
  public mediaDeviceInfoNull: MediaDeviceInfo|undefined = undefined;
  public camera = new BehaviorSubject<MediaDeviceInfo|undefined>(
    this.mediaDeviceInfoNull
  );
  public navCamera$ = this.camera.asObservable().pipe(
    distinctUntilChanged(),
    shareReplay(1),
    );

  public constructor(private storageService: StorageService) {
    //todo remove here or in barcode component
    this.updateCamera();
  }

  public changeCamera(camera: MediaDeviceInfo) {
    this.camera.next(camera);
    this.storageService.set('camera', camera);
  }

  public async updateCamera() {
    const result = await this.storageService.get('camera');
    console.log('Camera from storage:');
    console.log(result);

    if (result != null && this.isValidMediaDeviceInfo(result)) {
      const isAvailable = await this.isCameraAvailable(result);
      
      if (isAvailable) {
        this.camera.next(result);
      } else {
        console.warn('Stored camera not available');
        this.noCamera();
      }
    } else {
      console.warn('Stored camera is not valid or null');
      this.noCamera();
    }
  }

  public async noCamera() {
    await this.storageService.remove('camera');
    this.camera.next(this.mediaDeviceInfoNull);
  }

  public async isCameraAvailable(camera: MediaDeviceInfo): Promise<boolean> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const availableCamera = devices.find(
      (device) => device.deviceId === camera.deviceId && device.kind === 'videoinput'
    );
    return !!availableCamera;
  }

  private isValidMediaDeviceInfo(object: any): object is MediaDeviceInfo {
    return (
      object &&
      typeof object.deviceId === 'string' &&
      typeof object.label === 'string' &&
      typeof object.kind === 'string' &&
      object.kind === 'videoinput'
    );
  }
}
