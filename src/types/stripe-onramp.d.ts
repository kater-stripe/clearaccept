declare global {
  enum OnrampStatus {
    Initialized = 'initialized',
    Rejected = 'rejected',
    RequiresPayment = 'requires_payment',
    FulfillmentProcessing = 'fulfillment_processing',
    FulfillmentComplete = 'fulfillment_complete',
  }

  interface OnrampSessionUpdatedEvent {
    payload?: { session?: { status?: OnrampStatus } };
  }

  interface StripeOnrampSession {
    addEventListener: (
      event: 'onramp_session_updated',
      cb: (evt: OnrampSessionUpdatedEvent) => void,
    ) => void;
    mount: (el: HTMLElement) => void;
  }

  interface StripeOnramp {
    createSession(input: { clientSecret: string }): StripeOnrampSession;
  }

  interface Window {
    StripeOnramp?: (pk: string) => StripeOnramp;
  }
}
export {};
