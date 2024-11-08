import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CredentialsTabComponent } from './credentials-tab.component';

describe('CredentialsTabComponent', () => {
  let component: CredentialsTabComponent;
  let fixture: ComponentFixture<CredentialsTabComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CredentialsTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CredentialsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
