import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { TabsPage } from './tabs.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { LangChangeEvent, TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Router, RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA, EventEmitter } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';

describe('TabsPage', () => {
  let component: TabsPage;
  let fixture: ComponentFixture<TabsPage>;
  let mockTranslateService: any;
  let routerMock: {
    navigate: any, 
    navigateByUrl: any,
    routerState:any,
    createUrlTree: any,
    serializeUrl: any
  };

  beforeEach(waitForAsync(() => {
    mockTranslateService = {
      currentLang: 'de',
      addLangs: jest.fn(),
      setDefaultLang: jest.fn(),
      get: jest.fn().mockImplementation((key: string): Observable<string> => {
        return of(key);
      }),
      onLangChange: new EventEmitter<LangChangeEvent>(),
      use: jest.fn(),
      onTranslationChange: new EventEmitter(),
      onDefaultLangChange: new EventEmitter()
    };
    routerMock = {
      routerState: { root: '' },
      navigate: jest.fn(),
      navigateByUrl: jest.fn().mockResolvedValue(''),
      createUrlTree: jest.fn(),
      serializeUrl: jest.fn()
    }

    const navCtrlMock = { navigateForward: jest.fn() };

    TestBed.configureTestingModule({
      declarations:[TranslatePipe],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        TranslateModule.forRoot(),
        IonicModule
      ],
      providers: [
        { provide: Router, useValue: routerMock},
        { provide: NavController, useValue: navCtrlMock},
        { provide: TranslateService, useValue: mockTranslateService }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA], 
    });

    fixture = TestBed.createComponent(TabsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to uri skipping location', fakeAsync(()=>{
    const navByUrlSpy = jest.spyOn(routerMock, 'navigateByUrl');
    const navigateSpy = jest.spyOn(routerMock, 'navigate');
    const uri = 'randomUri';

    component.redirectTo(uri);
    tick();

    expect(navByUrlSpy).toHaveBeenCalledWith('/', { skipLocationChange: true });
    expect(navigateSpy).toHaveBeenCalledWith([uri]);
  }));
});
