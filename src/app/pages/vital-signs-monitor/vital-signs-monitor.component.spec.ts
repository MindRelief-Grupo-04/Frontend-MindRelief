import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VitalSignsMonitorComponent } from './vital-signs-monitor.component';

describe('VitalSignsMonitorComponent', () => {
  let component: VitalSignsMonitorComponent;
  let fixture: ComponentFixture<VitalSignsMonitorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VitalSignsMonitorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VitalSignsMonitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
