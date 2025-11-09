export interface PhotoTag {
  id: string;
  recordId: string;
  bandNumber: string;
  date: string;
  location: string;
  species: string;
  age: string;
  sex: string;
  firstPhotoNumber?: string;
  lastPhotoNumber?: string;
  wrpPlumageCode?: string;
  notes?: string;
  createdAt: string;
}

export interface Photo {
  id: string;
  googleDriveId: string;
  name: string;
  imageUrl: string;              // Direct Google Drive thumbnail URL
  webViewLink: string;
  tags: PhotoTag[];
  createdAt: string;
}

export interface FilterCriteria {
  recordId?: string;
  bandNumber?: string;
  date?: string;
  location?: string;
  species?: string;
  age?: string;
  sex?: string;
  notes?: string;
}
