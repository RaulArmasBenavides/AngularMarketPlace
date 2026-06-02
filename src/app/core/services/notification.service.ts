import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  private notificationId = 0;

  showSuccess(message: string, duration: number = 5000): void {
    this.show({ message, type: 'success', duration });
  }

  showError(message: string, duration: number = 5000): void {
    this.show({ message, type: 'error', duration });
  }

  showWarning(message: string, duration: number = 5000): void {
    this.show({ message, type: 'warning', duration });
  }

  showInfo(message: string, duration: number = 5000): void {
    this.show({ message, type: 'info', duration });
  }

  private show(config: { message: string; type: Notification['type']; duration?: number }): void {
    const notification: Notification = {
      id: `notification-${++this.notificationId}`,
      message: config.message,
      type: config.type,
      duration: config.duration
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, notification]);

    if (config.duration) {
      setTimeout(() => {
        this.remove(notification.id);
      }, config.duration);
    }
  }

  remove(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next(
      currentNotifications.filter((n) => n.id !== id)
    );
  }

  clear(): void {
    this.notificationsSubject.next([]);
  }
}
