import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeRuta } from './de-ruta';

describe('DeRuta', () => {
  let component: DeRuta;
  let fixture: ComponentFixture<DeRuta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeRuta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeRuta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
