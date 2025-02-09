interface PointDetail {
    name: string;
    coordinates: [number, number]; 
    photoQuery?: string;
    arrivalTime: string;
    departureTime: string;
    description: string;
  }
  
  interface Jour {
    day: number;
    points: PointDetail[];
    mode: "walking" | "driving";
    routes: {
      path: [number, number][];
    };
  }
  
  export interface Voyage {
    id: string;
    name: string;
    jours: Jour[];
  }
  