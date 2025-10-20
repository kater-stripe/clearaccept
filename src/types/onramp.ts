export enum DestinationNetwork {
    Ethereum = 'ethereum',
    Bitcoin = 'bitcoin',
    Solana = 'solana',
    Polygon = 'polygon',
    Base = 'base',
    Stellar = 'stellar',
    Avalanche = 'avalanche',
  }
  
  export enum DestinationCurrency {
    Eth = 'eth',
    Usdc = 'usdc',
    Btc = 'btc',
    Xlm = 'xlm',
    Matic = 'matic',
    Sol = 'sol',
    Avax = 'avax',
  }
  
  export interface OnrampCreateBody {
    source_currency?: 'usd' | 'eur';
    amount?: {
      source_amount?: string | number;
      destination_amount?: string | number;
    };
    destination_currencies?: DestinationCurrency[];
    destination_networks?: DestinationNetwork[];
    destination_currency?: DestinationCurrency;
    destination_network?: DestinationNetwork;
    wallet_address?: string;
    lock_wallet_address?: boolean;
  }
  
  export interface OnrampSessionResponse {
    id: string;
    client_secret: string;
    redirect_url?: string | null;
  }
  
  export interface ServerErrorPayload {
    error?: string;
  }
  
  export interface OnrampCreateParams {
    source_currency?: 'usd' | 'eur';
    destination_currency?: DestinationCurrency;
    destination_network?: DestinationNetwork;
    destination_currencies?: DestinationCurrency[];
    destination_networks?: DestinationNetwork[];
    wallet_addresses?: Record<string, string>;
    source_amount?: string;
    destination_amount?: string;
  }
  
  export interface OnrampSession {
    id: string;
    client_secret: string;
    redirect_url?: string | null;
  }
  