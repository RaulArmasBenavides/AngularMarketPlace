import { IPaymentProvider, PaymentDetails } from './payment-provider.interface';

export interface PayPalButtonsConfig {
  createOrder: (data: unknown, actions: unknown) => Promise<string>;
  onApprove: (data: unknown, actions: unknown) => Promise<void>;
  onError: (err: Error) => void;
}

export interface IPaypalPaymentProvider extends IPaymentProvider {
  /**
   * Initialize and render PayPal buttons
   */
  initializePayPalButtons(
    containerSelector: string,
    onApprove: (details: PaymentDetails) => void
  ): void;
}
