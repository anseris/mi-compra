import { Injectable, inject } from "@angular/core";
import { MessageService } from "primeng/api";

@Injectable({
  providedIn: "root",
})
export class NotificacionesService {
  private readonly messageService = inject(MessageService);

  error(mensaje: string): void {
    this.messageService.add({
      severity: "error",
      summary: "Error",
      detail: mensaje,
      life: 5000,
    });
  }

  exito(mensaje: string): void {
    this.messageService.add({
      severity: "success",
      summary: "Correcto",
      detail: mensaje,
      life: 3500,
    });
  }

  info(mensaje: string): void {
    this.messageService.add({
      severity: "info",
      summary: "Información",
      detail: mensaje,
      life: 3500,
    });
  }
}
