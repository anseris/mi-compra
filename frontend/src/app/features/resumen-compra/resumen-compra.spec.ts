import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListaCompraService } from "../../core/services/lista-compra.service";

import { ResumenCompra } from './resumen-compra';

describe('ResumenCompra', () => {
  let component: ResumenCompra;
  let fixture: ComponentFixture<ResumenCompra>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumenCompra],
      providers: [
        {
          provide: ListaCompraService,
          useValue: { items: signal([]) },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResumenCompra);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
