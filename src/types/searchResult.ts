

export interface SearchResult {
    identifier?: string;
    account?: string;
    collection?: string;
    image_url?: string; // Main image URL for the primary node
    opensea_url?: string; // Optional OpenSea URL for NFTs
    link?: string; // Optional link for accounts
    neighbors?: Neighbor[];
    relationships?: Relationship[];
  }
  
  export interface Neighbor {
    value: string;
    link?: string; // Optional link
    collection?: string;
    type: string;
    image?: string; // Ensure the image property is optional
  }
  
  export interface Relationship {
    from_: {
      value: string;
      collection?: string;
      type: string;
      image?: string; // Add the image property if needed
    };
    to: {
      value: string;
      collection?: string;
      type: string;
      image?: string; // Add the image property if needed
    };
    relationship: {
      property: string;
      type: string;
      transaction_event_type?: string;
      nft_identifier?: string;
      nft_collection?: string;
      link_etherscan?: string; // Optional etherscan link
    };
  }
  
  
  